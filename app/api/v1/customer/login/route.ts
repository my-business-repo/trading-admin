import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/jwt";
import { compare } from "bcrypt";

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


export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400, headers: getCorsHeaders(req.headers.get("origin") || "") }
      );
    }

    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401, headers: getCorsHeaders(req.headers.get("origin") || "") }
      );
    }

    // Verify password using bcrypt
    const isValidPassword = await compare(password, customer.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401, headers: getCorsHeaders(req.headers.get("origin") || "") }
      );
    }

    // Generate JWT token
    const token = generateToken({
      customerId: customer.id.toString(),
      email: customer.email,
    });

    // update last login time
    await prisma.customer.update({
      where: { id: customer.id },
      data: { lastLoginTime: new Date() },
    });

    return NextResponse.json({
      message: "Login successful",
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        loginId: customer.loginId,
      },
    },
    { status: 200, headers: getCorsHeaders(req.headers.get("origin") || "") }
  );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: getCorsHeaders(req.headers.get("origin") || "") }
    );
  }
}
