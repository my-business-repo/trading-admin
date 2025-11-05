import { notification_type } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Inserts a new notification into the database.
 *
 * @param title - The title of the notification.
 * @param message - The body message of the notification.
 * @param type - The type of the notification, should match notification_type enum.
 * @returns The created Notification object.
 */
export const addNewNoti = async (
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
    try {
        const newNotification = await prisma.notification.create({
            data: {
                title,
                message,
                type,
                isReadbyAdmin: false,
            },
        });

        return {
            success: true,
            notification: {
                id: newNotification.id,
                title: newNotification.title,
                message: newNotification.message,
                type: newNotification.type,
                isReadbyAdmin: newNotification.isReadbyAdmin,
                createdAt:
                    newNotification.createdAt instanceof Date
                        ? newNotification.createdAt.toISOString()
                        : newNotification.createdAt,
                updatedAt:
                    newNotification.updatedAt instanceof Date
                        ? newNotification.updatedAt.toISOString()
                        : newNotification.updatedAt,
            },
        };
    } catch (error: any) {
        return {
            success: false,
            error: error?.message || "Failed to create notification.",
        };
    }
};
