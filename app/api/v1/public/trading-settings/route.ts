import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"


export async function GET() {
    try {
        const tradingSettings = await prisma.tradingsetting.findMany()
        return NextResponse.json(tradingSettings)
    } catch (error) {
        console.error("Error fetching trading settings:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}