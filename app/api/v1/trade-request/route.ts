import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { tradeSchema } from '@/zodValidate/validate';



function generateAccountNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${timestamp}${random}`;
}

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


export async function POST(request: NextRequest) {
  if (request.method === 'POST') {

    // Parse and validate request body
    const body = await request.json();

    const validatedData = tradeSchema.parse(body);
    const { customerId, tradeType, period, tradeQuantity, currency } = validatedData;


    // Find the account and verify ownership
    const accounts = await prisma.account.findMany({
      where: {
        customerId: Number(customerId),
      },
    });

    // account = account with currency of currency
    let account = accounts.find(a => (a.currency).toLocaleLowerCase() === currency.toLocaleLowerCase());

    // if account is not found, return error
    if (!account) {
      // create account with that currency
      account = await prisma.account.create({
        data: {
          customerId,
          currency,
          balance: 0,
          accountNo: generateAccountNumber(),
          updatedAt: new Date(),
        },
      });
    }


    if (!accounts || !account) {
      return NextResponse.json(
        { error: "Account not found or access denied" },
        { status: 404, headers: getCorsHeaders(request.headers.get("origin") || "") }
      );
    }

    // get all account balance not usd account
    let totalBalance = 0;
    // Calculate total balance in USD for each account
    for (const account of accounts) {
      if ((account.currency).toLocaleLowerCase() === 'usd') continue;
      if (['btc', 'eth', 'usdt', 'usdc'].includes(account.currency.toLowerCase())) {
        try {
          const priceResponse = await fetch(
            `https://min-api.cryptocompare.com/data/price?fsym=${account.currency}&tsyms=USD`
          );
          const priceData = await priceResponse.json();
          const usdPrice = priceData.USD;
          totalBalance += parseFloat(account.balance.toString()) * usdPrice;
        } catch (error) {
          console.error(`Error fetching price for ${account.currency}:`, error);
          totalBalance += parseFloat(account.balance.toString());
        }
      } else {
        totalBalance += parseFloat(account.balance.toString());
      }
    }

    if (totalBalance < tradeQuantity) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400, headers: getCorsHeaders(request.headers.get("origin") || "") }
      );
    }


    // get trading settings base on period and trade type
    let tradingSettings = await prisma.tradingsetting.findFirst({
      where: {
        seconds: period,
        tradingType: tradeType,
      },
    });

    if (!tradingSettings) {
      // If no trading setting exists, create default settings based on predefined ratios
      const ratios = {
        30: 40,
        60: 50,
        120: 70,
        300: 100
      };
      // Create new trading setting for both SHORT and LONG types
      tradingSettings = await prisma.tradingsetting.create({
        data: {
          seconds: period,
          tradingType: tradeType,
          percentage: ratios[period as keyof typeof ratios] || 40, // Default to 40% if period not found
          winRate: 0.5,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

      const sequence = [];
      const winCount = Math.round(period * tradingSettings.winRate);
      const loseCount = period - winCount;

      for (let i = 0; i < winCount; i++) {
        sequence.push(1);
      }
      for (let i = 0; i < loseCount; i++) {
        sequence.push(0);
      }

      // Shuffle the sequence to randomize the order of wins and losses
      for (let i = sequence.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
      }

      try {
        const trade = await prisma.trade.create({
          data: {
            customerId,
            accountId: account.id,
            tradeType,
            period,
            tradingStatus: 'PENDING',
            tradeQuantity,
            updatedAt: new Date(),
          },
        });
        return NextResponse.json(
          {
            trade,
            sequence
          },
          { headers: getCorsHeaders(request.headers.get("origin") || "") });
      } catch (error) {
        return NextResponse.json({ error: 'Error creating trade' }, { headers: getCorsHeaders(request.headers.get("origin") || "") });
      }
    }
    return NextResponse.json({ error: 'Method not allowed' }, { headers: getCorsHeaders(request.headers.get("origin") || "") });
  }
