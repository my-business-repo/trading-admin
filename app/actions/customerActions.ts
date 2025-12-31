"use server";

import { prisma } from "@/lib/prisma";
import { Account, Customer, TransactionDetails, Winrate } from "@/type";
import { Address } from "node:cluster";
import { compare, hash } from "bcrypt";


// get all customers
export const getCustomers = async (): Promise<Customer[]> => {
    const customers = await prisma.customer.findMany({
        include: {
            account: true,
            address: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    const customerList = customers.map((customer) => ({
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
        active: customer.active,
        isActivated: customer.isActivated,
        lastLoginTime: customer.lastLoginTime?.toISOString(),
        socialSecurityNumber: customer.socialSecurityNumber,
        loginId: customer.loginId,
        account: customer.account as unknown as Account[],
        address: customer.address as unknown as Address[],
    }));

    return customerList as unknown as Customer[];
};


// get customer with messages no read number by admin
// Get all customers with the number of unread messages (isReadbyAdmin: false) for each customer
export const getCustomersWithUnreadMessagesCount = async (): Promise<
    Array<Customer & { unreadMessagesCount: number }>
> => {
    // Fetch all customers as before, including their ids
    const customers = await prisma.customer.findMany({
        include: {
            account: true,
            address: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    // For all customer ids, query counts of unread messages grouped by customerId
    const unreadCounts = await prisma.message.groupBy({
        by: ["customerId"],
        where: {
            isReadbyAdmin: false,
        },
        _count: {
            id: true,
        },
    });

    // Map: customerId -> unread count
    const unreadMap = Object.fromEntries(
        unreadCounts.map((row) => [row.customerId, row._count.id])
    );

    // Construct customer list with unreadMessagesCount
    return customers.map((customer) => ({
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
        active: customer.active,
        isActivated: customer.isActivated,
        lastLoginTime: customer.lastLoginTime?.toISOString(),
        socialSecurityNumber: customer.socialSecurityNumber,
        loginId: customer.loginId,
        account: customer.account as unknown as Account[],
        address: customer.address as unknown as Address[],
        unreadMessagesCount: unreadMap[customer.id] || 0,
    })) as unknown as Array<Customer & { unreadMessagesCount: number }>;
};



// get customer by id
export const getCustomerById = async (id: number): Promise<Customer> => {
    const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
            account: true,
            address: true,
            trade: true,
        },
    });

    return customer as unknown as Customer;
};


// get customer's transaction history
export const getCustomerTransactions = async (id: number): Promise<TransactionDetails[]> => {

    const transactions = await prisma.transaction.findMany({
        where: { account: { customerId: id } },
        include: {
            account: {
                include: {
                    customer: true,
                },
            },
        },
    });


    const transactionList = transactions.map((transaction) => ({
        id: transaction.id,
        transactionId: transaction.transactionId,
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
        accountId: transaction.accountId,
        customerName: transaction.account.customer.name,
    }));

    console.log("lsit::", transactionList);

    return transactionList as unknown as TransactionDetails[];
};

// get recent users
export const getRecentUsers = async (): Promise<Customer[]> => {
    const customers = await prisma.customer.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
    });

    return customers as unknown as Customer[];
};

// get total customers
export const getTotalCustomers = async (): Promise<number> => {
    const totalCustomers = await prisma.customer.count();
    return totalCustomers;
};


// change customer's account balance
export const changeCustomerAccountBalance = async (id: number, accountId: number, balance: number) => {
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) {
        throw new Error("Account not found");
    }

    const updatedBalance = account.balance.plus(balance);

    const updatedAccount = await prisma.account.update({
        where: { id: accountId },
        data: { balance: updatedBalance },
    });

    return updatedAccount;
};


// change customer password by admin
export const changeCustomerPasswordByAdmin = async (
    customerId: number,
    type: "login" | "withdraw",
    newPassword: string
): Promise<{ success: boolean; message: string }> => {
    try {
        // Determine which password field to update
        let data: any = {};
        const hashedPassword = await hash(newPassword, 10);

        if (type === "login") {
            data.password = hashedPassword;
        } else if (type === "withdraw") {
            data.fund_password = hashedPassword;
        } else {
            throw new Error("Invalid password type.");
        }

        // Update the customer
        await prisma.customer.update({
            where: { id: customerId },
            data,
        });

        return { success: true, message: "Password updated successfully." };
    } catch (error: any) {
        return { success: false, message: error.message ?? "Failed to update password." };
    }
};



export const getCustomerWinrate = async (customerId: number): Promise<Winrate | null> => {
    let winrate = await prisma.winrate.findFirst({
        where: {
            customerId: customerId,
        },
        include: {
            customer: true,
        },
    });

    // If no winrate found, create a new one with value 0
    if (!winrate) {
        winrate = await prisma.winrate.create({
            data: {
                customerId: customerId,
                winRate: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            include: {
                customer: true,
            },
        });
    }

    // Convert Date objects to strings for createdAt/updatedAt if necessary
    return {
        ...winrate,
        createdAt: winrate.createdAt instanceof Date ? winrate.createdAt.toISOString() : winrate.createdAt,
        updatedAt: winrate.updatedAt instanceof Date ? winrate.updatedAt.toISOString() : winrate.updatedAt,
    } as Winrate;
};


export const updateCustomerWinrate = async (
    customerId: number,
    newWinrate: number
): Promise<{ success: boolean; message: string; winRate?: Winrate | null }> => {
    try {
        // Ensure winrate is a decimal value between 0 and 1
        const winRateDecimal =
            newWinrate > 1 ? newWinrate / 100 : newWinrate;

        let winrate = await prisma.winrate.findFirst({
            where: { customerId },
        });

        if (!winrate) {
            winrate = await prisma.winrate.create({
                data: {
                    customerId,
                    winRate: winRateDecimal,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
        } else {
            winrate = await prisma.winrate.update({
                where: { id: winrate.id },
                data: {
                    winRate: winRateDecimal,
                    updatedAt: new Date(),
                },
            });
        }

        // Return success with updated winrate info (converted dates if needed)
        return {
            success: true,
            message: "Winrate updated successfully.",
            winRate: {
                ...winrate,
                createdAt:
                    winrate.createdAt instanceof Date
                        ? winrate.createdAt.toISOString()
                        : winrate.createdAt,
                updatedAt:
                    winrate.updatedAt instanceof Date
                        ? winrate.updatedAt.toISOString()
                        : winrate.updatedAt,
            } as Winrate,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error?.message || "Failed to update winrate.",
        };
    }
};

type DeleteCustomerResult = {
    success: boolean;
    message: string;
};

/**
 * Delete a customer and all related data by customerId.
 * This performs a cascading delete including: accounts, trades, transactions, transactionfiles, winrates, exchanges, messages, addresses.
 * @param customerId number
 */
export async function deleteCustomerById(customerId: number): Promise<DeleteCustomerResult> {
    try {
        // Delete messages related to customer
        await prisma.message.deleteMany({
            where: { customerId }
        });

        // Delete winrate(s)
        await prisma.winrate.deleteMany({
            where: { customerId }
        });

        // Delete exchanges
        await prisma.exchange.deleteMany({
            where: { customerId }
        });

        // Delete addresses
        await prisma.address.deleteMany({
            where: { customerId }
        });

        // Delete trades
        await prisma.trade.deleteMany({
            where: { customerId }
        });

        // Find all accounts belonging to the customer
        const accounts = await prisma.account.findMany({
            where: { customerId },
            select: { id: true }
        });
        const accountIds = accounts.map(a => a.id);

        if (accountIds.length > 0) {
            // Get all transactions for those accounts
            const transactions = await prisma.transaction.findMany({
                where: { accountId: { in: accountIds } },
                select: { id: true }
            });
            const transactionIds = transactions.map(t => t.id);

            // Delete all transactionfiles for those transactions
            if (transactionIds.length > 0) {
                await prisma.transactionfile.deleteMany({
                    where: { transactionId: { in: transactionIds } }
                });
            }

            // Delete all transactions for those accounts
            await prisma.transaction.deleteMany({
                where: { accountId: { in: accountIds } }
            });

            // Delete the accounts themselves
            await prisma.account.deleteMany({
                where: { id: { in: accountIds } }
            });
        }

        // Finally, delete the customer
        await prisma.customer.delete({
            where: { id: customerId }
        });

        return { success: true, message: "Customer and all related data deleted successfully." };
    } catch (error: any) {
        return { success: false, message: error?.message || "Failed to delete customer." };
    }
}
