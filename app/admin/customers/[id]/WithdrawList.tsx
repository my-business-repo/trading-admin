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
import { Customer, Withdrawal } from "@/type";
import { Loader2 } from "lucide-react";
import { getWithdrawalsByUserId } from "@/app/actions/transactionsActions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function WithdrawList({ customer }: { customer: Customer }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

    useEffect(() => {
        const fetchWithdrawals = async () => {
            setIsLoading(true);
            const withdrawals = await getWithdrawalsByUserId(customer.id);
            setWithdrawals(withdrawals);
            setIsLoading(false);
        };

        fetchWithdrawals();
    }, [customer.id]);

    const getStatusBadge = (status: string) => {
        const styles = {
            "PENDING": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
            "COMPLETED": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", 
            "FAILED": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        };
        return styles[status as keyof typeof styles] || "";
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Withdrawal History</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Currency</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead>Detail</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">
                                        <div className="flex justify-center items-center h-full w-full">
                                            <Loader2 className="h-10 w-10 animate-spin" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : withdrawals.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">
                                        No withdrawal transactions found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                withdrawals.map((withdrawal) => (
                                    <TableRow key={withdrawal.id}>
                                        <TableCell>
                                            {new Date(withdrawal.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>{withdrawal.amount}</TableCell>
                                        <TableCell>{withdrawal.currency ? withdrawal.currency : "USD"}</TableCell>
                                        <TableCell>
                                            <Badge className={getStatusBadge(withdrawal.status)}>
                                                {withdrawal.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{withdrawal.transactionId}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="link"
                                                onClick={() => router.push(`/admin/withdrawals/${withdrawal.id}`)}
                                            >
                                                View Details
                                            </Button>
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
