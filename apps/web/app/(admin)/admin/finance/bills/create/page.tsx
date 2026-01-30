"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";

export default function CreateBillPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [vendorName, setVendorName] = useState("");
    const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState([{ description: "", quantity: 1, unitPrice: 0 }]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await fetch("/api/finance/bills", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vendorName, vendorInvoiceNumber, date, dueDate, items })
            });
            router.push("/admin/finance/bills");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <BackButton fallbackUrl="/admin/finance/bills" />
            <h1 className="text-3xl font-bold">Add Bill</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Vendor Name</label><input className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-red-500" value={vendorName} onChange={e => setVendorName(e.target.value)} required /></div>
                    <div><label className="block text-sm font-medium mb-1">Vendor Invoice #</label><input className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-red-500" value={vendorInvoiceNumber} onChange={e => setVendorInvoiceNumber(e.target.value)} /></div>
                    <div><label className="block text-sm font-medium mb-1">Bill Date</label><input type="date" className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-red-500" value={date} onChange={e => setDate(e.target.value)} required /></div>
                    <div><label className="block text-sm font-medium mb-1">Due Date</label><input type="date" className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-red-500" value={dueDate} onChange={e => setDueDate(e.target.value)} required /></div>
                </div>

                <div className="space-y-3">
                    <h3 className="font-semibold">Items</h3>
                    <div className="hidden md:flex gap-3 text-sm font-medium text-gray-500 mb-2">
                        <div className="flex-1">Description</div>
                        <div className="w-24">Qty</div>
                        <div className="w-32">Rate</div>
                        <div className="w-10"></div>
                    </div>
                    {items.map((item, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row gap-3 p-3 md:p-0 border md:border-none rounded-lg md:rounded-none bg-gray-50 md:bg-transparent mb-4 md:mb-0">
                            <div className="flex-1">
                                <label className="md:hidden text-xs text-gray-500 mb-1 block">Description</label>
                                <input className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-red-500" placeholder="Description" value={item.description} onChange={e => { const n = [...items]; n[idx].description = e.target.value; setItems(n); }} />
                            </div>
                            <div className="md:w-24">
                                <label className="md:hidden text-xs text-gray-500 mb-1 block">Qty</label>
                                <input type="number" className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-red-500" placeholder="Qty" value={item.quantity} onChange={e => { const n = [...items]; n[idx].quantity = Number(e.target.value); setItems(n); }} />
                            </div>
                            <div className="md:w-32">
                                <label className="md:hidden text-xs text-gray-500 mb-1 block">Rate</label>
                                <input type="number" className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-red-500" placeholder="Price" value={item.unitPrice} onChange={e => { const n = [...items]; n[idx].unitPrice = Number(e.target.value); setItems(n); }} />
                            </div>
                            <div className="flex items-end justify-end md:w-10">
                                <Button type="button" variant="ghost" onClick={() => setItems(items.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                            </div>
                        </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])}><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4 mr-2" />} Save Bill
                    </Button>
                </div>
            </form>
        </div>
    );
}
