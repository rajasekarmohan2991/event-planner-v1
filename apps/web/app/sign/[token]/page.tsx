'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { CheckCircle, FileText, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface SignatureRequest {
    id: string;
    signerName: string;
    signerEmail: string;
    documentContent: string;
    documentType: string;
    entityType: string;
    status: string;
    tokenExpiresAt: string;
    signedAt?: string;
    eventName: string;
    eventId: string;
}

export default function SignDocumentPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [signature, setSignature] = useState<SignatureRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [signing, setSigning] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState('');

    const token = params.token as string;

    useEffect(() => {
        fetchSignatureRequest();
    }, [token]);

    async function fetchSignatureRequest() {
        try {
            setLoading(true);
            const res = await fetch(`/api/signatures/${token}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to load signature request');
                return;
            }

            setSignature(data.signature);
        } catch (err: any) {
            setError(err.message || 'Failed to load signature request');
        } finally {
            setLoading(false);
        }
    }

    async function handleSign() {
        if (!agreed) {
            setError('You must agree to the terms before signing');
            return;
        }

        if (!session) {
            // Redirect to login with callback
            signIn(undefined, { callbackUrl: `/sign/${token}` });
            return;
        }

        // Check email match
        if (session.user?.email?.toLowerCase() !== signature?.signerEmail.toLowerCase()) {
            setError(`You must login with the invited email: ${signature?.signerEmail}`);
            return;
        }

        try {
            setSigning(true);
            setError('');

            const res = await fetch(`/api/signatures/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agreed: true })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || data.message || 'Failed to sign document');
                return;
            }

            // Success - refresh data
            await fetchSignatureRequest();
        } catch (err: any) {
            setError(err.message || 'Failed to sign document');
        } finally {
            setSigning(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading document...</p>
                </div>
            </div>
        );
    }

    if (error && !signature) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Go to Homepage
                    </button>
                </div>
            </div>
        );
    }

    if (!signature) {
        return null;
    }

    // Already signed
    if (signature.status === 'COMPLETED') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full text-center">
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Signed!</h1>
                    <p className="text-gray-600 mb-6">
                        This document was signed on {new Date(signature.signedAt!).toLocaleDateString()}
                    </p>
                    <div className="bg-gray-50 rounded-lg p-6 text-left">
                        <h2 className="font-semibold text-gray-900 mb-2">Document Details</h2>
                        <div className="space-y-2 text-sm text-gray-600">
                            <p><strong>Event:</strong> {signature.eventName}</p>
                            <p><strong>Type:</strong> {signature.entityType} - {signature.documentType}</p>
                            <p><strong>Signer:</strong> {signature.signerName}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Expired
    if (signature.status === 'EXPIRED') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h1>
                    <p className="text-gray-600 mb-6">
                        This signature link expired on {new Date(signature.tokenExpiresAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                        Please contact the event organizer for a new signature link.
                    </p>
                </div>
            </div>
        );
    }

    // Pending - show document
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <FileText className="w-12 h-12 text-indigo-600" />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Sign Document</h1>
                            <p className="text-gray-600">{signature.eventName}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="text-sm text-gray-500">Document Type</p>
                            <p className="font-semibold text-gray-900">{signature.entityType} - {signature.documentType}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Signer</p>
                            <p className="font-semibold text-gray-900">{signature.signerName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-semibold text-gray-900">{signature.signerEmail}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Expires</p>
                            <p className="font-semibold text-gray-900">
                                {new Date(signature.tokenExpiresAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Document Content */}
                <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
                    <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: signature.documentContent }}
                    />
                </div>

                {/* Sign Section */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {!session && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-blue-800 text-sm">
                                You must be logged in to sign this document. Please login with <strong>{signature.signerEmail}</strong>
                            </p>
                        </div>
                    )}

                    <div className="flex items-start gap-3 mb-6">
                        <input
                            type="checkbox"
                            id="agree"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="agree" className="text-gray-700 cursor-pointer">
                            I have read and agree to the terms and conditions stated above
                        </label>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleSign}
                            disabled={!agreed || signing}
                            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
                        >
                            {signing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Sign Document
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => window.print()}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                        >
                            Print
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
