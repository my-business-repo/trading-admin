"use server";

import { prisma } from "@/lib/prisma";
import { Account, Customer, TransactionDetails } from "@/type";
import { Address } from "node:cluster";


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

    console.log("lsit::",transactionList);

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


