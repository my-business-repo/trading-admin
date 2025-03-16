import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcrypt";
import { authenticateCustomer } from "@/middleware/authMiddleware";

const getCorsHeaders = (origin: string) => {
    const headers = {
        "Access-Control-Allow-Methods": `${process.env.ALLOWED_METHODS}`,
        "Access-Control-Allow-Headers": `${process.env.ALLOWED_HEADERS}`,
        "Access-Control-Allow-Origin": `${process.env.DOMAIN_URL}`,
    };

    if (!process.env.ALLOWED_ORIGIN || !origin) return headers;
    const allowedOrigins = process.env.ALLOWED_ORIGIN.split(",");
    if (allowedOrigins.includes("*")) {
        headers["Access-Control-Allow-Origin"] = "*";
    } else if (allowedOrigins.includes(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
    }
    return headers;
};

export const OPTIONS = async (request: NextRequest) => {
    return NextResponse.json(
        {},
        {
            status: 200,
            headers: getCorsHeaders(request.headers.get("origin") || ""),
        }
    );
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

        const customerId = auth.customer?.id;
        if (!customerId) {
            return NextResponse.json(
                { error: "Customer ID not found" },
                { status: 400 }
            );
        }

        const { fundPassword } = await req.json();

        // Validate required fields
        if (!fundPassword) {
            return NextResponse.json(
                { error: "Fund password is required" },
                { status: 400, headers: getCorsHeaders(req.headers.get("origin") || "") }
            );
        }

        // Check if customer exists
        const customer = await prisma.customer.findUnique({
            where: { id: parseInt(customerId) }
        });

        if (!customer) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404, headers: getCorsHeaders(req.headers.get("origin") || "") }
            );
        }

        if (!customer.fund_password) {
            return NextResponse.json(
                { error: "Fund password not set" },
                { status: 400, headers: getCorsHeaders(req.headers.get("origin") || "") }
            );
        }

        // Verify fund password
        const isValid = await compare(fundPassword, customer.fund_password);

        return NextResponse.json(
            {
                isValid
            },
            { status: 200, headers: getCorsHeaders(req.headers.get("origin") || "") }
        );

    } catch (error) {
        console.error("Error checking fund password:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500, headers: getCorsHeaders(req.headers.get("origin") || "") }
        );
    }
}
