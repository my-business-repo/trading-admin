import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // Check if customer exists and is not already activated
        const customer = await prisma.customer.findUnique({
            where: { email }
        });

        if (!customer) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            );
        }

        if (customer.isActivated) {
            return NextResponse.json(
                { error: "Email is already verified" },
                { status: 400 }
            );
        }

        // Generate verification token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

        // Save verification token
        await prisma.verificationtoken.create({
            data: {
                token,
                email,
                expiresAt
            }
        });

        // Send verification email
        await sendVerificationEmail(email, token);

        return NextResponse.json({
            success: true,
            message: "Verification email sent successfully"
        });
    } catch (error) {
        console.error("Error sending verification email:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
