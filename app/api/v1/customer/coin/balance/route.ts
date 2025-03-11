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

    const currency = req.nextUrl.searchParams.get('currency'); // Use get method

    if (currency === null) {
        return NextResponse.json({ balance: 0 });
    }

    // find account
    const account = await prisma.account.findFirst({
        where: {
            customerId: Number(customer.id),
            currency: currency
        }
    });

    if (!account) {
        // If currency is USDT, fetch its value in USDreate account with that currency
        return NextResponse.json({ balance: 0 });
    }

    return NextResponse.json({ balance: account.balance });
}