// export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCustomer } from "@/middleware/authMiddleware";

export async function GET(req: NextRequest) {
    try {
        // Authenticate the request
        const auth = await authenticateCustomer(req);
        
        if (auth.error) {
            return NextResponse.json(
                { error: auth.error },
                { status: auth.status }
            );
        }

        // Get customer profile with related data
        const customerId = auth.customer?.id;
        if (!customerId) {
            return NextResponse.json(
                { error: "Customer ID not found" },
                { status: 400 }
            );
        }

        const customer = await prisma.customer.findUnique({
            where: {
                id: parseInt(customerId)
            },
            include: {
                address: {
                    orderBy: {
                        isDefault: 'desc'
                    }
                },
                account: {
                    select: {
                        id: true,
                        accountNo: true,
                        balance: true,
                        currency: true,
                        isActive: true,
                        createdAt: true
                    }
                }
            }
        });

        if (!customer) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            );
        }

        // Remove sensitive information
        const { 
            password,
            socialSecurityNumber,
            ...safeCustomerData 
        } = customer;

        // Format the response
        const response = {
            ...safeCustomerData,
            accounts: customer.account.map(account => ({
                ...account,
                balance: account.balance.toString() // Convert Decimal to string for JSON
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
