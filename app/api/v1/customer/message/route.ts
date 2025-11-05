import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCustomer } from "@/middleware/authMiddleware";
import { authenticateRequest } from "@/lib/auth";
import { addNewNoti } from "@/app/utils.ts/common";
import { notification_type } from "@prisma/client";

export async function POST(req: NextRequest) {
    try {
        // Authenticate customer
        const auth = await authenticateCustomer(req);

        if (auth.error) {
            return NextResponse.json(
                { error: auth.error },
                { status: auth.status }
            );
        }

        const customer = await authenticateRequest(req);
        if (!customer) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Parse message from request
        const body = await req.json();
        const { content } = body;

        if (!content || typeof content !== "string" || !content.trim()) {
            return NextResponse.json(
                { error: "Content is required" },
                { status: 400 }
            );
        }

        // Create message
        const newMessage = await prisma.message.create({
            data: {
                content: content.trim(),
                customerId: parseInt(customer.id),
                from: customer.id,
                to: "admin",
                updatedAt: new Date(),
                createdAt: new Date()
            }
        });
        await addNewNoti(
            "New Customer Message",
            `Customer ${customer.email} sent a message.`,
            notification_type.NEW_MESSAGE
        );

        return NextResponse.json({
            success: true,
            message: "Message sent successfully.",
            data: newMessage
        });
    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}


export async function GET(req: NextRequest) {
    try {
        const customer = await authenticateRequest(req);
        if (!customer) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const messages = await prisma.message.findMany({
            where: {
                customerId: parseInt(customer.id),
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return NextResponse.json({
            success: true,
            message: "Messages fetched successfully.",
            data: messages,
        });
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}