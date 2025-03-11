"use server"

import { prisma } from "@/lib/prisma";
import { TradingHistory, TradingSetting } from "@/type";
import { trade_tradingStatus } from "@prisma/client";

export async function getAllTrading(): Promise<TradingHistory[]> {
    const tradingHistory = await prisma.trade.findMany({
        include: {
            account: true,
            customer: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    return tradingHistory.map(history => ({
        id: history.id,
        customerId: history.customerId.toString(),
        customerName: history.customer.name,
        accountId: history.accountId,
        accountNumber: history.account.accountNo,
        createdAt: history.createdAt.toISOString(),
        updatedAt: history.updatedAt.toISOString(),
        tradeType: history.tradeType,
        period: history.period,
        loginId: history.customer.loginId,
        tradingStatus: history.tradingStatus,
        isSuccess: history.isSuccess ?? false,
        tradeQuantity: history.tradeQuantity,
    }));
}

// update trading status
export async function updateTradingStatus(tradeId: number, newStatus: string): Promise<TradingHistory> {
    const trade = await prisma.trade.update({
        where: { id: tradeId },
        include: {
            customer: true,
            account: true,
        },
        data: { tradingStatus: newStatus as trade_tradingStatus },
    });

    return {
        id: trade.id,
        customerId: trade.customerId.toString(),
        customerName: trade.customer.name,
        accountId: trade.accountId,
        accountNumber: trade.account.accountNo,
        createdAt: trade.createdAt.toISOString(),
        updatedAt: trade.updatedAt.toISOString(),
        tradeType: trade.tradeType,
        period: trade.period,
        loginId: trade.customer.loginId,
        tradingStatus: trade.tradingStatus,
        isSuccess: trade.isSuccess ?? false,
        tradeQuantity: trade.tradeQuantity,
    };
}

// get trading settings
export async function getTradingSettings(): Promise<TradingSetting[]> {
    const settings = await prisma.tradingsetting.findMany();
    return settings as TradingSetting[];
}

// update trading setting
export async function updateTradingSetting(id: number, winRate: number): Promise<TradingSetting> {
    const setting = await prisma.tradingsetting.update({
        where: { id },
        data: { winRate },
    });
    return setting as TradingSetting;
}

// get total trading
export async function getTotalTrading(): Promise<number> {
    const totalTrading = await prisma.trade.count();
    return totalTrading;
}

// get total trading amount
export async function getTotalTradingAmount(): Promise<number> {
    const totalTradingAmount = await prisma.trade.aggregate({
        _sum: { tradeQuantity: true },
    });
    return totalTradingAmount._sum.tradeQuantity ?? 0;
}

// get total deposit
export async function getTotalDeposit(): Promise<number> {
    const totalDeposit = await prisma.transaction.aggregate({
        where: {
            type: "DEPOSIT",
        },
        _sum: { amount: true },
    });
    console.log("totalDeposit::", totalDeposit);
    return Number(totalDeposit._sum.amount ?? 0);
}

// get total withdraw
export async function getTotalWithdraw(): Promise<number> {
    const totalWithdraw = await prisma.transaction.aggregate({
        where: {
            type: "WITHDRAWAL",
        },
        _sum: { amount: true },
    });
    return Number(totalWithdraw._sum.amount ?? 0);
}
