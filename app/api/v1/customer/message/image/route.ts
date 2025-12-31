import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCustomer } from "@/middleware/authMiddleware";
import { authenticateRequest } from "@/lib/auth";
import { addNewNoti } from "@/app/utils.ts/common";
import { notification_type } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(req: NextRequest) {
    try {
        // Authenticate customer (middleware)
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

        // Parse form data
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        // Read file buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary (messages folder)
        const uploadResult = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: "messages" },
                (error: any, result: any) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(buffer);
        });

        if (!uploadResult || typeof uploadResult !== "object" || !("secure_url" in uploadResult)) {
            return NextResponse.json(
                { error: "Cloud image upload failed" },
                { status: 500 }
            );
        }

        const imageUrl = uploadResult.secure_url;

        // Create message in DB
        const newMessage = await prisma.message.create({
            data: {
                content: imageUrl,
                from: customer.id,
                to: "admin",
                customerId: parseInt(customer.id),
                type: "IMAGE",
                // Hide from admin at creation? See TEXT message logic for reference
                isReadbyAdmin: false,
                createdAt: new Date(),
                updatedAt: new Date()
            },
        });

        // Add notification for admin, like text message
        await addNewNoti(
            "New Customer Image Message",
            `Customer ${customer.email} sent an image.`,
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