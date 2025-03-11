import { authenticateRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    // Verify customer token and get customer data
    const customer = await authenticateRequest(req);
    if (!customer) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const accountTransactions = await prisma.trade.findMany({
        where: {
            customerId: Number(customer.id)
        },
        include: {
            account: {
                select: {
                    accountNo: true
                }
            }
        },	
        orderBy: {
            createdAt: "desc"
        }
    });
    return NextResponse.json(accountTransactions);
}