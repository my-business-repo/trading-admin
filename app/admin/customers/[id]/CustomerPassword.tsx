"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast, Toaster } from "sonner";
import { Customer } from "@/type";
import { changeCustomerPasswordByAdmin } from "@/app/actions/customerActions";

// Modal component with dark/light theme support using Tailwind CSS
function Modal({
    open,
    onClose,
    title,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) {
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60"
            onClick={onClose}
        >
            <div
                className="
                    bg-white
                    dark:bg-neutral-900
                    dark:border
                    dark:border-neutral-700
                    rounded-lg
                    shadow-lg
                    p-6
                    min-w-[320px]
                    relative
                    transition-colors
                    duration-200
                "
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white absolute top-3 right-3"
                    onClick={onClose}
                    aria-label="Close"
                    type="button"
                >
                    ✕
                </button>
                <h2 className="text-xl mb-4 font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
                {children}
            </div>
        </div>
    );
}

export default function CustomerPassword({ customer }: { customer: Customer }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [changeType, setChangeType] = useState<"login" | "withdraw">("login");
    const [newPass, setNewPass] = useState("");
    const [newPass2, setNewPass2] = useState("");
    const [loading, setLoading] = useState(false);

    const openPasswordModal = () => {
        setNewPass("");
        setNewPass2("");
        setModalOpen(true);
    };

    const closePasswordModal = () => {
        setModalOpen(false);
        setNewPass("");
        setNewPass2("");
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPass !== newPass2) {
            toast.error("New passwords do not match.");
            return;
        }
        setLoading(true);
        console.log("chage type::", changeType)
        const result = await changeCustomerPasswordByAdmin(
            customer.id,
            changeType,
            newPass
        );
        if (result.success) {
            toast.success(result.message);
            closePasswordModal();
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    };

    return (
        <div>
            <Toaster position="top-center" richColors />
            <div className="flex flex-col md:flex-row gap-8 mt-5 w-full">
                <Card className="w-full max-w-md flex-1">
                    <CardHeader>
                        <CardTitle>Login Password</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-5">
                            <label className="block text-sm mb-1">Customer's Login Password</label>
                            <Input
                                required
                                type="password"
                                value={"*********************************"}
                                autoFocus
                                minLength={6}
                                placeholder="Enter new password"
                            />
                        </div>
                        <Button
                            onClick={() => {
                                setChangeType("login");
                                openPasswordModal();
                            }}
                            className="w-full"
                            variant="outline"
                        >
                            Change Login Password
                        </Button>
                    </CardContent>
                </Card>

                <Card className="w-full max-w-md flex-1">
                    <CardHeader>
                        <CardTitle>Withdraw Password</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-5">
                            <label className="block text-sm mb-1">Customer's Withdraw Password</label>
                            <Input
                                required
                                type="password"
                                value={"*********************************"}
                                minLength={4}
                                placeholder="Enter new withdraw password"
                                readOnly
                            />
                        </div>
                        <Button
                            onClick={() => {
                                setChangeType("withdraw");
                                openPasswordModal();
                            }}
                            className="w-full"
                            variant="outline"
                        >
                            Change Withdraw Password
                        </Button>
                    </CardContent>
                </Card>
            </div>
            {/* Modal for password change */}
            <Modal
                open={modalOpen}
                onClose={loading ? () => { } : closePasswordModal}
                title={`Change ${changeType} password`}
            >
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1 text-gray-900 dark:text-gray-100">New Password</label>
                        <Input
                            required
                            type="password"
                            value={newPass}
                            autoFocus
                            minLength={6}
                            onChange={(e) => setNewPass(e.target.value)}
                            placeholder="Enter new password"
                            className="dark:bg-neutral-800 dark:text-gray-100"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-gray-900 dark:text-gray-100">Confirm New Password</label>
                        <Input
                            required
                            type="password"
                            value={newPass2}
                            minLength={6}
                            onChange={(e) => setNewPass2(e.target.value)}
                            placeholder="Confirm new password"
                            className="dark:bg-neutral-800 dark:text-gray-100"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? "Changing..." : "Change"}
                    </Button>
                </form>
            </Modal>
        </div>
    );
}