"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";

export default function CreateSalesOrderPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [customerName, setCustomerName] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [items, setItems] = useState([{ description: "", quantity: 1, unitPrice: 0 }]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/finance/sales-orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customerName, date, items, customerEmail, customerPhone, customerAddress })
            });
            if (res.ok) router.push("/admin/finance/sales-orders");
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <BackButton fallbackUrl="/admin/finance/sales-orders" />
            <h1 className="text-3xl font-bold">Create Sales Order</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Customer Name</label>
                        <input type="text" required className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <input type="date" required className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Customer Email</label>
                        <input type="email" className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Customer Phone</label>
                        <input type="tel" className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Customer Address</label>
                        <textarea className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500" rows={2} value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="font-semibold">Items</h3>
                    <div className="hidden md:flex gap-3 text-sm font-medium text-gray-500 mb-2">
                        <div className="flex-1">Description</div>
                        <div className="w-20">Qty</div>
                        <div className="w-32">Rate</div>
                        <div className="w-10"></div>
                    </div>
                    {items.map((item, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row gap-3 p-3 md:p-0 border md:border-none rounded-lg md:rounded-none bg-gray-50 md:bg-transparent mb-4 md:mb-0">
                            <div className="flex-1">
                                <label className="md:hidden text-xs text-gray-500 mb-1 block">Description</label>
                                <input type="text" placeholder="Description" className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500" value={item.description} onChange={e => { const n = [...items]; n[idx].description = e.target.value; setItems(n); }} />
                            </div>
                            <div className="w-full md:w-20">
                                <label className="md:hidden text-xs text-gray-500 mb-1 block">Qty</label>
                                <input type="number" placeholder="Qty" className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500" value={item.quantity} onChange={e => { const n = [...items]; n[idx].quantity = Number(e.target.value); setItems(n); }} />
                            </div>
                            <div className="w-full md:w-32">
                                <label className="md:hidden text-xs text-gray-500 mb-1 block">Rate</label>
                                <input type="number" placeholder="Price" className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-2 focus:ring-indigo-500" value={item.unitPrice} onChange={e => { const n = [...items]; n[idx].unitPrice = Number(e.target.value); setItems(n); }} />
                            </div>
                            <div className="flex items-end justify-end md:w-10">
                                <Button type="button" variant="ghost" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                        </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])}><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={loading} className="bg-indigo-600 text-white">
                        {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />} Create Order
                    </Button>
                </div>
            </form>
        </div>
    );
}
