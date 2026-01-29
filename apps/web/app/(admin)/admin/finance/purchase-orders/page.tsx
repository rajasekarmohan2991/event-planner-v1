"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Eye, Loader2, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PurchaseOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/finance/purchase-orders").then(res => res.json()).then(data => {
            setOrders(data.purchaseOrders || []);
            setLoading(false);
        });
    }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Purchase Orders</h1>
                    <p className="text-gray-500">Manage vendor orders</p>
                </div>
                <Button onClick={() => router.push("/admin/finance/purchase-orders/create")} className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Create PO
                </Button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>PO #</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="animate-spin w-6 h-6 mx-auto" /></TableCell></TableRow> :
                            orders.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8">No purchase orders found</TableCell></TableRow> :
                                orders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell>{order.number}</TableCell>
                                        <TableCell>{order.vendorName}</TableCell>
                                        <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                                        <TableCell>{order.currency} {order.grandTotal}</TableCell>
                                        <TableCell><Badge variant="outline">{order.status}</Badge></TableCell>
                                    </TableRow>
                                ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
