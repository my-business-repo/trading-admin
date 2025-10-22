"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, SendHorizonal } from "lucide-react";
import { getCustomers } from "@/app/actions/customerActions";
import { Customer } from "@/type";
import { getMessagesForCustomer, getCustomerMessageCount } from "@/app/actions/customerChatActions";
import { sendMessageToCustomer as sendMessageToCustomerAction } from "@/app/actions/customerChatActions";

const fetchConversation = async (customerId: number) => {
    try {
        const data = await getMessagesForCustomer(customerId);
        return { data };
    } catch (error) {
        return { data: [] };
    }
};

const sendMessageToCustomer = async (customerId: number, message: string) => {
    try {
        const res = await sendMessageToCustomerAction(customerId, message);
        return { data: res };
    } catch (error) {
        return { error: true };
    }
};

export default function AdminChatPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [conversation, setConversation] = useState<any[]>([]);
    const [message, setMessage] = useState<string>("");
    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [loadingChat, setLoadingChat] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string>("");

    // for polling message count
    const [messageCount, setMessageCount] = useState<number | null>(null);

    // --- For auto scroll to bottom ---
    const conversationEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (conversationEndRef.current) {
            conversationEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [conversation, loadingChat, selectedCustomerId]);

    // Fetch customer list
    useEffect(() => {
        const fetchCustomersData = async () => {
            setLoadingCustomers(true);
            try {
                const cs = await getCustomers();
                setCustomers(cs);
            } catch (e) {
                setCustomers([]);
            }
            setLoadingCustomers(false);
        };
        fetchCustomersData();
    }, []);

    // Fetch conversation when customer changes
    useEffect(() => {
        if (selectedCustomerId) {
            setLoadingChat(true);
            fetchConversation(selectedCustomerId).then((data) => {
                setConversation(data.data || []);
                setLoadingChat(false);
            });
            // also get current message count
            getCustomerMessageCount(selectedCustomerId)
                .then(count => setMessageCount(count))
                .catch(() => setMessageCount(null));
        } else {
            setConversation([]);
            setMessageCount(null);
        }
    }, [selectedCustomerId]);

    // Poll for new messages every 3 seconds if customer is selected
    useEffect(() => {
        if (!selectedCustomerId) return;

        let isMounted = true;
        let intervalId: NodeJS.Timeout;

        const pollMessages = async () => {
            try {
                const count = await getCustomerMessageCount(selectedCustomerId);
                if (isMounted) {
                    // If message count changed, refetch the conversation
                    if (messageCount === null) {
                        setMessageCount(count);
                    } else if (count !== messageCount) {
                        setMessageCount(count);
                        // Refetch conversation
                        fetchConversation(selectedCustomerId).then((data) => {
                            setConversation(data.data || []);
                        });
                    }
                }
            } catch (e) {
                if (isMounted) setMessageCount(null);
            }
        };

        intervalId = setInterval(pollMessages, 3000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCustomerId, messageCount]); // re-run on change

    const handleSend = async () => {
        if (!message.trim() || !selectedCustomerId) return;
        setSending(true);
        const res = await sendMessageToCustomer(selectedCustomerId, message);
        if (!res.error) {
            setMessage("");
            // Refetch conversation or optimistically add to conversation
            fetchConversation(selectedCustomerId).then((data) => {
                setConversation(data.data || []);
            });
            // Also refetch message count after send so polling keeps in sync
            getCustomerMessageCount(selectedCustomerId)
                .then(count => setMessageCount(count))
                .catch(() => setMessageCount(null));
        }
        setSending(false);
    };

    return (
        <div className="flex w-full h-full gap-2 min-h-[84vh]">
            <Card className="w-80 min-w-[280px] max-h-[79vh] flex flex-col">
                <CardHeader>
                    <CardTitle className="mb-2">Customers</CardTitle>
                    <div className="mt-2">
                        <Input
                            type="text"
                            placeholder="Search by name or login ID"
                            value={typeof window !== "undefined" && (window as any)._adminChatSearch || ""}
                            onChange={(e) => {
                                if (typeof window !== "undefined") {
                                    (window as any)._adminChatSearch = e.target.value;
                                }
                                setSearchTerm(e.target.value);
                            }}
                            className="w-full"
                        />
                    </div>
                </CardHeader>
                <CardContent className="overflow-y-auto flex-1 p-0">
                    {loadingCustomers ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="text-center py-8">No customers found.</div>
                    ) : (
                        <ul>
                            {customers
                                .filter(
                                    (customer) =>
                                        customer.name?.toLowerCase().includes((searchTerm || "").toLowerCase()) ||
                                        customer.loginId?.toLowerCase().includes((searchTerm || "").toLowerCase())
                                )
                                .map((customer) => (
                                    <li
                                        key={customer.id}
                                        className={`cursor-pointer px-4 py-3 border-b hover:bg-muted ${selectedCustomerId === customer.id
                                            ? "bg-primary/10"
                                            : ""
                                            }`}
                                        onClick={() => setSelectedCustomerId(customer.id)}
                                    >
                                        <div className="text-sm font-medium">{customer.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {customer.email} {customer.loginId ? `| ${customer.loginId}` : ""}
                                        </div>
                                    </li>
                                ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <Card className="flex-1 flex flex-col max-h-[79vh]">
                <CardHeader>
                    <CardTitle>
                        {selectedCustomerId
                            ? customers.find((c) => c.id === selectedCustomerId)?.name ||
                            "Customer"
                            : "Select a customer"}
                    </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto px-2">
                    {selectedCustomerId ? (
                        loadingChat ? (
                            <div className="flex justify-center items-center py-4">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : conversation.length === 0 ? (
                            <div className="text-muted-foreground py-4 text-center">
                                No messages yet.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {conversation.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.from === "admin"
                                            ? "justify-end"
                                            : "justify-start"
                                            }`}
                                    >
                                        <div
                                            className={`rounded px-3 py-2 max-w-xs text-sm ${msg.from === "admin"
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted"
                                                }`}
                                        >
                                            <div>{msg.content}</div>
                                            <div className="text-[10px] text-muted-foreground mt-1 text-right">
                                                {msg.createdAt
                                                    ? new Date(msg.createdAt).toLocaleTimeString()
                                                    : ""}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {/* ===== auto scroll anchor element ===== */}
                                <div ref={conversationEndRef}></div>
                            </div>
                        )
                    ) : (
                        <div className="py-10 text-center text-muted-foreground">
                            Select a customer to start chatting.
                        </div>
                    )}
                </CardContent>

                {selectedCustomerId && (
                    <div className="border-t p-3 flex gap-2 items-center">
                        <Input
                            type="text"
                            placeholder="Type your message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !sending) {
                                    handleSend();
                                }
                            }}
                            disabled={sending}
                            className="flex-1"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={sending || !message.trim()}
                            type="button"
                            size="icon"
                            aria-label="Send message"
                        >
                            {sending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <SendHorizonal className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}
