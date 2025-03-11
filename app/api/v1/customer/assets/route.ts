import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCustomer } from "@/middleware/authMiddleware";

// export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateCustomer(req);

        if (auth.error) {
            return NextResponse.json(
                { error: auth.error },
                { status: auth.status }
            );
        }

        const customerId = auth.customer?.id;
        if (!customerId) {
            return NextResponse.json(
                { error: "Customer ID not found" },
                { status: 400 }
            );
        }

        // get all accounts of the customer
        let accounts = await prisma.account.findMany({
            where: {
                customerId: parseInt(customerId)
            }
        });

        if (!accounts) {
            return NextResponse.json(
                { error: "Assets not found" },
                { status: 404 }
            );
        }
        // remove the account with currency USD
        accounts = accounts.filter((account) => account.currency !== "USD");

        // Format the response
        const response = {
            accounts: accounts.map(account => ({
                ...account,
                inreview_balance: account.inreview_balance.toString(),
                balance: account.balance.toString()
            }))
        };

        return NextResponse.json({
            success: true,
            data: response
        });
    } catch (error) {
        console.error("Error fetching customer profile:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
