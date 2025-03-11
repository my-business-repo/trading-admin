import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { tradeSuccessSchema } from '@/zodValidate/validate';
import { calculateIsSuccess } from '@/lib/utils';

export async function POST(req: NextRequest) {
    if (req.method === 'POST') {
        // Parse and validate request body

        const body = await req.json();

        const validatedData = tradeSuccessSchema.parse(body);
        const { customerId, tradeId } = validatedData;

        // Find trade & verify by customerId & tradeId
        const trade = await prisma.trade.findUnique({
            where: {
                id: tradeId,
                customerId: Number(customerId)
            },
        });

        if (!trade) {
            return NextResponse.json(
                { error: "Trade not found or access denied" },
                { status: 404 }
            );
        }

        try {
            await prisma.$transaction(async (prisma) => {
                await prisma.trade.update({
                    where: {
                        id: tradeId,
                        customerId: Number(customerId)
                    },
                    data: {
                        tradingStatus: 'FAILED',
                    }
                });
            });
            return NextResponse.json({ success: true });
        } catch (error) {
            console.error('An error occurred, rolling back the transaction:', error);
            return NextResponse.json({ error: 'Error trading this time! Please try again' });
        }
    }
    return NextResponse.json({ error: 'Method not allowed' });
}
