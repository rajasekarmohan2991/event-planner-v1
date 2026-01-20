'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Plus, CheckCircle, Clock, XCircle, Eye, RefreshCw, Mail, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SignatureRequest {
    id: string;
    entityType: string;
    entityId: string;
    signerName: string;
    signerEmail: string;
    documentType: string;
    status: string;
    signatureToken: string;
    signedAt: string | null;
    createdAt: string;
}

export default function SignaturesPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [signatures, setSignatures] = useState<SignatureRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSignatures();
    }, []);

    async function fetchSignatures() {
        try {
            const res = await fetch(`/api/events/${params.id}/signatures`);
            const data = await res.json();
            if (res.ok) {
                setSignatures(data.signatures);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load signature requests',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    const copyLink = (token: string) => {
        const link = `${window.location.origin}/sign/${token}`;
        navigator.clipboard.writeText(link);
        toast({
            title: 'Copied',
            description: 'Signature link copied to clipboard',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        <CheckCircle className="w-3.5 h-3.5" /> Signed
                    </span>
                );
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                        <Clock className="w-3.5 h-3.5" /> Pending
                    </span>
                );
            case 'EXPIRED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                        <XCircle className="w-3.5 h-3.5" /> Expired
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Digital Signatures</h1>
                    <p className="text-gray-500 mt-2">Manage contract signatures for vendors, sponsors, and exhibitors</p>
                </div>
                <button
                    onClick={() => router.push(`/events/${params.id}/signatures/new`)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                >
                    <Plus className="w-4 h-4" />
                    Request Signature
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : signatures.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No signature requests yet</h3>
                    <p className="text-gray-500 mb-6">Send your first signature request to get started</p>
                    <button
                        onClick={() => router.push(`/events/${params.id}/signatures/new`)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        Create Request
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-900">Document</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Signer</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Type</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Date/Time</th>
                                <th className="px-6 py-4 font-semibold text-gray-900 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {signatures.map((sig) => (
                                <tr key={sig.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {sig.documentType === 'TERMS' ? 'Terms & Conditions' :
                                            sig.documentType === 'DISCLAIMER' ? 'Liability Disclaimer' :
                                                'Contract Agreement'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{sig.signerName}</div>
                                        <div className="text-gray-500 text-xs">{sig.signerEmail}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${sig.entityType === 'VENDOR' ? 'bg-blue-50 text-blue-700' :
                                            sig.entityType === 'SPONSOR' ? 'bg-purple-50 text-purple-700' :
                                                'bg-orange-50 text-orange-700'
                                            }`}>
                                            {sig.entityType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(sig.status)}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {sig.signedAt
                                            ? new Date(sig.signedAt).toLocaleDateString()
                                            : <span className="text-gray-400">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Send Email Button */}
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const link = `${window.location.origin}/sign/${sig.signatureToken}`;
                                                        const res = await fetch(`/api/events/${params.id}/signatures/${sig.id}/send-email`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ link })
                                                        });

                                                        if (res.ok) {
                                                            toast({
                                                                title: 'Email Sent',
                                                                description: `Signature link sent to ${sig.signerEmail}`,
                                                            });
                                                        } else {
                                                            throw new Error('Failed to send email');
                                                        }
                                                    } catch (error) {
                                                        toast({
                                                            title: 'Error',
                                                            description: 'Failed to send email',
                                                            variant: 'destructive',
                                                        });
                                                    }
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                                title="Send Signature Link via Email"
                                            >
                                                <Mail className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => copyLink(sig.signatureToken)}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                                title="Copy Signature Link"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <a
                                                href={`/sign/${sig.signatureToken}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                                title="View Document"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
