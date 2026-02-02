"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function TaxSettingsDebugPage() {
    const { data: session, status } = useSession();
    const [apiResponse, setApiResponse] = useState<any>(null);
    const [templatesResponse, setTemplatesResponse] = useState<any>(null);

    const tenantId = (session?.user as any)?.tenantId || (session?.user as any)?.currentTenantId;

    useEffect(() => {
        if (tenantId) {
            // Test tax structures API
            fetch('/api/company/tax-structures')
                .then(r => r.json())
                .then(data => {
                    console.log('Tax Structures API Response:', data);
                    setApiResponse(data);
                })
                .catch(err => {
                    console.error('Tax Structures API Error:', err);
                    setApiResponse({ error: err.message });
                });

            // Test global templates API
            fetch('/api/company/global-tax-templates')
                .then(r => r.json())
                .then(data => {
                    console.log('Global Templates API Response:', data);
                    setTemplatesResponse(data);
                })
                .catch(err => {
                    console.error('Global Templates API Error:', err);
                    setTemplatesResponse({ error: err.message });
                });
        }
    }, [tenantId]);

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Tax Settings Debug Page</h1>

            <div className="space-y-6">
                {/* Session Info */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Session Information</h2>
                    <div className="space-y-2 font-mono text-sm">
                        <div><strong>Status:</strong> {status}</div>
                        <div><strong>User Email:</strong> {(session?.user as any)?.email || 'N/A'}</div>
                        <div><strong>User ID:</strong> {(session?.user as any)?.id || 'N/A'}</div>
                        <div><strong>TenantId:</strong> {(session?.user as any)?.tenantId || 'N/A'}</div>
                        <div><strong>CurrentTenantId:</strong> {(session?.user as any)?.currentTenantId || 'N/A'}</div>
                        <div><strong>Role:</strong> {(session?.user as any)?.role || 'N/A'}</div>
                    </div>
                    <details className="mt-4">
                        <summary className="cursor-pointer text-blue-600">Full Session Object</summary>
                        <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto text-xs">
                            {JSON.stringify(session, null, 2)}
                        </pre>
                    </details>
                </div>

                {/* Tax Structures API Response */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Tax Structures API Response</h2>
                    {apiResponse ? (
                        <pre className="p-4 bg-gray-100 rounded overflow-auto text-xs">
                            {JSON.stringify(apiResponse, null, 2)}
                        </pre>
                    ) : (
                        <p className="text-gray-500">Loading...</p>
                    )}
                </div>

                {/* Global Templates API Response */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Global Templates API Response</h2>
                    {templatesResponse ? (
                        <pre className="p-4 bg-gray-100 rounded overflow-auto text-xs">
                            {JSON.stringify(templatesResponse, null, 2)}
                        </pre>
                    ) : (
                        <p className="text-gray-500">Loading...</p>
                    )}
                </div>

                {/* Manual Test Buttons */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Manual Tests</h2>
                    <div className="space-x-4">
                        <button
                            onClick={() => {
                                fetch('/api/company/tax-structures')
                                    .then(r => r.json())
                                    .then(console.log);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Test Tax Structures API
                        </button>
                        <button
                            onClick={() => {
                                fetch('/api/company/global-tax-templates')
                                    .then(r => r.json())
                                    .then(console.log);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Test Global Templates API
                        </button>
                        <button
                            onClick={() => {
                                fetch('/api/auth/session')
                                    .then(r => r.json())
                                    .then(console.log);
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                            Test Session API
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
