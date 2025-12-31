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
import { Loader2, SendHorizonal, Image as ImageIcon } from "lucide-react";
import { getCustomers, getCustomersWithUnreadMessagesCount } from "@/app/actions/customerActions";
import { CustomerWithUnreadMessagesCount } from "@/type";
import { getMessagesForCustomer, getCustomerMessageCount } from "@/app/actions/customerChatActions";
import { sendMessageToCustomer as sendMessageToCustomerAction, markMessageAsRead, sendImageMessageToCustomer } from "@/app/actions/customerChatActions";

const fetchConversation = async (customerId: number) => {
    try {
        const data = await getMessagesForCustomer(customerId);
        return { data };
    } catch (error) {
        return { data: [] };
    }
};

const sendMessageToCustomer = async (customerId: number, message: string, type: "TEXT" | "IMAGE" = "TEXT") => {
    try {
        // The action now expects to handle different types, 'TEXT' or 'IMAGE'
        const res = await sendMessageToCustomerAction(customerId, message, type);
        return { data: res };
    } catch (error) {
        return { error: true };
    }
};

export default function AdminChatPage() {
    const [customers, setCustomers] = useState<CustomerWithUnreadMessagesCount[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [conversation, setConversation] = useState<any[]>([]);
    const [message, setMessage] = useState<string>("");
    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [loadingChat, setLoadingChat] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string>("");

    // for polling message count
    const [messageCount, setMessageCount] = useState<number | null>(null);

    // for file/image
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const imageInputRef = useRef<HTMLInputElement | null>(null);

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
                const csWithUnreadMessagesCount = await getCustomersWithUnreadMessagesCount();
                setCustomers(csWithUnreadMessagesCount);
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
                // mark all messages as read by admin
                data.data.forEach(async (message: any) => {
                    await markMessageAsRead(message.id);
                });
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
        console.log("send start");
        if (selectedImage) {
            // image send logic
            setSending(true);
            if (!selectedCustomerId || !selectedImage) {
                setSending(false);
                return;
            }
            console.log("start sending image");
            try {
                console.log("before send ....");

                const formData = new FormData();
                formData.append('customerId', selectedCustomerId.toString());
                formData.append('file', selectedImage);

                const res = await sendImageMessageToCustomer(formData);


                console.log(res);
                setMessage(""); // clear text
                setSelectedImage(null);
                // Refetch conversation or optimistically add to conversation
                fetchConversation(selectedCustomerId).then((data) => {
                    setConversation(data.data || []);
                });
                // Also refetch message count after send so polling keeps in sync
                getCustomerMessageCount(selectedCustomerId)
                    .then(count => setMessageCount(count))
                    .catch(() => setMessageCount(null));
            } catch (error) {
                // Optionally: handle error (show toast, etc.)
                setSelectedImage(null);
            }
            setSending(false);
            return;
        }


        if (!message.trim() || !selectedCustomerId) return;
        setSending(true);
        const res = await sendMessageToCustomer(selectedCustomerId, message, "TEXT");
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

    // handle image file select & upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        console.log(e.target.files);
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
        }
        // Reset input value to allow selecting the same file again
        if (e.target) {
            e.target.value = "";
        }
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
                                        className={`relative cursor-pointer px-4 py-3 border-b hover:bg-muted flex items-center justify-between ${selectedCustomerId === customer.id
                                            ? "bg-primary/10"
                                            : ""
                                            }`}
                                        onClick={() => setSelectedCustomerId(customer.id)}
                                    >
                                        <div>
                                            <div className="text-sm font-medium">{customer.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {customer.email} {customer.loginId ? `| ${customer.loginId}` : ""}
                                            </div>
                                        </div>
                                        {/* Show unread messages badge if present */}
                                        {customer.unreadMessagesCount > 0 && (
                                            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold min-w-[20px] h-5 px-2">
                                                {customer.unreadMessagesCount}
                                            </span>
                                        )}
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
                                            {msg.type === "IMAGE" && msg.content ? (
                                                <div className="mb-1">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={msg.content}
                                                        alt="sent image"
                                                        className="rounded max-h-44 max-w-full object-contain border mb-1"
                                                        style={{ background: "#fafbfc" }}
                                                        loading="lazy"
                                                    />
                                                </div>
                                            ) : null}
                                            <div>
                                                {msg.type === "IMAGE"
                                                    ? null
                                                    : msg.content}
                                            </div>
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

                        <div className="flex flex-col w-full gap-1 border-1">
                            {selectedImage && (
                                <div
                                    className="flex items-center gap-1 border rounded px-2 py-1 bg-muted"
                                    style={{ maxWidth: 180 }}
                                >
                                    <span className="truncate text-xs">{selectedImage.name}</span>
                                    <button
                                        type="button"
                                        className="ml-1 text-muted-foreground hover:text-destructive"
                                        style={{
                                            border: "none",
                                            background: "transparent",
                                            padding: 0,
                                            cursor: "pointer",
                                            lineHeight: 1,
                                            display: "flex",
                                            alignItems: "center"
                                        }}
                                        tabIndex={-1}
                                        aria-label="Clear selected image"
                                        onClick={() => {
                                            setSelectedImage(null);
                                            // Reset file input to allow selecting the same file again
                                            if (imageInputRef.current) {
                                                imageInputRef.current.value = "";
                                            }
                                        }}
                                    >
                                        <svg height="16" width="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 4l8 8M12 4l-8 8" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            {
                                !selectedImage && (
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
                                )
                            }

                        </div>
                        {/* IMAGE button */}
                        <input
                            type="file"
                            accept="image/*"
                            ref={imageInputRef}
                            onChange={handleImageUpload}
                            style={{ display: "none" }}
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            type="button"
                            className="mr-1"
                            style={{ minWidth: 36, minHeight: 36 }}
                            disabled={sending}
                            onClick={() => imageInputRef.current?.click()}
                            aria-label="Send image"
                            tabIndex={-1}
                        >
                            <ImageIcon className="h-5 w-5" />
                        </Button>
                        <Button
                            onClick={handleSend}
                            disabled={selectedImage !== null ? false : sending || !message.trim()}
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
