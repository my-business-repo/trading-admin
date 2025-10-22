import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const customer = await authenticateRequest(req);
        if (!customer) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get count of messages for customer
        const count = await prisma.message.count({
            where: {
                customerId: parseInt(customer.id),
            },
        });

        return NextResponse.json({
            success: true,
            message: "Message count fetched successfully.",
            data: { count }
        });
    } catch (error) {
        console.error("Error fetching message count:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

