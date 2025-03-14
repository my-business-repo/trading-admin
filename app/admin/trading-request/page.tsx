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
import { TradingHistory } from "@/type";
import { getTradingRequest, isAutoDecideWinLoseEnabled, updateAutoDecideWinLoseStatus, updateTradingStatus, updateTradingWindLose } from "@/app/actions/tradingActions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const getTradeTypeColor = (tradeType: string) => {
    return tradeType === "LONG" ? "bg-green-100 text-green-600" : tradeType === "SHORT" ? "bg-red-100 text-red-600" : "";
};

const getTradingStatusColor = (tradingStatus: string) => {
    return tradingStatus === "COMPLETED" ? "bg-blue-100 text-green-600" : tradingStatus === "PENDING" ? "bg-gray-100 text-gray-600" : "";
};

export default function TradingRequestPage() {
    const [tradingRequests, setTradingRequests] = useState<TradingHistory[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<TradingHistory[]>([]);
    const [customerNameFilter, setCustomerNameFilter] = useState("");
    const [tradeTypeFilter, setTradeTypeFilter] = useState("");
    const [autoDecideWinLose, setAutoDecideWinLose] = useState<boolean>(true);
    // const [isLoading, setIsLoading] = useState(true);

    async function fetchTradingRequests() {
        // setIsLoading(true);
        const requests = await getTradingRequest();
        setTradingRequests(requests as TradingHistory[]);
        setFilteredRequests(requests as TradingHistory[]);
        // setIsLoading(false);
    }

    useEffect(() => {
        fetchTradingRequests();
        fetchAutoDecideWinLoseStatus();
        // Set up polling every 5 seconds
        const interval = setInterval(fetchTradingRequests, 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchAutoDecideWinLoseStatus = async () => {
        const status = await isAutoDecideWinLoseEnabled();
        setAutoDecideWinLose(status);
    };
    useEffect(() => {
        const filtered = tradingRequests.filter(request => {
            const matchesCustomerId = request.loginId.toString().includes(customerNameFilter);
            const matchesTradeType = tradeTypeFilter ? request.tradeType === tradeTypeFilter : true;
            return matchesTradeType && matchesCustomerId;
        });
        setFilteredRequests(filtered);
    }, [customerNameFilter, tradeTypeFilter, tradingRequests]);

    const updatingWindLose = async (tradeId: number, newStatus: string) => {
        const res = await updateTradingWindLose(tradeId, newStatus);
        if (res !== null) {
            toast.success(`Trade ${tradeId} updated to status ${newStatus}, Successfully`);
            fetchTradingRequests();
        } else {
            toast.error(`Error updating trade ${tradeId}`);
        }
    };

    const handleAutoTradeStatusChange = async (status: boolean) => {
        const res = await updateAutoDecideWinLoseStatus(status);
        if (res !== null) {
            toast.success(`Auto trade status updated to ${status}`);
            fetchAutoDecideWinLoseStatus();
        }
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-center" richColors />
            <Card>
                <CardHeader>
                    <CardTitle>Trading Requests</CardTitle>
                    <div className="flex gap-4">
                        <Input
                            placeholder="Filter by Customer Id"
                            value={customerNameFilter}
                            onChange={(e) => setCustomerNameFilter(e.target.value)}
                        />
                        <select onChange={(e) => setTradeTypeFilter(e.target.value)} defaultValue="">
                            <option value="">All Trade Types</option>
                            <option value="LONG">Long</option>
                            <option value="SHORT">Short</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                            <Switch
                                id="auto-trade"
                                checked={autoDecideWinLose}
                                onCheckedChange={(status) => handleAutoTradeStatusChange(status)}
                            />
                            <Label htmlFor="auto-trade">Auto Decide Win/Lose</Label>
                        </div>
                        <Badge variant={autoDecideWinLose ? "default" : "destructive"}>
                            {autoDecideWinLose ? "Enabled" : "Disabled"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-10 w-10 animate-spin" />
                        </div>
                    ) : ( */}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>CUSTOMER ID</TableHead>
                                <TableHead>Customer Name</TableHead>
                                <TableHead>Account Number</TableHead>
                                <TableHead>Trade Type</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Period</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRequests.map((request) => (
                                <TableRow key={request.id}>
                                    <TableCell>{request.loginId}</TableCell>
                                    <TableCell>{request.customerName}</TableCell>
                                    <TableCell>{request.accountNumber}</TableCell>
                                    <TableCell>
                                        <Badge className={getTradeTypeColor(request.tradeType)}>
                                            {request.tradeType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{request.tradeQuantity} USDT</TableCell>
                                    <TableCell>
                                        <Badge className={getTradingStatusColor(request.tradingStatus)}>
                                            {request.tradingStatus}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-center w-20">{request.period} Sec</TableCell>
                                    <TableCell>
                                        {request.tradingStatus === 'PENDING' && (
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => updatingWindLose(request.id, 'WIN')}
                                                    className="w-20 bg-green-500 text-white px-2 py-1 rounded"
                                                >
                                                    WIN
                                                </Button>
                                                <Button
                                                    onClick={() => updatingWindLose(request.id, 'LOSE')}
                                                    className="w-20 bg-red-500 text-white px-2 py-1 rounded"
                                                >
                                                    LOSE
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {/* )} */}
                </CardContent>
            </Card>
        </div>
    );
}
