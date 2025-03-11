import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

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
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  let transactions = [];

  for (const account of accounts) {
    const accountTransactions = await prisma.transaction.findMany({
      where: {
        accountId: account.id,
      },
      orderBy: {
        createdAt: "desc"
      }
    })
    transactions.push(...accountTransactions)
  }

  return NextResponse.json({ allTransactions: transactions });
}