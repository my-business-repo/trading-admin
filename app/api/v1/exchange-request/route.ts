import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCustomer } from "@/middleware/authMiddleware";
import { exchange_status, exchange_type } from "@prisma/client";

// Generate unique account number
function generateAccountNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${timestamp}${random}`;
}

const fetchExchangeRate = async (fromCurrency: string, toCurrency: string) => {
    const response = await fetch(`https://min-api.cryptocompare.com/data/price?fsym=${fromCurrency}&tsyms=${toCurrency}`);
    const data = await response.json();
    return data[toCurrency];
};

export async function POST(req: NextRequest) {
    try {

        const auth = await authenticateCustomer(req);

        if (auth.error) {
            return NextResponse.json(
                { error: auth.error },
                { status: auth.status }
            );
        }

        const userId = auth.customer?.id;
        if (!userId) {
            return NextResponse.json(
                { error: "Customer ID not found" },
                { status: 400 }
            );
        }
        const { fromCurrency, toCurrency, amount } = await req.json();


        const fromAccount = await prisma.account.findFirst({
            where: {
                customerId: parseInt(userId),
                currency: fromCurrency
            }
        });

        if (!fromAccount) {
            return NextResponse.json({ error: "Account is not found" }, { status: 400 });
        }

        if (fromAccount.balance < amount) {
            return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
        }

        let toAccount = await prisma.account.findFirst({
            where: {
                customerId: parseInt(userId),
                currency: toCurrency
            }
        });

        if (!toAccount) {
            // create new account
            toAccount = await prisma.account.create({
                data: {
                    customerId: parseInt(userId),
                    currency: toCurrency,
                    accountNo: generateAccountNumber(),
                    balance: 0,
                    isActive: true,
                    updatedAt: new Date(),
                }
            });
        }

        const exchangeRate = await fetchExchangeRate(fromCurrency, toCurrency);
        if (!exchangeRate) {
            return NextResponse.json({ error: "Failed to fetch exchange rate" }, { status: 500 });
        }

        // Calculate exchanged amount
        const exchangedAmount = amount * exchangeRate;

        // decrease from account balance and increase inreview balance
        // decrease from account balance
        await prisma.account.update({
            where: { accountNo: fromAccount.accountNo },
            data: {
                balance: fromAccount.balance.toNumber() - amount,
                // inreview_balance: fromAccount.inreview_balance.toNumber() + amount
            }
        });

        // increase to account inreview balance
        await prisma.account.update({
            where: { accountNo: toAccount.accountNo },
            data: {
                balance: toAccount.balance.toNumber() + exchangedAmount,
                // inreview_balance: toAccount.inreview_balance.toNumber() + exchangedAmount
            }
        });

        // Record the exchange in the database
        const exchangeRecord = await prisma.exchange.create({
            data: {
                fromCurrency,
                toCurrency,
                fromAccountNo: fromAccount.accountNo,
                toAccountNo: toAccount.accountNo,
                amount,
                exchangedAmount,
                exchangeRate,
                exchangeStatus: exchange_status.APPROVED,
                exchangeType: exchange_type.BUY,
                customerId: parseInt(userId),
                updatedAt: new Date(),
            },
        });
        return NextResponse.json({ success: true, exchange: exchangeRecord }, { status: 201 });
    } catch (error) {
        console.error("Error processing exchange:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
} 