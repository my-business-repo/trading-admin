"use server";

import { prisma } from "@/lib/prisma";
import { Account, Customer, TransactionDetails } from "@/type";
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

