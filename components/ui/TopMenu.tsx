"use client"

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getNotifications, getNotificationCount, markNotificationAsRead } from "@/app/actions/notificationActions";
import type { Notification as AppNotification } from "@/type";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    LogOut,
    ChevronDown,
    Bell,
    Sun,
    Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Admin } from "@/type";
import { getAdminInfo } from "@/app/actions/adminActions";
import { notification_type } from "@prisma/client";
import { useNavigation } from "react-day-picker";


const notificationTypeToLink: { [key in keyof typeof notification_type]: string } = {
    NEW_CUSTOMER: "/admin/customers",
    NEW_MESSAGE: "/admin/chat",
    SYSTEM_ALERT: "/admin",
    TRANSACTION_UPDATE: "/admin/transactions",
    WITHDRAWAL_REQUEST: "/admin/withdrawals",
    DEPOSIT_REQUEST: "/admin/deposits",
    DEPOSIT_SUCCESS: "/admin/deposits",
    ACCOUNT_VERIFIED: "/admin/customers",
};


export default function TopMenu({ userSession }: { userSession: any }) {
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const [notificationCount, setNotificationCount] = useState(0);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false);
    const [user, setUser] = useState<Admin | null>(null);
    const [granted, setGranted] = useState<boolean>(false);

    // Track previous notification count
    const prevNotiCount = useRef<number>(0);
    const prevNotiIDs = useRef<Set<number>>(new Set());


    // const for noti type and link

    const handleLogout = () => {
        signOut();
        router.push('/login');
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const fetchNotifications = async () => {
        setLoadingNotifications(true);
        try {
            const notis = await getNotifications();
            setNotifications(notis);
            setNotificationCount(
                Array.isArray(notis) ? notis.filter((n: AppNotification) => !n.isReadbyAdmin).length : 0
            );
        } catch (err) {
            setNotifications([]);
            setNotificationCount(0);
        }
        setLoadingNotifications(false);
    };

    // Initial fetch user and notifications
    useEffect(() => {
        if (userSession) {
            getAdminInfo(userSession.id).then((admin: Admin | null) => {
                if (admin) {
                    setUser(admin);
                }
            });
        }
    }, [userSession]);

    useEffect(() => {
        fetchNotifications().then(() => {
            // Set prevNotiCount to initial value after first fetch
            prevNotiCount.current = notificationCount;
            prevNotiIDs.current = new Set(
                notifications.filter(n => !n.isReadbyAdmin).map(n => n.id)
            );
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Poll notification count every 3 seconds
    useEffect(() => {

        if (typeof window !== "undefined" && "Notification" in window) {
            if (window.Notification.permission === "granted") {
                setGranted(true);
            }
        }
        const interval = setInterval(async () => {
            try {
                const count = await getNotificationCount();
                // Only handle if count increased
                if (count > prevNotiCount.current) {
                    // Refetch notifications
                    const notis = await getNotifications();
                    setNotifications(notis);
                    const currentUnreadIds = new Set(
                        notis.filter((n: AppNotification) => !n.isReadbyAdmin).map(n => n.id)
                    );
                    setNotificationCount(currentUnreadIds.size);

                    // Find truly new IDs that weren't in prevNotiIDs
                    const newIds = Array.from(currentUnreadIds).filter(id => !prevNotiIDs.current.has(id));

                    // Show a web notification for the latest new notification (if permission granted)
                    if (
                        typeof window !== "undefined" &&
                        "Notification" in window &&
                        window.Notification.permission === "granted" &&
                        newIds.length > 0
                    ) {
                        // Find the notification object for the last new notification
                        const newNoti = notis.find((n: AppNotification) => n.id === newIds[newIds.length - 1]);
                        if (newNoti) {
                            new Notification(
                                newNoti.title || "Test Notification",
                                {
                                    body: newNoti.message || "This is working!",
                                    icon: "/icon.png"
                                }
                            );
                        }
                    }

                    // Update references for next check
                    prevNotiCount.current = count;
                    prevNotiIDs.current = currentUnreadIds;
                } else if (count !== prevNotiCount.current) {
                    // If count decreased or changed, update counts
                    setNotificationCount(count);
                    prevNotiCount.current = count;
                    // Optionally, update notification IDs set (useful for marking as read)
                    const notis = await getNotifications();
                    setNotifications(notis);
                    prevNotiIDs.current = new Set(
                        notis.filter((n: AppNotification) => !n.isReadbyAdmin).map(n => n.id)
                    );
                }
            } catch (err) {
                console.log("some error fetching noti");
            }
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const requestPermission = async () => {
        if (typeof window === "undefined" || !("Notification" in window)) return;

        const permission = await window.Notification.requestPermission();
        if (permission === "granted") {
            setGranted(true);
            alert("✅ Notifications enabled!");
        } else {
            alert("❌ Notifications blocked. Please allow them in your browser settings.");
        }
    };

    return (
        <>
            {!granted && (
                <div className="fixed top-50 left-0 w-full z-500 flex items-start justify-center pointer-events-none">
                    <div className="mt-8">
                        <button
                            onClick={requestPermission}
                            className="pointer-events-auto px-8 py-3 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold transition transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
                            style={{
                                minWidth: "280px",
                                boxShadow: "0px 8px 32px rgba(34, 78, 244, 0.15)",
                                letterSpacing: "0.01em"
                            }}
                        >
                            Enable Notifications
                        </button>
                    </div>
                </div>
            )}
            <div className="h-16 bg-card border-b px-6 flex items-center justify-between fixed top-0 right-0 left-64 z-50">
                {/* Welcome Message */}
                <div className="text-foreground">
                    <h2 className="text-lg font-medium">Welcome back, {user?.name}!</h2>
                    <p className="text-sm text-muted-foreground">
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="relative"
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </Button>

                    {/* Notifications */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-5 w-5" />
                                {notificationCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                                        {notificationCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="max-h-[300px] overflow-auto">
                                {notifications.length === 0 ? (
                                    <div className="py-6 text-sm text-muted-foreground text-center">
                                        No new notifications.
                                    </div>
                                ) : (
                                    notifications.map((noti) => {
                                        // Get the route for the notification type, fallback to /admin
                                        const link =
                                            notificationTypeToLink[noti.type as keyof typeof notificationTypeToLink] ||
                                            "/admin";
                                        return (
                                            <DropdownMenuItem
                                                key={noti.id}
                                                className={`gap-2 flex-col items-start ${noti.isReadbyAdmin ? "" : "bg-accent"}`}
                                                // Mark notification as read then navigate
                                                onClick={async () => {
                                                    if (!noti.isReadbyAdmin) {
                                                        try {
                                                            await markNotificationAsRead(noti.id);
                                                            await fetchNotifications();
                                                        } catch (err) {
                                                            console.error("Error marking notification as read", err);
                                                        }
                                                    }
                                                    router.push(link);
                                                }}
                                                style={{ cursor: "pointer" }}
                                            >
                                                <div className="flex flex-col gap-1 w-full">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">{noti.title}</span>
                                                        {!noti.isReadbyAdmin && (
                                                            <span className="ml-1 text-[10px] text-primary rounded px-1 py-[2px] bg-primary/10">new</span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground break-words">{noti.message}</span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {(() => {
                                                            // Show time ago
                                                            const diff = Date.now() - new Date(noti.createdAt).getTime();
                                                            const sec = Math.floor(diff / 1000);
                                                            if (sec < 60) return `${sec}s ago`;
                                                            const min = Math.floor(sec / 60);
                                                            if (min < 60) return `${min}m ago`;
                                                            const h = Math.floor(min / 60);
                                                            if (h < 24) return `${h}h ago`;
                                                            const d = Math.floor(h / 24);
                                                            return `${d}d ago`;
                                                        })()}
                                                    </span>
                                                </div>
                                            </DropdownMenuItem>
                                        );
                                    })
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user?.avatar} alt={user?.name} />
                                    <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-medium">{user?.name}</span>
                                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                                </div>
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />
                                Log Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </>
    )
}