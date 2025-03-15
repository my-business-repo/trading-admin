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
import { Customer, Deposit } from "@/type";
import { getCustomerTransactions } from "@/app/actions/customerActions";
import { Loader2 } from "lucide-react";
import { getDepositsByUserId } from "@/app/actions/transactionsActions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function DepositList({ customer }: { customer: Customer }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [deposits, setDeposits] = useState<Deposit[]>([]);

    useEffect(() => {
        const fetchDeposits = async () => {
            setIsLoading(true);
            const deposits = await getDepositsByUserId(customer.id);
            console.log(deposits);
            setDeposits(deposits);
            setIsLoading(false);
        };

        fetchDeposits();
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
                <CardTitle>Deposit History</CardTitle>
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
                            ) : deposits.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">
                                        No deposit transactions found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                deposits.map((deposit) => (
                                    <TableRow key={deposit.id}>
                                        <TableCell>
                                            {new Date(deposit.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>{deposit.amount}</TableCell>
                                        <TableCell>{deposit.currency ? deposit.currency : "USD"}</TableCell>
                                        <TableCell>
                                            <Badge className={getStatusBadge(deposit.status)}>
                                                {deposit.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{deposit.transactionId}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="link"
                                                onClick={() => router.push(`/admin/deposits/${deposit.id}`)}
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
