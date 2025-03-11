"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Mail, Phone, Calendar, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Customer, Trade, TransactionDetails } from "@/type";
import { getCustomerById, getCustomerTransactions } from "@/app/actions/customerActions";
import { useEffect, useState } from "react";

export default function CustomerDetail() {
  const params = useParams();
  const id = parseInt(params.id as string, 10);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<TransactionDetails[]>([]);

  useEffect(() => {
    const fetchCustomer = async () => {
      const customer = await getCustomerById(id);
      setCustomer(customer);
    };

    // fetch customer's transactions
    const fetchTransactions = async () => {
      const transactions = await getCustomerTransactions(id);
      setTransactions(transactions);
      console.log(transactions);
    };

    fetchTransactions();
    fetchCustomer();
  }, [id]);

  const getStatusBadge = (active: boolean) => {
    return active ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  // Calculate trade summary
  const calculateTradeSummary = (trades: Trade[]) => {
    const totalTrades = trades.length;
    const totalWins = trades.filter(trade => trade.isSuccess).length;
    const totalLosses = totalTrades - totalWins;
    const totalQuantity = trades.reduce((sum, trade) => sum + trade.tradeQuantity, 0);
    
    return { totalTrades, totalWins, totalLosses, totalQuantity };
  };

  const tradeSummary = customer?.trade ? calculateTradeSummary(customer.trade) : { totalTrades: 0, totalWins: 0, totalLosses: 0, totalQuantity: 0 };

  // Calculate transaction summaries
  const calculateTransactionSummary = (transactions: TransactionDetails[]) => {
    const totalDeposit = transactions.filter(tx => tx.type === "DEPOSIT").reduce((sum, tx) => sum + tx.amount, 0);
    const totalWithdraw = transactions.filter(tx => tx.type === "WITHDRAWAL").reduce((sum, tx) => sum + tx.amount, 0);
    
    return { totalDeposit, totalWithdraw };
  };

  const transactionSummary = calculateTransactionSummary(transactions);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/customers">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customer Details</h1>
            <p className="text-muted-foreground">
              <p className="text-blue-600">Customer ID: {customer?.id}</p> 
              <p className="text-blue-600">Login ID: {customer?.loginId}</p>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit Customer</Button>
          <Button variant="destructive">Deactivate Account</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback>
                  <UserCircle className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{customer?.name}</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Badge className={getStatusBadge(customer?.active || false)}>
                    {customer?.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customer?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer?.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {new Date(customer?.createdAt || "").toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              {customer?.account.map((acc, index) => (
                <div key={acc.id}>
                  <h3 className="text-lg font-semibold text-blue-600">Account {index + 1}</h3>
                  <p className="text-sm font-medium text-muted-foreground">Account No</p>
                  <p className="text-lg">{acc.accountNo}</p>
                  <p className="text-sm font-medium text-muted-foreground">Balance</p>
                  <p className="text-lg">{acc.balance} {acc.currency}</p>
                  {index < customer.account.length - 1 && <hr className="my-4" />} {/* Divider between accounts */}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trade Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p>Total Trades: {tradeSummary.totalTrades}</p>
              <p>Total Wins: {tradeSummary.totalWins}</p>
              <p>Total Losses: {tradeSummary.totalLosses}</p>
              <p>Total Quantity: {tradeSummary.totalQuantity} USDT</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p>Total Deposit: {transactionSummary.totalDeposit} USDT</p>
              <p>Total Withdraw: {transactionSummary.totalWithdraw} USDT</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}