"use server";

import { prisma } from "@/lib/prisma";
import { Customer, Message } from "@/type";

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


export const sendMessageToCustomer = async (
    customerId: number,
    message: string
): Promise<Message> => {
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