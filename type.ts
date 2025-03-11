import { address_type, exchange_status, exchange_type, trade_tradeType, trade_tradingStatus, transaction_status } from "@prisma/client";

export interface Deposit {
    id: number;  // Ensure this is a number
    customerId: string;  // Adjust as necessary
    customerName: string;
    transactionId: string;  // Added transactionId
    type: string;  // Added type
    accountId: string;
    createdAt: string;
    updatedAt: string;
    amount: number;  // Ensure amount is a number
    status: transaction_status; //   PENDING COMPLETED FAILED REVERSED
    accountNumber?: string;
    accountName?: string;
    notes?: string;
}

// transaction details
export interface TransactionDetails {
    id: number;
    transactionId: string;
    type: string;
    amount: number;
    description: string;
    status: transaction_status;
    accountId: string;
    accountNumber: string;
    customerId: string;
    customerName: string;
    createdAt: string;
    updatedAt: string;
    transactionfile: TransactionFile[];
}

// transaction file
export interface TransactionFile {
    id: number;
    filename: string;
    filetype: string;
    fileurl: string;
}

export interface TradingHistory {
    id: number;
    customerId: string;
    customerName: string;
    accountId: number;
    loginId: string;
    accountNumber: string;
    createdAt: string;
    updatedAt: string;
    tradeType: trade_tradeType;
    period: number;
    tradingStatus: trade_tradingStatus;
    isSuccess: boolean;
    tradeQuantity: number;
}
export interface Customer {
    id: number;
    email: string;
    name: string;
    phone?: string;
    createdAt: string;
    updatedAt: string;
    active: boolean;
    isActivated: boolean;
    lastLoginTime?: string;
    socialSecurityNumber?: string;
    loginId: string;
    account: Account[];
    address: Address[];
    trade: Trade[];
}

export interface Account {
    id: number;
    accountNo: string;
    balance: number; // Ensure balance is a number
    inreview_balance: number; // Ensure inreview_balance is a number
    currency: string;
    isActive: boolean;
    customerId: number;
    createdAt: string;
    updatedAt: string;
}

export interface Address {
    id: number;
    type: address_type;
    streetAddress: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
    customerId: number;
    createdAt: string;
    updatedAt: string;
}

export interface Trade {
    id: number;
    customerId: number;
    accountId: number;
    tradeType: trade_tradeType;
    period: number;
    tradingStatus: trade_tradingStatus;
    isSuccess?: boolean;
    createdAt: string;
    updatedAt: string;
    tradeQuantity: number;
}

export interface WinRate {
    id: number;
    customerId: number;
    winRate: number; // Ensure winRate is a number
    createdAt: string;
    updatedAt: string;
}


export interface Withdrawal {
    id: number;
    transactionId: string;
    type: string;
    amount: number;
    address: string;
    sent: boolean;
    currency: string;
    status: transaction_status;
    accountId: number;
    accountNumber: string;
    createdAt: string;
    updatedAt: string;
    customerId: number;
    customerName: string;
}
export interface Exchange {
    id: number;
    fromCurrency: string;
    toCurrency: string;
    fromAccountNo: string;
    toAccountNo: string;
    amount: number; // Ensure amount is a number
    exchangedAmount: number; // Ensure exchangedAmount is a number
    exchangeRate: number; // Ensure exchangeRate is a number
    customerId: number;
    customerName: string;
    exchangeStatus: exchange_status;
    exchangeType: exchange_type;
    createdAt: string;
    updatedAt: string;
}

export interface Admin {
    id: number;
    email: string;
    name: string;
    phone?: string;
    createdAt: string;
    updatedAt: string;
    avatar?: string;
}

// id        Int      @id @default(autoincrement())
// loginId   String   @unique(map: "Admin_loginId_key") @db.Char(8)
// email     String   @unique(map: "Admin_email_key")
// name      String?
// phone     String
// password  String
// createdAt DateTime @default(now())
// updatedAt DateTime

export interface TradingSetting {
    id: number;
    seconds: number;
    percentage: number;
    tradingType: trade_tradeType;
    winRate: number;
}
