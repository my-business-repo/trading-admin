'use server'

import { prisma } from "@/lib/prisma"
import { Deposit, TransactionDetails, Withdrawal } from "@/type"
import { transaction_status } from "@prisma/client"

// get all transactions
export async function getAllTransactions() {
    const transactions = await prisma.transaction.findMany({
        include: {
            transactionfile: true,
        },
    })
    return transactions
}

// get all transactions (deposits)
export async function getAllDeposits() {
    const deposits = await prisma.transaction.findMany({
        where: {
            type: "DEPOSIT",
        },
        include: {
            account: {
                select: {
                    accountNo: true,
                    customer: {
                        select: {
                            name: true,
                            id: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'desc', // Sort by createdAt in descending order
        },
    })

    // Map the results to match the Deposit type
    return deposits.map(deposit => ({
        id: deposit.id,  // Ensure this is a number
        customerId: deposit.account.customer.id,  // Adjust as necessary
        customerName: deposit.account.customer.name,
        transactionId: deposit.transactionId,
        type: deposit.type,
        accountId: deposit.accountId,
        createdAt: deposit.createdAt,
        updatedAt: deposit.updatedAt,
        amount: parseFloat(deposit.amount.toString()),  // Ensure amount is a number
        status: deposit.status,  // Adjust as necessary
        accountNumber: deposit.account.accountNo,
        accountName: deposit.account.customer.name,
        notes: deposit.description,
    }))
}

// update deposit status
export async function updateDepositStatus(depositId: string, newStatus: transaction_status) {
    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: parseInt(depositId) },
        })
        if (!transaction) {
            return { error: "Transaction not found" }
        }
        if (newStatus === transaction_status.COMPLETED) {
            const user = await prisma.account.update({
                where: { id: transaction?.accountId },
                data: {
                    inreview_balance: { decrement: transaction?.amount },
                    balance: { increment: transaction?.amount },
                    updatedAt: new Date(),
                },
            });
        }
        if (newStatus === transaction_status.FAILED) {
            const user = await prisma.account.update({
                where: { id: transaction?.accountId },
                data: { inreview_balance: { decrement: transaction?.amount } },
            });
        }

        // update deposit status
        const deposit = await prisma.transaction.update({
            where: { id: parseInt(depositId) },
            data: { status: newStatus },
        });
        return { message: "Deposit status updated successfully" }
    } catch (error) {
        console.error(error)
        return { message: "Failed to update deposit status" }
    }
}

// get transaction by id
export async function getTransactionById(transactionId: string): Promise<TransactionDetails | null> {
    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: parseInt(transactionId) },
            include: {
                transactionfile: true,
                account: {
                    select: {
                        accountNo: true,
                        customer: {
                            select: {
                                name: true,
                                id: true,
                            },
                        },
                    },
                },
            },
        });

        if (!transaction) {
            return null; // Return null if transaction is not found
        }
        return {
            id: transaction.id,
            transactionId: transaction.transactionId,
            type: transaction.type,
            amount: parseFloat(transaction.amount.toString()),
            description: transaction.description || "",
            status: transaction.status,
            accountId: transaction.accountId.toString(),
            accountNumber: transaction.account.accountNo,
            customerId: transaction.account.customer.id.toString(),
            customerName: transaction.account.customer.name,
            createdAt: transaction.createdAt.toISOString(),
            updatedAt: transaction.updatedAt.toISOString(),
            currency: transaction.currency || "USD",
            transactionfile: transaction.transactionfile.map(file => ({
                id: file.id,
                filename: file.filePath,
                filetype: file.filePath.split('.').pop() || '',
                fileurl: file.filePath,
            })),
        };
    } catch (error) {
        console.error(error)
        return null;
    }
}

// get deposits by user id
export async function getDepositsByUserId(userId: number): Promise<Deposit[]> {
    // get all customer's accounts
    const accounts = await prisma.account.findMany({
        where: { customerId: userId },
    });

    // get all deposits by account id
    const deposits = await prisma.transaction.findMany({
        where: {
            accountId: { in: accounts.map(account => account.id) },
            type: "DEPOSIT"
        },
        include: {
            account: {
                include: {
                    customer: true,
                },
            },
        },
    });

    return deposits as unknown as Deposit[];
}


// get withdrawals by user id
export async function getWithdrawalsByUserId(userId: number): Promise<Withdrawal[]> {
    const accounts = await prisma.account.findMany({
        where: { customerId: userId },
    });

    // get all withdrawals by account id
    const withdrawals = await prisma.transaction.findMany({
        where: { accountId: { in: accounts.map(account => account.id) }, type: "WITHDRAWAL" },
    });

    return withdrawals as unknown as Withdrawal[];
}


// get all transactions (withdrawals)
export async function getAllWithdrawals(): Promise<Withdrawal[]> {
    try {
        const withdrawals = await prisma.transaction.findMany({
            where: {
                type: "WITHDRAWAL",
            },
            include: {
                account: {
                    include: {
                        customer: {
                            select: {
                                name: true,
                                id: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc"
            }
        });
        return withdrawals.map(withdrawal => ({
            id: withdrawal.id,
            transactionId: withdrawal.transactionId,
            type: withdrawal.type,
            amount: parseFloat(withdrawal.amount.toString()),
            address: withdrawal.address || "",
            sent: withdrawal.sent || false,
            currency: withdrawal.currency || "",
            status: withdrawal.status,
            accountId: withdrawal.accountId,
            accountNumber: withdrawal.account.accountNo,
            createdAt: withdrawal.createdAt.toISOString(),
            updatedAt: withdrawal.updatedAt.toISOString(),
            customerId: withdrawal.account.customer.id,
            customerName: withdrawal.account.customer.name,
        }));
    } catch (error) {
        console.error(error)
        return []
    }
}

// update withdrawal status
export async function updateWithdrawalStatus(withdrawalId: string, newStatus: transaction_status) {
    try {
        // find withdrawal by id
        const withdrawal = await prisma.transaction.findUnique({
            where: { id: parseInt(withdrawalId) },
        });

        if (!withdrawal) {
            return { message: "Withdrawal not found" }
        }

        const amount = withdrawal?.amount.minus(withdrawal?.amount.times(0.01));

        // update user balance
        if (newStatus === transaction_status.COMPLETED) {
            const user = await prisma.account.update({
                where: { id: withdrawal?.accountId },
                data: { inreview_balance: { decrement: amount } },
            });
        }

        await prisma.transaction.update({
            where: { id: parseInt(withdrawalId) },
            data: { status: newStatus },
        });
        return { message: "success" }
    } catch (error) {
        console.error(error)
        return { message: "Failed to update withdrawal status" }
    }
}

// mark withdrawal as sent
export async function markWithdrawalAsSent(withdrawalId: string) {
    try {
        await prisma.transaction.update({
            where: { id: parseInt(withdrawalId) },
            data: { sent: true },
        });
        return { message: "success" }
    } catch (error) {
        console.error(error)
        return { message: "Failed to mark withdrawal as sent" }
    }
}

// get withdrawal by id
export async function getWithdrawalById(withdrawalId: string): Promise<Withdrawal | null> {
    const withdrawal = await prisma.transaction.findUnique({
        where: { id: parseInt(withdrawalId) },
        include: {
            account: {
                include: {
                    customer: true,
                },
            },
        },
    });
    if (!withdrawal) {
        return null
    }
    return {
        id: withdrawal.id,
        transactionId: withdrawal.transactionId,
        type: withdrawal.type,
        amount: parseFloat(withdrawal.amount.toString()),
        address: withdrawal.address || "",
        sent: withdrawal.sent || false,
        currency: withdrawal.currency || "",
        status: withdrawal.status,
        accountId: withdrawal.accountId,
        accountNumber: withdrawal.account.accountNo,
        createdAt: withdrawal.createdAt.toISOString(),
        updatedAt: withdrawal.updatedAt.toISOString(),
        customerId: withdrawal.account.customer.id,
        customerName: withdrawal.account.customer.name,
    }
}
