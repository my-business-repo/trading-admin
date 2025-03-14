import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { generateTransactionId } from "@/lib/utils";
import { withdrawalSchema } from "@/zodValidate/validate";

export async function POST(req: NextRequest) {
  const customer = await authenticateRequest(req);
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse and validate request body
  const body = await req.json();
  const validatedData = withdrawalSchema.parse(body);

  // Find the account and verify ownership
  const account = await prisma.account.findFirst({
    where: {
      customerId: Number(customer.id),
      currency: validatedData.currency
    },
  });


  if (!account) {
    return NextResponse.json(
      { error: "Account not found or access denied" },
      { status: 404 }
    );
  }

  if (!account.isActive) {
    return NextResponse.json(
      { error: "Account is inactive" },
      { status: 400 }
    );
  }

  if (account.balance.toNumber() < validatedData.amount) {
    return NextResponse.json(
      { error: "Insufficient balance" },
      { status: 400 }
    );
  }


  // amount - 1% fee
  const amount = validatedData.amount - (validatedData.amount * 0.01);
  // subtract amount from account balance
  await prisma.account.update({
    where: { id: account.id },
    data: {
      balance: account.balance.minus(amount),
      inreview_balance: account.inreview_balance.plus(amount),
      updatedAt: new Date()
    }
  });


  // Create transaction and update account balance in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the transaction record
    const transaction = await tx.transaction.create({
      data: {
        transactionId: generateTransactionId(),
        type: "WITHDRAWAL",
        amount: validatedData.amount,
        address: validatedData.address,
        currency: validatedData.currency,
        description: validatedData.description,
        status: "PENDING",
        accountId: account.id,
        updatedAt: new Date(),
      },
    });
    return { transaction };
  });

  return NextResponse.json({
    message: "Withdrawal successful",
    transaction: {
      transactionId: result.transaction.transactionId,
      type: result.transaction.type,
      amount: result.transaction.amount,
      description: result.transaction.description,
      status: result.transaction.status,
      accountId: result.transaction.accountId,
      createdAt: result.transaction.createdAt,
      address: result.transaction.address,
      currency: result.transaction.currency,
    },
  });
}


export async function GET(req: NextRequest) {
  // Verify customer token and get customer data
  const customer = await authenticateRequest(req);
  if (!customer) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const accounts = await prisma.account.findMany({
    where: {
      customerId: Number(customer.id)
    }
  })

  let transactions = [];

  for (const account of accounts) {
    const accountTransactions = await prisma.transaction.findMany({
      where: {
        accountId: account.id,
        type: "WITHDRAWAL"
      }
    })
    transactions.push(accountTransactions)
  }

  return NextResponse.json(transactions);
}