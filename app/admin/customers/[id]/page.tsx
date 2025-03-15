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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import General from "./General";
import Deposit from "./DepositList";
import WithdrawList from "./WithdrawList";
import TradeList from "./TradeList";

export default function CustomerDetail() {
  const params = useParams();
  const id = parseInt(params.id as string, 10);
  const [customer, setCustomer] = useState<Customer | null>(null);


  useEffect(() => {
    const fetchCustomer = async () => {
      const customer = await getCustomerById(id);
      setCustomer(customer);
    };

    fetchCustomer();
  }, [id]);

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

      {/** other tables  */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">General</TabsTrigger>
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="trade">Trade</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          {customer && <General customer={customer} />}
        </TabsContent>
        <TabsContent value="deposit">
          {customer && <Deposit customer={customer} />}
        </TabsContent>
        <TabsContent value="withdraw">
          {customer && <WithdrawList customer={customer} />}
        </TabsContent>
        <TabsContent value="trade">
          {customer && <TradeList customer={customer} />}
        </TabsContent>
      </Tabs>
      {/** other tables  */}
    </div>
  );
}