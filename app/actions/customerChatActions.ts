"use server";

import { prisma } from "@/lib/prisma";
import { Customer, Message } from "@/type";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const getMessagesForCustomer = async (customerId: number): Promise<Message[]> => {
    const messages = await prisma.message.findMany({
        where: { customerId },
        orderBy: { createdAt: "asc" },
    });
    return messages.map(message => ({
        ...message,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
    }));
};


export const markMessageAsRead = async (messageId: number): Promise<number> => {
    const message = await prisma.message.update({
        where: { id: messageId },
        data: { isReadbyAdmin: true },
    });
    return message.id ?? 0;
};


// export const sendImageMessageToCustomer = async (formData: FormData)=> {

//     console.log("server action executed");

//     const customerId = Number(formData.get('customerId'));
//     const file = formData.get('file') as File;
//     console.log("starting send image .................................................:heee..............................................")


// }


export const sendImageMessageToCustomer = async (formData: FormData): Promise<Message> => {
    const customerId = Number(formData.get('customerId'));
    const file = formData.get('file') as File;
    // Read the file as buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload the file to Cloudinary in 'messages' folder
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
        throw new Error("Cloudinary image upload failed");
    }

    const imageUrl: string = uploadResult.secure_url;

    // Find customer to ensure valid
    const customer = await prisma.customer.findUnique({
        where: { id: customerId },
    });
    if (!customer) {
        throw new Error("Customer not found");
    }

    // Create the message in the DB with the image URL in content
    const newMessage = await prisma.message.create({
        data: {
            content: imageUrl,
            from: "admin",
            to: `${customer.id}`,
            customerId: customer.id,
            isReadbyAdmin: true,
            type: "IMAGE",
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });

    return {
        ...newMessage,
        createdAt: newMessage.createdAt.toISOString(),
        updatedAt: newMessage.updatedAt.toISOString(),
    };
};


export const sendMessageToCustomer = async (
    customerId: number,
    message: string,
    type: "TEXT" | "IMAGE" = "TEXT"
): Promise<Message> => {

    if (type === "IMAGE") {

        // image logic

        return {
            id: 0,
            content: message,
            from: "admin",
            to: `${customerId}`,
            customerId: customerId,
            isReadbyAdmin: true,
            type: "IMAGE",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }

    // Find customer by id to get loginId and maybe name
    const customer = await prisma.customer.findUnique({
        where: { id: customerId },
    });

    if (!customer) {
        throw new Error("Customer not found");
    }
    const newMessage = await prisma.message.create({
        data: {
            content: message,
            from: "admin",
            to: `${customer.id}`,
            customerId: customer.id,
            isReadbyAdmin: true,
            type: "TEXT",
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });

    return {
        ...newMessage,
        createdAt: newMessage.createdAt.toISOString(),
        updatedAt: newMessage.updatedAt.toISOString(),
    };
};


export const getCustomerMessageCount = async (customerId: number): Promise<number> => {
    const count = await prisma.message.count({
        where: { customerId },
    });
    return count;
};