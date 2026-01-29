"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Receipt, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function BillsPage() {
    const router = useRouter();
    const [bills, setBills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/finance/bills").then(res => res.json()).then(data => {
            setBills(data.bills || []);
            setLoading(false);
        });
    }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Bills</h1>
                    <p className="text-gray-500">Manage vendor bills</p>
                </div>
                <Button onClick={() => router.push("/admin/finance/bills/create")} className="bg-red-600 hover:bg-red-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Add Bill
                </Button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Bill #</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Vendor Inv #</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? <TableRow><TableCell colSpan={6} className="text-center"><Loader2 className="animate-spin w-6 h-6 mx-auto" /></TableCell></TableRow> :
                            bills.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8">No bills found</TableCell></TableRow> :
                                bills.map(bill => (
                                    <TableRow key={bill.id}>
                                        <TableCell>{bill.number}</TableCell>
                                        <TableCell>{bill.vendorName}</TableCell>
                                        <TableCell>{bill.vendorInvoiceNumber || '-'}</TableCell>
                                        <TableCell>{new Date(bill.dueDate).toLocaleDateString()}</TableCell>
                                        <TableCell>{bill.currency} {bill.totalAmount}</TableCell>
                                        <TableCell><Badge variant="outline">{bill.status}</Badge></TableCell>
                                    </TableRow>
                                ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
