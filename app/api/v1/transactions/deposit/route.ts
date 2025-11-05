import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { generateTransactionId } from "@/lib/utils";
import { depositSchema } from "@/zodValidate/validate";
import { z } from "zod";
import { addNewNoti } from "@/app/utils.ts/common";
import { notification_type } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    // Verify customer token and get customer data
    const customer = await authenticateRequest(req);
    if (!customer) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();

    const validatedData = depositSchema.parse(body);

    // Find the account and verify ownership
    const account = await prisma.account.findUnique({
      where: {
        accountNo: validatedData.accountNo,
        customerId: Number(customer.id)
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

    // Create transaction and update account balance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the transaction record
      const transaction = await tx.transaction.create({
        data: {
          transactionId: generateTransactionId(),
          type: "DEPOSIT",
          amount: validatedData.amount,
          description: validatedData.description,
          status: "PENDING",
          accountId: account.id,
          updatedAt: new Date(),
        },
      });

      // Update account balance
      // const updatedAccount = await tx.account.update({
      //   where: { id: account.id },
      //   data: {
      //     balance: {
      //       increment: validatedData.amount,
      //     },
      //   },
      // });

      return { transaction };  //, account: updatedAccount 
    });

    return NextResponse.json({
      message: "Deposit successful",
      transaction: {
        transactionId: result.transaction.transactionId,
        type: result.transaction.type,
        amount: result.transaction.amount,
        description: result.transaction.description,
        status: result.transaction.status,
        accountId: result.transaction.accountId,
        createdAt: result.transaction.createdAt,
      },
      // account: {
      //   accountNo: result.account.accountNo,
      //   balance: result.account.balance,
      //   currency: result.account.currency,
      // },
    });

  } catch (error: any) {
    console.error("Deposit error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process deposit" },
      { status: 500 }
    );
  }
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
        type: "DEPOSIT"
      }
    })
    transactions.push(accountTransactions)
  }

  // After fetching the deposit transactions, add a notification for viewing deposit transactions
  if (transactions.length > 0) {
    // This uses the structure seen in other noti usage, but you may need to import addNewNoti, notification_type at the top level if not present.
    // Notifies that the customer viewed their deposit transactions
    await addNewNoti(
      "Viewed Deposit Transactions",
      `Customer ${customer.email || "[Unknown Email]"} viewed their deposit transactions.`,
      notification_type.DEPOSIT_REQUEST
    );
  }

  return NextResponse.json(transactions);
}