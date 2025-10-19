"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Customer } from "@/type";
import { getRecentUsers, getTotalCustomers } from "@/app/actions/customerActions";
import { getTotalDeposit, getTotalTrading, getTotalWithdraw } from "@/app/actions/tradingActions";

interface DashboardStats {
  totalCustomers: number;
  totalTrading: number;
  totalDeposit: number;
  totalWithdraw: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalTrading: 0,
    totalDeposit: 0,
    totalWithdraw: 0,
  });
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);

  // fetch all dashboard stats
  const fetchDashboardStats = async () => {
    const [totalCustomers, totalTrading, totalDeposit, totalWithdraw] = await Promise.all([
      getTotalCustomers(),
      getTotalTrading(), 
      getTotalDeposit(),
      getTotalWithdraw()
    ]);

    setStats({
      totalCustomers,
      totalTrading,
      totalDeposit, 
      totalWithdraw
    });
  };

  useEffect(() => {
    // Mock data - replace with actual API calls
    fetchDashboardStats();
    // get recent customers
    const fetchCustomers = async () => {
      const recentCustomers = await getRecentUsers();
      setRecentCustomers(recentCustomers);
    };
    fetchCustomers();

  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.totalCustomers}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trading</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrading}</div>
            <p className="text-xs text-muted-foreground">
              +180 from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${ Number(stats.totalDeposit).toFixed(3)}
            </div>
            <p className="text-xs text-muted-foreground">
              +10% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdraw</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Number(stats.totalWithdraw).toFixed(3)}</div>
            <p className="text-xs text-muted-foreground">
              +2.5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Customers</CardTitle>
              <CardDescription>
                Recently joined customers
              </CardDescription>
            </div>
            <Link href="/admin/customers">
              <Button variant="outline">View All Customers</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Join Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{"Joined :" + customer.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}