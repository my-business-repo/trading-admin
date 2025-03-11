"use server"

import { prisma } from "@/lib/prisma"
import { Admin } from "@/type"


export async function getAdminInfo(id: string): Promise<Admin | null> {
    const admin = await prisma.admin.findUnique({
        where: {
            id: Number(id)
        }
    });
    if (!admin) {
        return null;
    }
    return {
        id: admin.id,
        email: admin.email,
        name: admin.name || "",
        phone: admin.phone || "",
        createdAt: admin.createdAt.toISOString(),
        updatedAt: admin.updatedAt.toISOString(),
        avatar: "https://plus.unsplash.com/premium_photo-1739538269027-7c69b6cc83a7?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    }
}
