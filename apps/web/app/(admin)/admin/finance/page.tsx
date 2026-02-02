"use client";

import Link from "next/link";
import { FileText, ShoppingCart, Truck, Receipt, Wallet, CreditCard } from "lucide-react";

export default function FinanceDashboard() {
    const modules = [
        {
            title: "Invoices",
            description: "Manage customer invoices and receivables.",
            icon: FileText,
            href: "/admin/invoices",
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            title: "Sales Orders",
            description: "Manage customer orders and bookings.",
            icon: ShoppingCart,
            href: "/admin/finance/sales-orders",
            color: "text-indigo-600",
            bg: "bg-indigo-50"
        },
        {
            title: "Purchase Orders",
            description: "Manage vendor orders and procurement.",
            icon: Truck,
            href: "/admin/finance/purchase-orders",
            color: "text-orange-600",
            bg: "bg-orange-50"
        },
        {
            title: "Bills",
            description: "Manage vendor bills and payables.",
            icon: Receipt,
            href: "/admin/finance/bills",
            color: "text-red-600",
            bg: "bg-red-50"
        },
        {
            title: "Payouts",
            description: "Manage payments to vendors and partners.",
            icon: Wallet,
            href: "/admin/payments",
            color: "text-green-600",
            bg: "bg-green-50"
        },
        {
            title: "Finance Settings",
            description: "Configure tax, currency, and payment terms.",
            icon: CreditCard,
            href: "/admin/finance-settings",
            color: "text-gray-600",
            bg: "bg-gray-50"
        }
    ];

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Finance Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((item) => (
                    <Link
                        key={item.title}
                        href={item.href}
                        className="block p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                    >
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${item.bg}`}>
                            <item.icon className={`w-6 h-6 ${item.color}`} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-gray-500">{item.description}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
