import { authenticateCustomer } from "@/middleware/authMiddleware";
import { NextRequest, NextResponse } from "next/server";

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
    // Return Response
    return NextResponse.json(
        {},
        {
            status: 200,
            headers: getCorsHeaders(request.headers.get("origin") || ""),
        }
    );
};

// validate customer token
export async function GET(request: Request) {

    const auth = await authenticateCustomer(request as NextRequest);
    if (auth.error) {
        return NextResponse.json(
            { error: auth.error },
            {
                status: auth.status,
                headers: getCorsHeaders(request.headers.get("origin") || "")
            }
        );
    }

    return NextResponse.json(
        { message: "Token is valid" },
        {
            status: 200,
            headers: getCorsHeaders(request.headers.get("origin") || "")
        }
    );
}   