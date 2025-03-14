// get all exchanges data for customer
"use server";
import { prisma } from "@/lib/prisma";
import { Exchange } from "@/type";
import { exchange_status } from "@prisma/client";

export const getExchanges = async (): Promise<Exchange[] | null> => {
    try {
        const exchanges = await prisma.exchange.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                customer: true
            }
        });
        return exchanges.map(exchange => ({
            id: exchange.id,
            fromCurrency: exchange.fromCurrency,
            toCurrency: exchange.toCurrency,
            fromAccountNo: exchange.fromAccountNo,
            toAccountNo: exchange.toAccountNo,
            amount: exchange.amount.toNumber(),
            exchangedAmount: exchange.exchangedAmount.toNumber(),
            exchangeRate: exchange.exchangeRate.toNumber(),
            customerId: exchange.customerId,
            customerName: exchange.customer.name,
            exchangeStatus: exchange.exchangeStatus,
            exchangeType: exchange.exchangeType,
            createdAt: exchange.createdAt.toISOString(),
            updatedAt: exchange.updatedAt.toISOString()
        }));
    } catch (error) {
        console.error("Error fetching exchanges:", error);
        return null;
    }
};


// change exchange status
export const changeExchangeStatus = async (exchangeId: number, status: exchange_status) => {
    try {
        // find exchange by id
        const exchange = await prisma.exchange.findUnique({
            where: { id: exchangeId }
        });
        const fromAccount = await prisma.account.findUnique({
            where: { accountNo: exchange?.fromAccountNo }
        });
        const toAccount = await prisma.account.findUnique({
            where: { accountNo: exchange?.toAccountNo }
        });

        // check if exchange is found
        if (!exchange || !fromAccount || !toAccount) {
            return null;
        }
        // check if status is APPROVED
        if (status === "APPROVED") {
            // update account balance
            // update from account balance
            const fromAccountBalance = fromAccount.inreview_balance.toNumber();
            const fromAccountUpdatedBalance = fromAccountBalance - exchange.amount.toNumber();
            await prisma.account.update({
                where: { accountNo: exchange.fromAccountNo },
                data: { inreview_balance: fromAccountUpdatedBalance }
            });
            await prisma.account.update({
                where: { accountNo: exchange.toAccountNo },
                data: {
                    // balance: toAccount.balance.toNumber() + exchange.exchangedAmount.toNumber(),
                    inreview_balance: toAccount.inreview_balance.toNumber() - exchange.exchangedAmount.toNumber()
                }
            });
        } else if (status === "REJECTED") {
            // update account balance
            // decrease inreview balance by amount & increase balance by amount
            await prisma.account.update({
                where: { accountNo: exchange.fromAccountNo },
                data: {
                    inreview_balance: fromAccount.inreview_balance.toNumber() - exchange.amount.toNumber(),
                    balance: fromAccount.balance.toNumber() + exchange.amount.toNumber()
                }
            });

            // decrease to account inreview balance by exchanged amount
            await prisma.account.update({
                where: { accountNo: exchange.toAccountNo },
                data: { inreview_balance: toAccount.inreview_balance.toNumber() - exchange.exchangedAmount.toNumber() }
            });
        }

        const updatedExchange = await prisma.exchange.update({
            where: { id: exchangeId },
            data: {
                exchangeStatus: status
            }
        });
        return updatedExchange;
    } catch (error) {
        console.error("Error changing exchange status:", error);
        return null;
    }
};

// get exchange by id
export const getExchangeById = async (exchangeId: number): Promise<Exchange | null> => {
    try {
        const exchange = await prisma.exchange.findUnique({
            where: { id: exchangeId },
            include: {
                customer: true
            }
        });
        return exchange ? {
            id: exchange.id,
            fromCurrency: exchange.fromCurrency,
            toCurrency: exchange.toCurrency,
            fromAccountNo: exchange.fromAccountNo,
            toAccountNo: exchange.toAccountNo,
            amount: exchange.amount.toNumber(),
            exchangedAmount: exchange.exchangedAmount.toNumber(),
            exchangeRate: exchange.exchangeRate.toNumber(),
            customerId: exchange.customerId,
            customerName: exchange.customer.name,
            exchangeStatus: exchange.exchangeStatus,
            exchangeType: exchange.exchangeType,
            createdAt: exchange.createdAt.toISOString(),
            updatedAt: exchange.updatedAt.toISOString() 
        } : null;
    } catch (error) {
        console.error("Error fetching exchange by id:", error);
        return null;
    }
};  

