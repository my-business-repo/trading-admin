import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCustomer } from "@/middleware/authMiddleware";

export async function GET(request: NextRequest) {
    try {


        const auth = await authenticateCustomer(request);
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


        const exchanges = await prisma.exchange.findMany({
            where: {
                customerId: parseInt(userId),
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(exchanges);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


