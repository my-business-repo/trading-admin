import Link from "next/link";
import {
    LayoutDashboard,
    Users,
    Settings,
    UserCircle,
    ArrowDownCircle,
    ArrowUpCircle,
    RefreshCw,
} from "lucide-react";
import { usePathname } from "next/navigation";

const navigation = [
    {
        name: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard
    },
    { name: 'Profile', href: '/admin/profile', icon: UserCircle },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Trading History', href: '/admin/trading-history', icon: RefreshCw },
    { name: 'Deposits', href: '/admin/deposits', icon: ArrowDownCircle },
    { name: 'Withdrawals', href: '/admin/withdrawals', icon: ArrowUpCircle },
    { name: 'Exchange', href: '/admin/exchange', icon: RefreshCw },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function LeftMenu() {
    const pathname = usePathname();
    return (
        <div className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r">
            <div className="h-16 flex items-center px-6 border-b">
                <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            </div>
            <nav className="px-4 pt-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md mb-1 text-sm font-medium transition-colors ${isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
        </div>
    )
}
