"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Withdrawal } from "@/type";
import { getWithdrawalById } from "@/app/actions/transactionsActions";
import { useEffect, useState } from "react";

export default function WithdrawalDetail() {
  const params = useParams();
  const id = params.id as string;
  const [withdrawal, setWithdrawal] = useState<Withdrawal | null>(null);

  useEffect(() => {
    const fetchWithdrawal = async () => {
      const withdrawal = await getWithdrawalById(id);
      setWithdrawal(withdrawal);
    };
    fetchWithdrawal();
  }, [id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      "PENDING" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "APPROVED": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "COMPLETED": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "REJECTED": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return styles[status as keyof typeof styles] || "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/withdrawals">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Withdrawal Details</h1>
            <p className="text-muted-foreground">
              Reference: {withdrawal?.transactionId}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Customer Name</p>
              <p className="text-lg">{withdrawal?.customerName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Customer ID</p>
              <p className="text-lg">{withdrawal?.customerId}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Amount</p>
              <p className="text-lg">{withdrawal?.amount} {withdrawal?.currency}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge className={getStatusBadge(withdrawal?.status || "")}>
                {withdrawal?.status && withdrawal?.status?.charAt(0).toUpperCase() + withdrawal?.status?.slice(1)}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <p className="text-lg">{new Date(withdrawal?.createdAt || "").toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Wallet Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Coin Type</p>
                <p className="text-lg">{withdrawal?.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Network</p>
                <p className="text-lg">{withdrawal?.address}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Wallet Address</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-sm bg-muted p-2 rounded">
                  {withdrawal?.address}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(withdrawal?.address || "")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {withdrawal?.transactionId && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transaction Hash</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm bg-muted p-2 rounded">
                    {withdrawal.transactionId}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(withdrawal.transactionId)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {/* Removed notes section as it does not exist in the Withdrawal type */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}