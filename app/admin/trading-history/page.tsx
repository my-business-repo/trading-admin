"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TradingHistory } from "@/type"; // Import the TradingHistory type
import { getAllTrading, updateTradingStatus } from "@/app/actions/tradingActions";
import { Badge } from "@/components/ui/badge"; // Import Badge for chip design
import { Input } from "@/components/ui/input"; // Import Input for filtering
import { Box, Loader2 } from "lucide-react"; // Import Loader for loading indicator
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
const getTradeTypeColor = (tradeType: string) => {
    return tradeType === "LONG" ? "bg-green-100 text-green-600" : tradeType === "SHORT" ? "bg-red-100 text-red-600" : "";
};

const getStatusColor = (isSuccess: boolean) => {
    return isSuccess ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600";
};

const getTradingStatusColor = (tradingStatus: string) => {
    return tradingStatus === "COMPLETED" ? "bg-blue-100 text-green-600" : tradingStatus === "PENDING" ? "bg-gray-100 text-gray-600" : "";
};

export default function TradingHistoryPage() {
    const [tradingHistory, setTradingHistory] = useState<TradingHistory[]>([]);
    const [filteredHistory, setFilteredHistory] = useState<TradingHistory[]>([]);
    const [customerNameFilter, setCustomerNameFilter] = useState("");
    const [tradeTypeFilter, setTradeTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [tradingStatusFilter, setTradingStatusFilter] = useState("");
    const [isLoading, setIsLoading] = useState(true); // State to manage loading


    async function fetchTradingHistory() {
        setIsLoading(true); // Set loading to true when fetching starts
        const history = await getAllTrading();
        setTradingHistory(history as TradingHistory[]);
        setFilteredHistory(history as TradingHistory[]);
        setIsLoading(false); // Set loading to false after fetching
    }

    useEffect(() => {
        fetchTradingHistory();
    }, []);

    useEffect(() => {
        const filtered = tradingHistory.filter(trade => {
            const matchesCustomerName = trade.customerName.toLowerCase().includes(customerNameFilter.toLowerCase());
            const matchesTradeType = tradeTypeFilter ? trade.tradeType === tradeTypeFilter : true;
            const matchesStatus = statusFilter ? (trade.isSuccess ? "WIN" : "LOSE") === statusFilter : true;
            const matchesTradingStatus = tradingStatusFilter ? trade.tradingStatus === tradingStatusFilter : true;

            return matchesCustomerName && matchesTradeType && matchesStatus && matchesTradingStatus;
        });
        setFilteredHistory(filtered);
    }, [customerNameFilter, tradeTypeFilter, statusFilter, tradingStatusFilter, tradingHistory]);

    const updatingTradingStatus = async (tradeId: number, newStatus: string) => {
        const res = await updateTradingStatus(tradeId, newStatus);
        if (res !== null) {
            toast.success(`Trade ${tradeId} updated to status ${newStatus}, Successfully`);
            fetchTradingHistory();
        } else {
            toast.error(`Error updating trade ${tradeId}`);
        }
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-center" richColors />
            <Card>
                <CardHeader>
                    <CardTitle>Trading History</CardTitle>
                    <div className="flex gap-4">
                        <Input
                            placeholder="Filter by Customer Name"
                            value={customerNameFilter}
                            onChange={(e) => setCustomerNameFilter(e.target.value)}
                        />
                        <select onChange={(e) => setTradeTypeFilter(e.target.value)} defaultValue="">
                            <option value="">All Trade Types</option>
                            <option value="LONG">Long</option>
                            <option value="SHORT">Short</option>
                        </select>
                        <select onChange={(e) => setStatusFilter(e.target.value)} defaultValue="">
                            <option value="">All Conditions</option>
                            <option value="WIN">Win</option>
                            <option value="LOSE">Lose</option>
                        </select>
                        <select onChange={(e) => setTradingStatusFilter(e.target.value)} defaultValue="">
                            <option value="">All Trading Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="FAILED">Failed</option>
                        </select>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? ( // Check if loading
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-10 w-10 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer ID</TableHead>
                                    <TableHead>Customer Name</TableHead>
                                    <TableHead>Account Number</TableHead>
                                    <TableHead>Trade Type</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Condition</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Action</TableHead> {/* New Action Column */}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredHistory.map((trade) => (
                                    <TableRow key={trade.id}>
                                        <TableCell>{trade.customerId}</TableCell>
                                        <TableCell>{trade.customerName}</TableCell>
                                        <TableCell>{trade.accountNumber}</TableCell>
                                        <TableCell>
                                            <Badge className={getTradeTypeColor(trade.tradeType)}>
                                                {trade.tradeType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{trade.tradeQuantity} USDT</TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(trade.isSuccess)}>
                                                {trade.isSuccess ? "WIN" : "LOSE"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getTradingStatusColor(trade.tradingStatus)}>
                                                {trade.tradingStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{new Date(trade.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-center w-20">{trade.period} Sec</TableCell>
                                        <TableCell>
                                            {trade.tradingStatus === 'PENDING' && (
                                                <div className="flex gap-2">
                                                    <Button onClick={() => updatingTradingStatus(trade.id, 'COMPLETED')} className="w-20 bg-green-500 text-white px-2 py-1 rounded">Complete</Button>
                                                    <Button onClick={() => updatingTradingStatus(trade.id, 'FAILED')} className="w-20 bg-red-500 text-white px-2 py-1 rounded">Fail</Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}