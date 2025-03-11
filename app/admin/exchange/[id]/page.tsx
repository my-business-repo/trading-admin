"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Exchange } from "@/type";
import { useEffect, useState } from "react";
import { getExchangeById } from "@/app/actions/exchangeActions";

export default function ExchangeDetail() {
  const params = useParams();
  const id = params.id as string;

  const [exchange, setExchange] = useState<Exchange | null>(null);

  useEffect(() => {
    const fetchExchange = async () => {
      const exchange = await getExchangeById(Number(id));
      setExchange(exchange);
    };
    fetchExchange();
  }, [id]);

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return styles[status as keyof typeof styles] || "";
  };

  if (!exchange) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/exchange">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Exchange Details</h1>
            <p className="text-muted-foreground">
              Exchange ID: {exchange.id}
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
              <p className="text-lg">{exchange.customerName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Customer ID</p>
              <p className="text-lg">{exchange.customerId}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exchange Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge className={getStatusBadge(exchange.exchangeStatus)}>
                {exchange.exchangeStatus}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="text-lg">{new Date(exchange.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Updated At</p>
              <p className="text-lg">{new Date(exchange.updatedAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Exchange Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">From</p>
                  <p className="text-lg">
                    {exchange.amount} {exchange.fromCurrency}
                  </p>
                  <p className="text-sm text-muted-foreground">Account: {exchange.fromAccountNo}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">To</p>
                  <p className="text-lg">
                    {exchange.exchangedAmount} {exchange.toCurrency}
                  </p>
                  <p className="text-sm text-muted-foreground">Account: {exchange.toAccountNo}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Exchange Rate</p>
                  <p className="text-lg">
                    1 {exchange.fromCurrency} = {exchange.exchangeRate} {exchange.toCurrency}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Exchange Type</p>
                  <p className="text-lg">{exchange.exchangeType}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}