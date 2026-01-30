"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";

export default function SalesOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params?.id) {
            fetch(`/api/finance/sales-orders/${params.id}`)
                .then(res => res.json())
                .then(data => {
                    setOrder(data.error ? null : data);
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [params?.id]);

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
    if (!order) return <div className="p-12 text-center">Order not found</div>;

    const handlePrint = () => {
        window.print();
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this order?")) return;
        try {
            const res = await fetch(`/api/finance/sales-orders/${params.id}`, { method: 'DELETE' });
            if (res.ok) router.push('/admin/finance/sales-orders');
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 print:p-0 print:max-w-none">
            <div className="flex items-center justify-between print:hidden">
                <BackButton fallbackUrl="/admin/finance/sales-orders" />
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push(`/admin/finance/sales-orders/${order.id}/edit`)}>
                        Edit
                    </Button>
                    <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={handleDelete}>
                        Delete
                    </Button>
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </Button>
                    <Button onClick={handlePrint}>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                    </Button>
                </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm border print:shadow-none print:border-none" id="invoice-content">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        {order.tenant?.logo && (
                            <img src={order.tenant.logo} alt="Company Logo" className="h-16 w-auto mb-4 object-contain" />
                        )}
                        <h1 className="text-2xl font-bold text-gray-900">{order.tenant?.name}</h1>
                        <div className="text-sm text-gray-500 mt-2 space-y-1">
                            <p>Event Management Platform</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-bold text-indigo-600 mb-2">SALES ORDER</h2>
                        <p className="text-gray-600 font-medium">#{order.number}</p>
                        <p className="text-gray-500 text-sm mt-1">Date: {new Date(order.date).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Addresses */}
                <div className="grid grid-cols-2 gap-12 mb-8 border-t border-b py-6">
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Bill To</h3>
                        <p className="font-bold text-gray-900">{order.customerName}</p>
                        {order.customerEmail && <p className="text-sm text-gray-600">{order.customerEmail}</p>}
                        {order.customerPhone && <p className="text-sm text-gray-600">{order.customerPhone}</p>}
                        {order.customerAddress && <p className="text-sm text-gray-600 whitespace-pre-line mt-1">{order.customerAddress}</p>}
                    </div>
                    <div className="text-right">
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-8">
                    <thead>
                        <tr className="border-b-2 border-gray-100">
                            <th className="text-left py-3 font-semibold text-gray-600">Description</th>
                            <th className="text-right py-3 font-semibold text-gray-600">Rate</th>
                            <th className="text-right py-3 font-semibold text-gray-600">Qty</th>
                            <th className="text-right py-3 font-semibold text-gray-600">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {order.items.map((item: any) => (
                            <tr key={item.id} className="border-b border-gray-50">
                                <td className="py-4">{item.description}</td>
                                <td className="text-right py-4">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(item.unitPrice)}
                                </td>
                                <td className="text-right py-4">{item.quantity}</td>
                                <td className="text-right py-4 font-medium">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(item.total)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-64 space-y-3">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(order.subtotal)}</span>
                        </div>
                        {order.taxTotal > 0 && (
                            <div className="flex justify-between text-gray-600">
                                <span>Tax</span>
                                <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(order.taxTotal)}</span>
                            </div>
                        )}
                        {order.discountTotal > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount</span>
                                <span>-{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(order.discountTotal)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-3">
                            <span>Total</span>
                            <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(order.grandTotal)}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {(order.notes || order.terms) && (
                    <div className="mt-8 pt-8 border-t border-gray-100 text-sm text-gray-500">
                        {order.notes && (
                            <div className="mb-4">
                                <h4 className="font-semibold text-gray-700 mb-1">Notes:</h4>
                                <p>{order.notes}</p>
                            </div>
                        )}
                        {order.terms && (
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-1">Terms & Conditions:</h4>
                                <p>{order.terms}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
