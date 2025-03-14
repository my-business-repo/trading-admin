import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";

// Validation function for email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate unique account number
function generateAccountNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${timestamp}${random}`;
}

// Add this function near the top with other utility functions
function generateLoginId(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `C${timestamp}${random}`;
}

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
    const {
      email,
      name,
      phone,
      password,
      socialSecurityNumber
    } = await req.json();

    console.log(email);

    // Validate required fields
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400, headers: getCorsHeaders(req.headers.get("origin") || ""), }
      );
    }

    // Check if customer already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: "Customer already exists" },
        { status: 400, headers: getCorsHeaders(req.headers.get("origin") || ""), }
      );
    }

    // Hash password using bcrypt
    const hashedPassword = await hash(password, 10);

    // Create new customer with a default account
    const customer = await prisma.$transaction(async (tx: any) => {
      // Create customer
      const newCustomer = await tx.customer.create({
        data: {
          email,
          name,
          phone,
          loginId: generateLoginId(),
          password: hashedPassword,
          socialSecurityNumber,
          active: true,
          updatedAt: new Date(),
          isActivated: false, // Requires email verification
          account: {
            create: {
              accountNo: generateAccountNumber(),
              balance: 0,
              currency: "USDT",
              isActive: true,
              updatedAt: new Date(),
            }
          }
        },
        include: {
          account: true
        }
      });

      return newCustomer;
    });

    // update loginId base on id e.g 1 => 120001 , 2=> 120002 , 3=> 120003
    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: { loginId: `12${customer.id.toString().padStart(4, '0')}` }
    });

    // Remove password from response
    const { password: _, ...customerData } = updatedCustomer;

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully. Please check your email for activation.",
        data: customerData,
      },
      { status: 201, headers: getCorsHeaders(req.headers.get("origin") || "") }
    );
  } catch (error) {
    console.error("Error in customer signup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: getCorsHeaders(req.headers.get("origin") || "") }
    );
  }
}

// "\nInvalid `prisma.customer.create()` invocation:\n\n{\n  data: {\n    email: \"newuser@example.com\",\n    name: \"New User\",\n    loginId: \"USR1740164232013347\",\n    phone: \"+1234567890\",\n    password: \"$2b$10$rIqE8668RAYujRATGBE1TuKDtA96QjMGPrQ2jtcZFuXpNuwvw9Ik2\",\n    socialSecurityNumber: \"123-45-6789\",\n    active: true,\n    updatedAt: new Date(\"2025-02-21T18:57:12.013Z\"),\n    isActivated: false,\n    account: {\n      create: {\n        accountNo: \"1740164232013329\",\n        balance: 0,\n        currency: \"USDT\",\n        isActive: true,\n        updatedAt: new Date(\"2025-02-21T18:57:12.013Z\")\n      }\n    }\n  },\n  include: {\n    accounts: true,\n    ~~~~~~~~\n?   account?: true,\n?   address?: true,\n?   trade?: true,\n?   winrate?: true\n  }\n}\n\nUnknown field `accounts` for include statement on model `customer`. Available options are marked with ?."