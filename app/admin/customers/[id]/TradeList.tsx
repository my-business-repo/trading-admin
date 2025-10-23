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
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Customer, TradingHistory } from "@/type";
import { Loader2 } from "lucide-react";
import { getTradingByUserId, updateTradingStatus } from "@/app/actions/tradingActions";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const getTradeTypeColor = (tradeType: string) => {
    return tradeType === "LONG" ? "bg-green-100 text-green-600" : tradeType === "SHORT" ? "bg-red-100 text-red-600" : "";
};

const getStatusColor = (isSuccess: boolean) => {
    return isSuccess ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600";
};

const getTradingStatusColor = (tradingStatus: string) => {
    return tradingStatus === "COMPLETED" ? "bg-blue-100 text-green-600" : tradingStatus === "PENDING" ? "bg-gray-100 text-gray-600" : "";
};

export default function TradeList({ customer }: { customer: Customer }) {
    const [isLoading, setIsLoading] = useState(true);
    const [trades, setTrades] = useState<TradingHistory[]>([]);
    const [filteredTrades, setFilteredTrades] = useState<TradingHistory[]>([]);
    const [selectedTradeType, setSelectedTradeType] = useState<string>("ALL");
    const [selectedWinLose, setSelectedWinLose] = useState<string>("ALL");

    useEffect(() => {
        const fetchTrades = async () => {
            setIsLoading(true);
            const trades = await getTradingByUserId(customer.id);
            setTrades(trades);
            setFilteredTrades(trades);
            setIsLoading(false);
        };

        fetchTrades();
    }, [customer.id]);

    useEffect(() => {
        let filtered = [...trades];

        if (selectedTradeType !== "ALL") {
            filtered = filtered.filter(trade => trade.tradeType === selectedTradeType);
        }

        if (selectedWinLose !== "ALL") {
            filtered = filtered.filter(trade => {
                if (selectedWinLose === "WIN") return trade.isSuccess;
                if (selectedWinLose === "LOSE") return !trade.isSuccess;
                return true;
            });
        }

        setFilteredTrades(filtered);
    }, [selectedTradeType, selectedWinLose, trades]);

    const handleUpdateStatus = async (tradeId: number, newStatus: string) => {
        const res = await updateTradingStatus(tradeId, newStatus);
        if (res !== null) {
            toast.success(`Trade ${tradeId} updated to status ${newStatus} successfully`);
            // Refresh trades after update
            const updatedTrades = await getTradingByUserId(customer.id);
            setTrades(updatedTrades);
        } else {
            toast.error(`Error updating trade ${tradeId}`);
        }
    };

    return (
        <Card>
            <Toaster position="top-center" richColors />
            <CardHeader>
                <CardTitle>Trading History</CardTitle>
                <div className="flex gap-4 mt-4">
                    <Select value={selectedTradeType} onValueChange={setSelectedTradeType}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by trade type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Types</SelectItem>
                            <SelectItem value="LONG">Long</SelectItem>
                            <SelectItem value="SHORT">Short</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={selectedWinLose} onValueChange={setSelectedWinLose}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by result" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Results</SelectItem>
                            <SelectItem value="WIN">Win</SelectItem>
                            <SelectItem value="LOSE">Lose</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Trade Type</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Condition</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Period</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10">
                                        <div className="flex justify-center items-center h-full w-full">
                                            <Loader2 className="h-10 w-10 animate-spin" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredTrades.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10">
                                        No trading history found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTrades.map((trade) => (
                                    <TableRow key={trade.id}>
                                        <TableCell>
                                            {new Date(trade.createdAt).toLocaleDateString()}
                                        </TableCell>
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
                                        <TableCell className="text-center">{trade.period} Sec</TableCell>
                                        <TableCell>
                                            {trade.tradingStatus === 'PENDING' && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => handleUpdateStatus(trade.id, 'COMPLETED')}
                                                        className="w-20 bg-green-500 text-white px-2 py-1 rounded"
                                                    >
                                                        Complete
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleUpdateStatus(trade.id, 'FAILED')}
                                                        className="w-20 bg-red-500 text-white px-2 py-1 rounded"
                                                    >
                                                        Fail
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
