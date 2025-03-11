"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { getTransactionById, updateDepositStatus } from "@/app/actions/transactionsActions";
import { TransactionDetails } from "@/type";
import { notFound } from "next/navigation"; // Import notFound from next/navigation
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { trade_tradingStatus, transaction_status } from "@prisma/client";

export default function DepositDetail() {
  const params = useParams();
  const id = params.id as string;
  const [deposit, setDeposit] = useState<TransactionDetails | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; action: 'approve' | 'reject' | null }>({ isOpen: false, action: null });

  useEffect(() => {
    const fetchDeposit = async () => {
      const deposit = await getTransactionById(id);
      if (!deposit) {
        notFound(); // Redirect to 404 if deposit is null
      }
      setDeposit(deposit);
    };
    fetchDeposit();
  }, [id]);

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return styles[status as keyof typeof styles] || "";
  };

  const handleStatusChange = async (newStatus: transaction_status) => {
    try {
      const response = await updateDepositStatus(id, newStatus);
      if (response.message) {
        toast.success(`Deposit ${newStatus === 'COMPLETED' ? 'approved' : 'rejected'} successfully`);
        setDeposit(prev => prev ? { ...prev, status: newStatus } : null);
      } else {
        toast.error("Failed to update deposit status");
      }
    } catch (error) {
      toast.error("Failed to update deposit status");
    }
  };

  const openConfirmDialog = (action: 'approve' | 'reject') => {
    setConfirmDialog({ isOpen: true, action });
  };

  const amount = deposit?.amount ?? 0; // Default to 0 if undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/deposits">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Deposit Details</h1>
            <p className="text-muted-foreground">
              Transaction ID: {deposit?.transactionId || "N/A"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" disabled={deposit?.status === trade_tradingStatus.COMPLETED}>
          {deposit?.status === trade_tradingStatus.COMPLETED ? 'Already Approved' : 'Approve'}
        </Button>
        <Button variant="outline" 
                onClick={() => openConfirmDialog('reject')} 
                className="bg-red-500 text-white" 
                disabled={deposit?.status === trade_tradingStatus.FAILED}>
          {deposit?.status === trade_tradingStatus.FAILED ? 'Already Rejected' : 'Reject'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Customer Name</p>
              <p className="text-lg">{deposit?.customerName || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Customer ID</p>
              <p className="text-lg">{deposit?.customerId || "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deposit Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Amount</p>
              <p className="text-lg">${deposit?.amount?.toFixed(2) || "0.00"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge className={getStatusBadge(deposit?.status || "pending")}>
                {deposit?.status ? deposit?.status?.charAt(0).toUpperCase() + deposit?.status?.slice(1) : "Pending"}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <p className="text-lg">{deposit?.createdAt ? new Date(deposit?.createdAt).toLocaleDateString() : "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Account Number</p>
                <p className="text-lg">{deposit?.accountNumber?.toString() || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Account ID</p>
                <p className="text-lg">{deposit?.accountId}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Payment Proof</p>
              {deposit?.transactionfile.map(file => (
                <img
                  key={file.id}
                  src={file.fileurl}
                  alt={file.filename}
                  className="rounded-lg max-w-md"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(isOpen) => setConfirmDialog({ isOpen, action: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === "approve" ? "Approve Deposit" : "Reject Deposit"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === "approve"
                ? "Are you sure you want to approve this deposit? This action cannot be undone."
                : "Are you sure you want to reject this deposit? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog.action) {
                  handleStatusChange(confirmDialog.action === "approve" ? "COMPLETED" : "FAILED");
                }
              }}
              className={confirmDialog.action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {confirmDialog.action === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}