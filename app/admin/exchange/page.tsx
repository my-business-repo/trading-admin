"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ExternalLink, Loader2 } from "lucide-react"; // Added Loader2 for loading indicator
import { toast, Toaster } from "sonner";
import { Exchange as ExchangeType } from "@/type";
import { exchange_status } from "@prisma/client";
import { changeExchangeStatus, getExchanges } from "@/app/actions/exchangeActions";


interface ConfirmationDialog {
  isOpen: boolean;
  exchangeId: string;
  action: 'APPROVE' | 'REJECT' | null;
}

export default function () {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialog>({
    isOpen: false,
    exchangeId: "",
    action: null,
  });
  const [exchanges, setExchanges] = useState<ExchangeType[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Added loading state

  useEffect(() => {
    const fetchExchanges = async () => {
      setIsLoading(true); // Set loading to true when fetching starts
      const exchanges = await getExchanges();
      console.log("exchanges::", exchanges);
      if (exchanges === null) {
        toast.error("Failed to fetch exchanges");
      } else {
        setExchanges(exchanges as ExchangeType[]);
      }
      setIsLoading(false); // Set loading to false after fetching
    };
    fetchExchanges();
  }, []);

  const handleStatusChange = async (exchangeId: string, newStatus: exchange_status) => {
    try {
      const updatedExchange = await changeExchangeStatus(parseInt(exchangeId), newStatus);
      if (!updatedExchange) {
        toast.error("Failed to update exchange status");
        return;
      }

      setExchanges(exchanges.map(exchange =>
        exchange.id === parseInt(exchangeId)
          ? { ...exchange, exchangeStatus: newStatus }
          : exchange
      ));
      
      console.log("newStatus::", newStatus);
      toast.success(`Exchange ${newStatus} successfully`);
      setConfirmDialog({ isOpen: false, exchangeId: "", action: null });
    } catch (error) {
      toast.error("Failed to update exchange status");
    }
  };

  const openConfirmDialog = (exchangeId: string, action: 'APPROVE' | 'REJECT') => {
    setConfirmDialog({
      isOpen: true,
      exchangeId,
      action,
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      "PENDING": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "APPROVED": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "REJECTED": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return styles[status as keyof typeof styles] || "";
  };

  const getConfirmationMessage = (action: string) => {
    switch (action) {
      case 'complete':
        return "Are you sure you want to complete this exchange? This will process the conversion and update the customer's balances.";
      case 'reject':
        return "Are you sure you want to reject this exchange? The original amount will be returned to the customer's account.";
      default:
        return "";
    }
  };

  const filteredExchanges = exchanges.filter(exchange => {
    const matchesSearch = Object.values(exchange).some(value =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = statusFilter === "all" || exchange.exchangeStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <Toaster richColors position="top-center" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exchange Management</h1>
          <p className="text-muted-foreground">
            Review and manage customer exchange requests
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Exchange Requests</CardTitle>
              <CardDescription>
                View and manage all exchange requests
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search exchanges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? ( // Check if loading
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <div className="flex justify-center items-center h-full w-full">
                        <Loader2 className="h-10 w-10 animate-spin" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExchanges.map((exchange) => (
                    <TableRow key={exchange.id}>
                      <TableCell className="font-medium">
                        {exchange.exchangeType}
                      </TableCell>
                      <TableCell>{exchange.customerName}</TableCell>
                      <TableCell>
                        {exchange.amount} {exchange.fromCurrency}
                      </TableCell>
                      <TableCell>
                        {exchange.exchangedAmount} {exchange.toCurrency}
                      </TableCell>
                      <TableCell>
                        1 {exchange.fromCurrency} = {exchange.exchangeRate} {exchange.toCurrency}
                      </TableCell>
                      <TableCell>{new Date(exchange.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(exchange.exchangeStatus)}>
                          {exchange.exchangeStatus.charAt(0).toUpperCase() + exchange.exchangeStatus.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/exchange/${exchange.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Details
                            </Button>
                          </Link>
                          {exchange.exchangeStatus === "PENDING" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                                onClick={() => openConfirmDialog(exchange.id.toString(), "APPROVE")}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                                onClick={() => openConfirmDialog(exchange.id.toString(), "REJECT")}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={confirmDialog.isOpen}
        onOpenChange={(isOpen) =>
          setConfirmDialog({ isOpen, exchangeId: "", action: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === "APPROVE"
                ? "Complete Exchange"
                : "Reject Exchange"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action && getConfirmationMessage(confirmDialog.action)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog.action && confirmDialog.exchangeId) {
                  handleStatusChange(confirmDialog.exchangeId, confirmDialog.action === "APPROVE" ? "APPROVED" : "REJECTED");
                }
              }}
              className={
                confirmDialog.action === "APPROVE"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {confirmDialog.action === "APPROVE" ? "Complete" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}