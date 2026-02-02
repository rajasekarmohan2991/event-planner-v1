"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";

export default function CreatePurchaseOrderPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [vendorName, setVendorName] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState([{ description: "", quantity: 1, unitPrice: 0 }]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await fetch("/api/finance/purchase-orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vendorName, date, items })
            });
            router.push("/admin/finance/purchase-orders");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <BackButton fallbackUrl="/admin/finance/purchase-orders" />
            <h1 className="text-3xl font-bold">Create Purchase Order</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Vendor Name</label><input className="w-full border rounded p-2" value={vendorName} onChange={e => setVendorName(e.target.value)} required /></div>
                    <div><label className="block text-sm font-medium mb-1">Date</label><input type="date" className="w-full border rounded p-2" value={date} onChange={e => setDate(e.target.value)} required /></div>
                </div>

                <div className="space-y-3">
                    <h3 className="font-semibold">Items</h3>
                    {items.map((item, idx) => (
                        <div key={idx} className="flex gap-3">
                            <input className="flex-1 border rounded p-2" placeholder="Description" value={item.description} onChange={e => { const n = [...items]; n[idx].description = e.target.value; setItems(n); }} />
                            <input type="number" className="w-24 border rounded p-2" placeholder="Qty" value={item.quantity} onChange={e => { const n = [...items]; n[idx].quantity = Number(e.target.value); setItems(n); }} />
                            <input type="number" className="w-32 border rounded p-2" placeholder="Price" value={item.unitPrice} onChange={e => { const n = [...items]; n[idx].unitPrice = Number(e.target.value); setItems(n); }} />
                            <Button type="button" variant="ghost" onClick={() => setItems(items.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])}><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white">
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4 mr-2" />} Create PO
                    </Button>
                </div>
            </form>
        </div>
    );
}
