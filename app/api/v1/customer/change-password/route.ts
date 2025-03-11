import { authenticateRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { compare, hash } from "bcrypt";

export async function POST(req: NextRequest) {
    // Verify customer token and get customer data
    const customer = await authenticateRequest(req);
    if (!customer) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const { oldPassword, newPassword } = await req.json();

    // Validate old password
    const user = await prisma.customer.findUnique({
        where: { id: Number(customer.id) }
    });

    if (!user) {
        return NextResponse.json(
            { error: "User not found" },
            { status: 401 }
        );
    }
    if(!oldPassword){
        return NextResponse.json(
            { error: "No old password!" },
            { status: 401 }
        );
    }


    // Verify password using bcrypt
    const isValidPassword = await compare(oldPassword, user.password);

    if (!isValidPassword) {
        return NextResponse.json(
            { error: "Invalid Old password!" },
            { status: 401 }
        );
    }

    const hashedPassword = await hash(newPassword, 10);

    // Update password
    await prisma.customer.update({
        where: { id: Number(customer.id) },
        data: { password: hashedPassword }
    });

    return NextResponse.json({ message: "Password changed successfully" });
}
