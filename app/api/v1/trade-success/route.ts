import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { tradeSuccessSchema } from '@/zodValidate/validate';
import { calculateIsSuccess } from '@/lib/utils';

const getCorsHeaders = (origin: string) => {
  const headers = {
    "Access-Control-Allow-Methods": `${process.env.ALLOWED_METHODS}`,
    "Access-Control-Allow-Headers": `${process.env.ALLOWED_HEADERS}`,
    "Access-Control-Allow-Origin": `${process.env.DOMAIN_URL}`,
  };

  if (!process.env.ALLOWED_ORIGIN || !origin) return headers;
  const allowedOrigins = process.env.ALLOWED_ORIGIN.split(",");
  if (allowedOrigins.includes("*")) {
    headers["Access-Control-Allow-Origin"] = "*";
  } else if (allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
};


export const OPTIONS = async (request: NextRequest) => {
  // Return Response
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: getCorsHeaders(request.headers.get("origin") || ""),
    }
  );
};

export async function POST(req: NextRequest) {
  if (req.method === 'POST') {
    // Parse and validate request body

    const body = await req.json();

    const validatedData = tradeSuccessSchema.parse(body);
    const { customerId, tradeId, outcome } = validatedData;

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
        { status: 404, headers: getCorsHeaders(req.headers.get("origin") || "") }
      );
    }


    let isSuccess = false;
    let profit = 0;

    // Get trading setting by second & type
    let tradingSetting = await prisma.tradingsetting.findFirst({
      where: {
        seconds: trade.period,
        tradingType: trade.tradeType
      },
    })

    if (!tradingSetting) {
      // If no trading setting exists, create default settings based on predefined ratios
      const ratios = {
        30: 40,
        60: 50,
        120: 70,
        300: 100
      };

      // Create new trading setting for both SHORT and LONG types
      await prisma.tradingsetting.create({
        data: {
          seconds: trade.period,
          tradingType: trade.tradeType,
          percentage: ratios[trade.period as keyof typeof ratios] || 40, // Default to 40% if period not found
          winRate: 0.5,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Refetch the newly created trading setting
      const newTradingSetting = await prisma.tradingsetting.findFirst({
        where: {
          seconds: trade.period,
          tradingType: trade.tradeType
        }
      });

      if (!newTradingSetting) {
        return NextResponse.json(
          { error: "Error creating trading settings" },
          { status: 500, headers: getCorsHeaders(req.headers.get("origin") || "") }
        );
      }

      tradingSetting = newTradingSetting;
    }

    // if trade is already completed, just return the trade data
    // get auto_decide_win_lose from db
    const autoDecideWinLose = await prisma.generalSetting.findUnique({
      where: {
        name: 'auto_decide_win_lose',
      },
    });

    const autoDecide = autoDecideWinLose?.value === 'true' ? true : false;

    if (!autoDecide) {
      if (trade.tradingStatus === 'COMPLETED') {
        const profit = trade.isSuccess ? trade.tradeQuantity * (tradingSetting.percentage / 100) : -1 * trade.tradeQuantity;

        // Update the second table
        await prisma.account.update({
          where: {
            id: trade.accountId
          },
          data: {
            balance: {
              increment: profit
            }
          }
        });

        return NextResponse.json({
          success: true,
          profit: profit,
          result: trade.isSuccess ? 'win' : 'lose',
        }, { headers: getCorsHeaders(req.headers.get("origin") || "") });
      }
    }

    if (outcome === null) {
      // ****************** WIN RATE ******************
      // *********************************************
      // *********************************************
      let windRateDefined = 0.5;
      // get win rate for customer
      const winRate = await prisma.winrate.findFirst({
        where: {
          customerId: Number(customerId)
        },
      });

      if (winRate) {
        windRateDefined = winRate.winRate;
      }

      // calculate isSuccess or not based on winRate
      const isSuccess = calculateIsSuccess(windRateDefined, tradingSetting?.winRate);
      let profit = 0;

      // if(success) calculate profile base on tradeQuantity & winRate
      if (isSuccess) {
        profit = trade.tradeQuantity * (tradingSetting.percentage / 100);
      } else {
        profit = -1 * trade.tradeQuantity;
      }

      // ****************** WIN RATE ******************
      // *********************************************
      // *********************************************
    } else {
      isSuccess = outcome === 'win' ? true : false;
      profit = outcome === 'win' ? trade.tradeQuantity * (tradingSetting.percentage / 100) : -1 * trade.tradeQuantity;
    }

    try {
      await prisma.$transaction(async (prisma) => {
        // Update the first table
        await prisma.trade.update({
          where: {
            id: tradeId,
            customerId: Number(customerId)
          },
          data: {
            tradingStatus: 'COMPLETED',
            isSuccess: isSuccess,
          }
        });
        // Update the second table
        await prisma.account.update({
          where: {
            id: trade.accountId
          },
          data: {
            balance: {
              increment: profit
            }
          }
        });
      });
      return NextResponse.json({
        success: true,
        profit: profit,
        result: isSuccess ? 'win' : 'lose',
      },
      { headers: getCorsHeaders(req.headers.get("origin") || "") });
    } catch (error) {
      console.error('An error occurred, rolling back the transaction:', error);
      return NextResponse.json({ error: 'Error trading this time! Please try again' }, { headers: getCorsHeaders(req.headers.get("origin") || "") });
    }
  }
  return NextResponse.json({ error: 'Method not allowed' }, { headers: getCorsHeaders(req.headers.get("origin") || "") });
}
