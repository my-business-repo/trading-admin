"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Calendar, UserCircle, PlusCircle, X, Edit3, Edit3Icon } from "lucide-react";
import { Customer, Trade, TransactionDetails } from "@/type";
import { useEffect, useState } from "react";
import { changeCustomerAccountBalance, getCustomerTransactions } from "@/app/actions/customerActions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface GeneralProps {
    customer: Customer;
}

export default function General({ customer }: GeneralProps) {

    const router = useRouter();
    const [transactions, setTransactions] = useState<TransactionDetails[]>([]);
    const [totalUSD, setTotalUSD] = useState<number>(0);
    const [showChangeBalanceModal, setShowChangeBalanceModal] = useState<boolean>(false);
    const [selectedAccount, setSelectedAccount] = useState<number>(0);
    const [balanceChange, setBalanceChange] = useState<number | null>(null);
    const [selectedAccountBalance, setSelectedAccountBalance] = useState<number>(0);
    const [selectedAccountCurrency, setSelectedAccountCurrency] = useState<string>("");

    // fetch customer's transactions
    const fetchTransactions = async () => {
        const transactions = await getCustomerTransactions(customer.id);
        setTransactions(transactions);
        console.log(transactions);
    };

    useEffect(() => {
        fetchTransactions();

        // calculate the total balance of the account
        const calculateTotalBalance = async () => {
            let totalBalance = 0;

            for (const acc of customer.account) {
                const currency = acc.currency;
                const balance = acc.balance;

                // Skip USD accounts as they're already in USD
                if (currency.toLowerCase() === 'usd') {
                    totalBalance += balance;
                    continue;
                }
                try {
                    const priceResponse = await fetch(
                        `https://min-api.cryptocompare.com/data/price?fsym=${currency.toLowerCase()}&tsyms=USD`
                    );
                    const priceData = await priceResponse.json();
                    const usdPrice = priceData.USD;
                    totalBalance += balance * usdPrice;
                } catch (error) {
                    console.error(`Error fetching price for ${currency}:`, error);
                    totalBalance += balance; // fallback to original balance
                }
            }
            console.log('usd totalBalance', totalBalance);
            setTotalUSD(totalBalance);
        };

        calculateTotalBalance();
    }, []);

    const getStatusBadge = (active: boolean) => {
        return active ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    };

    // Handle account selection
    const handleAccountSelect = (accountId: string) => {
        setSelectedAccount(Number(accountId));
        const account = customer.account.find(acc => acc.id.toString() === accountId);
        if (account) {
            setSelectedAccountBalance(account.balance);
            setSelectedAccountCurrency(account.currency);
        }
    };

    // Handle balance change submission

    const handleBalanceChange = async () => {
        // TODO: Implement API call to update balance
        console.log('Changing balance for account:', selectedAccount, 'by:', balanceChange);
        setShowChangeBalanceModal(false);
        setSelectedAccount(0);
        setBalanceChange(0);
        setSelectedAccountBalance(0);

        if (balanceChange !== null) {
            const updatedAccount = await changeCustomerAccountBalance(customer.id, selectedAccount, balanceChange);
            console.log('updatedAccount', updatedAccount);
            // if updatedAccount is not null, show a success message
            if (updatedAccount) {
                toast.success('Balance updated successfully');
                window.location.reload();
            }
        }
    };

    // Calculate transaction summaries
    const calculateTransactionSummary = (transactions: TransactionDetails[]) => {
        const totalDeposit = transactions.filter(tx => tx.type === "DEPOSIT").reduce((sum, tx) => sum + Number(tx.amount), 0);
        const totalWithdraw = transactions.filter(tx => tx.type === "WITHDRAWAL").reduce((sum, tx) => sum + Number(tx.amount), 0);

        return { totalDeposit, totalWithdraw };
    };

    const transactionSummary = calculateTransactionSummary(transactions);

    // Calculate trade summary
    const calculateTradeSummary = (trades: Trade[]) => {
        const totalTrades = trades.length;
        const totalWins = trades.filter(trade => trade.isSuccess).length;
        const totalLosses = totalTrades - totalWins;
        const totalQuantity = trades.reduce((sum, trade) => sum + trade.tradeQuantity, 0);

        return { totalTrades, totalWins, totalLosses, totalQuantity };
    };

    const tradeSummary = customer?.trade ? calculateTradeSummary(customer.trade) : { totalTrades: 0, totalWins: 0, totalLosses: 0, totalQuantity: 0 };

    return (
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
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Account Information</CardTitle>
                    <div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowChangeBalanceModal(true)}
                        >
                            <Edit3Icon className="h-4 w-4 mr-2 text-green-600" />
                            Change Balance
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                            <p className="text-lg font-semibold text-blue-800">
                                Total Balance: ${Number(totalUSD).toFixed(3)} USD
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 overflow-y-auto max-h-[300px]">
                        {customer?.account.map((acc, index) => (
                            <div key={acc.id} className="border border-blue-100 rounded-lg p-2">
                                <h3 className="text-lg font-semibold text-blue-600">ACCOUNT {index + 1}</h3>
                                <p className="text-sm font-medium text-muted-foreground">Account ID</p>
                                <p className="text-lg">{acc.accountNo}</p>
                                <p className="text-sm font-medium text-muted-foreground">Balance</p>
                                <div className="flex items-center gap-2">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-1 mt-1">
                                        <p className="text-lg text-blue-800">
                                            {acc.balance} {acc.currency}
                                        </p>
                                    </div>
                                </div>
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
                        <p>Total Deposit: ${Number(transactionSummary.totalDeposit).toFixed(3)} USD</p>
                        <p>Total Withdraw: ${Number(transactionSummary.totalWithdraw).toFixed(3)} USD</p>
                    </div>
                </CardContent>
            </Card>

            {/* Change Balance Modal */}
            <Dialog open={showChangeBalanceModal} onOpenChange={setShowChangeBalanceModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Balance</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="accountSelect">Select Account</Label>
                                <Select
                                    value={selectedAccount.toString()}
                                    onValueChange={handleAccountSelect}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customer?.account.map((acc) => (
                                            <SelectItem key={acc.id} value={acc.id.toString()}>
                                                {acc.currency} - {acc.accountNo}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="balance">Balance</Label>
                                <p>{selectedAccountBalance} {selectedAccountCurrency}</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="balanceChange">Balance Change</Label>
                                <p>Add or Subtract from the balance. To add, enter a positive number. To subtract, enter a negative number.</p>
                                <Input
                                    id="balanceChange"
                                    type="number"
                                    value={balanceChange || ""}
                                    onChange={(e) => setBalanceChange(Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Button onClick={handleBalanceChange}>Change Balance</Button>
                            </div>
                        </div>
                    </DialogDescription>

                </DialogContent>
            </Dialog>
        </div>
    );
}
