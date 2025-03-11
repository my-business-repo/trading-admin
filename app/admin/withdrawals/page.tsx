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
import { Search, Filter, Copy, ExternalLink, Loader2 } from "lucide-react"; // Added Loader2 for loading indicator
import { toast, Toaster } from "sonner";
import { Withdrawal } from "@/type";
import { transaction_status } from "@prisma/client";
import { getAllWithdrawals, markWithdrawalAsSent, updateWithdrawalStatus } from "@/app/actions/transactionsActions";


interface ConfirmationDialog {
  isOpen: boolean;
  withdrawalId: string;
  action: 'approve' | 'reject' | 'complete' | 'markAsSent' | null;
}

export default function Withdrawals() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialog>({
    isOpen: false,
    withdrawalId: "",
    action: null,
  });
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Added loading state

  useEffect(() => {
    const fetchDeposits = async () => {
      setIsLoading(true); // Set loading to true when fetching starts
      const withdrawals = await getAllWithdrawals();
      setWithdrawals(withdrawals as unknown as Withdrawal[]);
      setIsLoading(false); // Set loading to false after fetching
    };
    fetchDeposits();
  }, []);

  const handleStatusChange = async (withdrawalId: number, newStatus: transaction_status | "markAsSent") => {
    console.log(withdrawalId, newStatus)
    if (newStatus === "markAsSent") {
      const response = await markWithdrawalAsSent(withdrawalId.toString());
      if (response.message === "success") {
        toast.success("Withdrawal marked as sent successfully");
        setConfirmDialog({ isOpen: false, withdrawalId: "", action: null });
      } else {
        toast.error("Failed to update withdrawal status");
      }
      return;
    }
    try {
      const response = await updateWithdrawalStatus(withdrawalId.toString(), newStatus);
      if (response.message === "success") {
        setWithdrawals(withdrawals.map(withdrawal =>
          withdrawal.id === withdrawalId
            ? { ...withdrawal, status: newStatus }
            : withdrawal
        ));
        toast.success(`Withdrawal ${newStatus} successfully`);
        setConfirmDialog({ isOpen: false, withdrawalId: "", action: null });
      } else {
        toast.error("Failed to update withdrawal status");
      }
    } catch (error) {
      toast.error("Failed to update withdrawal status");
    }
  };

  const openConfirmDialog = (withdrawalId: string, action: 'approve' | 'reject' | 'complete' | 'markAsSent') => {
    setConfirmDialog({
      isOpen: true,
      withdrawalId,
      action,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Wallet address copied to clipboard");
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 5)}...${address.slice(-5)}`;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      "PENDING": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "COMPLETED": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "FAILED": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return styles[status as keyof typeof styles] || "";
  };

  const getConfirmationMessage = (action: string) => {
    switch (action) {
      case 'approve':
        return "Are you sure you want to approve this withdrawal? This will allow the withdrawal to proceed.";
      case 'reject':
        return "Are you sure you want to reject this withdrawal? The funds will be returned to the customer's account.";
      case 'markAsSent':
        return "Are you sure you want to mark this withdrawal as sent? This confirms that the funds have been sent.";
      default:
        return "";
    }
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = Object.values(withdrawal).some(value =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = statusFilter === "all" || withdrawal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });


  return (
    <div className="space-y-6">
      <Toaster position="top-center" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Withdrawal Management</h1>
          <p className="text-muted-foreground">
            Review and manage customer withdrawal requests
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Withdrawals</CardTitle>
              <CardDescription>
                View and manage all withdrawal requests
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search withdrawals..."
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? ( // Show loading indicator while fetching
            <div className="flex justify-center items-center">
              <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWithdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell className="font-medium">{withdrawal.transactionId}</TableCell>
                      <TableCell>{withdrawal.type}</TableCell>
                      <TableCell>{withdrawal.amount} {withdrawal.currency}</TableCell>
                      <TableCell className="flex items-center">
                        <span>{formatAddress(withdrawal.address)}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2"
                          onClick={() => copyToClipboard(withdrawal.address)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>{withdrawal.sent ? "Yes" : "No"}</TableCell>
                      <TableCell>{withdrawal.currency}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(withdrawal.status)}>
                          {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{withdrawal.accountNumber}</TableCell>
                      <TableCell>{new Date(withdrawal.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{withdrawal.customerName}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/withdrawals/${withdrawal.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Details
                            </Button>
                          </Link>
                          {withdrawal.status === transaction_status.PENDING && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                                onClick={() => openConfirmDialog(withdrawal.id.toString(), "approve")}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                                onClick={() => openConfirmDialog(withdrawal.id.toString(), "reject")}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {withdrawal.status === transaction_status.COMPLETED && !withdrawal.sent && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                              onClick={() => openConfirmDialog(withdrawal.id.toString(), "markAsSent")}
                            >
                              Mark as Sent
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={confirmDialog.isOpen}
        onOpenChange={(isOpen) =>
          setConfirmDialog({ isOpen, withdrawalId: "", action: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === "approve"
                ? "Approve Withdrawal"
                : confirmDialog.action === "complete"
                  ? "Complete Withdrawal"
                  : confirmDialog.action === "markAsSent"
                    ? "Mark as Sent"
                    : "Reject Withdrawal"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action && getConfirmationMessage(confirmDialog.action)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog.action && confirmDialog.withdrawalId) {
                  handleStatusChange(parseInt(confirmDialog.withdrawalId), confirmDialog.action === "approve" ? transaction_status.COMPLETED : confirmDialog.action === "complete" ? transaction_status.COMPLETED : confirmDialog.action === "markAsSent" ? "markAsSent" : transaction_status.FAILED);
                }
              }}
              className={
                confirmDialog.action === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : confirmDialog.action === "complete"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : confirmDialog.action === "markAsSent"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
              }
            >
              {confirmDialog.action === "approve"
                ? "Approve"
                : confirmDialog.action === "complete"
                  ? "Complete"
                  : confirmDialog.action === "markAsSent"
                    ? "Mark as Sent"
                    : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}