"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Download, Home, FileText } from "lucide-react";

export default function SignatureCompletePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [signature, setSignature] = useState<any>(null);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      fetchSignature(id);
    }
  }, [searchParams]);

  async function fetchSignature(id: string) {
    try {
      const res = await fetch(`/api/signatures/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSignature(data.signature);
      }
    } catch (err) {
      console.error('Error fetching signature:', err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Document Signed Successfully!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for signing the document. A confirmation has been recorded.
        </p>

        {signature && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="font-medium">{signature.documentTitle}</span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Signed by:</strong> {signature.signerName}</p>
              <p><strong>Email:</strong> {signature.signerEmail}</p>
              <p><strong>Date:</strong> {new Date(signature.signedAt || signature.completedAt || new Date()).toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {signature?.signedDocumentUrl && (
            <a
              href={signature.signedDocumentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-5 w-5" />
              Download Signed Document
            </a>
          )}
          
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <Home className="h-5 w-5" />
            Return Home
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          A copy of this signed document will be sent to your email address.
        </p>
      </div>
    </div>
  );
}
