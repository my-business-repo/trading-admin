"use client";

import { getExchangeByUserId } from "@/app/actions/exchangeActions";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableRow, TableHead, TableHeader, TableBody, TableCell } from "@/components/ui/table";
import { Customer, Exchange } from "@/type";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";


export default function ExchangeList({ customer }: { customer: Customer }) {
    const [isLoading, setIsLoading] = useState(true);
    const [exchanges, setExchanges] = useState<Exchange[]>([]);
    const [filteredExchanges, setFilteredTrades] = useState<Exchange[]>();
    const [exchangeStatus, setExchangesStatus] = useState<string>("ALL");

    useEffect(() => {
        const fetchExchanges = async () => {
            setIsLoading(true);
            const exchanges = await getExchangeByUserId(customer.id);
            setExchanges(exchanges);
            setFilteredTrades(exchanges);
            console.log(exchanges);
            setIsLoading(false);
        };

        fetchExchanges();
    }, [customer.id]);


    useEffect(() => {
        let filtered = [...exchanges];
        if (exchangeStatus !== "ALL") {
            filtered = filtered.filter(ex => ex.exchangeStatus === exchangeStatus);
        }
        setFilteredTrades(filtered);
    }, [exchangeStatus, exchanges]);

    return (
        <Card>
            <Toaster position="top-center" richColors />
            <CardHeader>
                <CardTitle>Exchange History</CardTitle>
                <div className="flex gap-4 mt-5">
                    <Select value={exchangeStatus} onValueChange={setExchangesStatus}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by result" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Results</SelectItem>
                            <SelectItem value="APPROVED">APPROVED</SelectItem>
                            <SelectItem value="REJECTED">REJECTED</SelectItem>
                            <SelectItem value="PENDING">PENDING</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Exchange Rate</TableHead>
                            <TableHead>Exchange Amount</TableHead>
                            <TableHead>Exchange From</TableHead>
                            <TableHead>Exchange To</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Period</TableHead>
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
                        ) :
                            filteredExchanges?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10">
                                        No trading history found
                                    </TableCell>
                                </TableRow>
                            ) :
                                filteredExchanges?.map(ex => (
                                    <TableRow key={ex.id}>
                                        <TableCell>
                                            {ex.customerName}
                                        </TableCell>
                                        <TableCell>
                                            {ex.exchangeRate} {ex.toCurrency}
                                        </TableCell>
                                        <TableCell>
                                            {ex.exchangedAmount} {ex.fromCurrency}
                                        </TableCell>
                                        <TableCell>
                                            {ex.fromCurrency}
                                        </TableCell>
                                        <TableCell>
                                            {ex.toCurrency}
                                        </TableCell>
                                        <TableCell>
                                            {ex.exchangeStatus}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(ex.createdAt).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                        }
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
