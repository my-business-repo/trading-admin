// fetch available balance (usd) of customer
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

    // find account
    const accounts = await prisma.account.findMany({
        where: {
            customerId: Number(customer.id)
        }
    });



    let totalBalance = 0;
    // Calculate total balance in USD for each account
    for (const account of accounts) {
        if ((account.currency).toLocaleLowerCase() === 'usd')continue;
        if (['btc', 'eth', 'usdt', 'usdc'].includes(account.currency.toLowerCase())) {
            try {
                const priceResponse = await fetch(
                    `https://min-api.cryptocompare.com/data/price?fsym=${account.currency}&tsyms=USD`
                );
                const priceData = await priceResponse.json();
                const usdPrice = priceData.USD;
                totalBalance += parseFloat(account.balance.toString()) * usdPrice;
            } catch (error) {
                console.error(`Error fetching price for ${account.currency}:`, error);
                totalBalance += parseFloat(account.balance.toString());
            }
        } else {
            totalBalance += parseFloat(account.balance.toString());
        }
    }

    if (!accounts) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }
    return NextResponse.json({ balance: totalBalance });
}