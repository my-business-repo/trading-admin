"use server"

import { prisma } from "@/lib/prisma";
import { notification_type } from "@prisma/client";
import { addNewNoti } from "../utils.ts/common";

/**
 * Returns the count of all notifications in the notification table.
 */
export const getNotificationCount = async (): Promise<number> => {
    const count = await prisma.notification.count();
    return count;
}

export const createNotification = async (
    title: string,
    message: string,
    type: notification_type
): Promise<{
    success: boolean;
    notification?: {
        id: number;
        title: string;
        message: string;
        type: string;
        isReadbyAdmin: boolean;
        createdAt: string;
        updatedAt: string;
    };
    error?: string;
}> => {
    return addNewNoti(title, message, type);
};

export const getNotifications = async (): Promise<
    {
        id: number;
        title: string;
        message: string;
        type: notification_type;
        isReadbyAdmin: boolean;
        createdAt: string;
        updatedAt: string;
    }[]
> => {
    const notifications = await prisma.notification.findMany({
        where: {
            isReadbyAdmin: false,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return notifications.map((noti) => ({
        id: noti.id,
        title: noti.title,
        message: noti.message,
        type: noti.type,
        isReadbyAdmin: noti.isReadbyAdmin,
        createdAt: noti.createdAt instanceof Date ? noti.createdAt.toISOString() : noti.createdAt,
        updatedAt: noti.updatedAt instanceof Date ? noti.updatedAt.toISOString() : noti.updatedAt,
    }));
};


export const markNotificationAsRead = async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
        const updated = await prisma.notification.update({
            where: { id },
            data: { isReadbyAdmin: true },
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error?.message || 'Failed to mark notification as read.' };
    }
};