"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  FileText, 
  Check, 
  X, 
  Pen, 
  RefreshCw,
  Download,
  AlertCircle
} from "lucide-react";

interface SignatureRequest {
  id: string;
  documentType: string;
  documentTitle: string;
  documentContent?: string;
  signerEmail: string;
  signerName: string;
  signerType: string;
  status: string;
  expiresAt: string;
  customFields?: Record<string, any>;
}

export default function SignDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [signature, setSignature] = useState<SignatureRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (params?.id) {
      fetchSignature();
    }
  }, [params?.id]);

  useEffect(() => {
    // Initialize canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [signature]);

  async function fetchSignature() {
    try {
      const res = await fetch(`/api/signatures/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setSignature(data.signature);
        
        // Check if already signed
        if (data.signature.status === 'COMPLETED' || data.signature.status === 'SIGNED') {
          setError('This document has already been signed.');
        } else if (data.signature.status === 'VOIDED') {
          setError('This signature request has been cancelled.');
        } else if (new Date(data.signature.expiresAt) < new Date()) {
          setError('This signature request has expired.');
        }
      } else {
        setError('Signature request not found.');
      }
    } catch (err) {
      setError('Failed to load signature request.');
    } finally {
      setLoading(false);
    }
  }

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }

  async function submitSignature() {
    if (!signature || !hasSignature || !agreed) return;

    setSigning(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not found');

      // Get signature image as data URL
      const signatureImageUrl = canvas.toDataURL('image/png');

      // Update signature request
      const res = await fetch(`/api/signatures/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          signatureImageUrl,
          signerIp: 'client', // Would be set server-side in production
          userAgent: navigator.userAgent
        })
      });

      if (res.ok) {
        router.push(`/signature/complete?id=${params.id}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit signature');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit signature');
    } finally {
      setSigning(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Sign</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!signature) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{signature.documentTitle}</h1>
              <p className="text-gray-600">Please review and sign this document</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Signer:</span>
              <p className="font-medium">{signature.signerName}</p>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>
              <p className="font-medium">{signature.signerEmail}</p>
            </div>
          </div>
        </div>

        {/* Document Preview */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Document Content</h2>
          <div className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto">
            <div className="prose prose-sm">
              {/* Prefer tenant/template HTML content if available */}
              {signature.documentContent ? (
                <div dangerouslySetInnerHTML={{ __html: signature.documentContent }} />
              ) : (
                <>
              {signature.documentType === 'TERMS_AND_CONDITIONS' && (
                <div>
                  <h3>Terms and Conditions</h3>
                  <p>By signing this agreement, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.</p>
                  <h4>1. Acceptance of Terms</h4>
                  <p>Participation in the event is subject to compliance with all applicable rules, regulations, and guidelines.</p>
                  <h4>2. Liability</h4>
                  <p>The organizers shall not be liable for any loss, damage, or injury arising from participation.</p>
                  <h4>3. Data Protection</h4>
                  <p>Personal data collected will be processed in accordance with applicable data protection laws.</p>
                </div>
              )}
              {signature.documentType === 'DISCLAIMER' && (
                <div>
                  <h3>Disclaimer and Waiver</h3>
                  <p>I understand and acknowledge that participation involves certain risks.</p>
                  <h4>Assumption of Risk</h4>
                  <p>I voluntarily assume all risks associated with participation.</p>
                  <h4>Release of Liability</h4>
                  <p>I hereby release the organizers from any and all liability.</p>
                </div>
              )}
              {signature.documentType === 'EXHIBITOR_AGREEMENT' && (
                <div>
                  <h3>Exhibitor Agreement</h3>
                  <p>This agreement outlines the terms for exhibitor participation.</p>
                  <h4>1. Booth Assignment</h4>
                  <p>Booth assignments are final and non-transferable.</p>
                  <h4>2. Setup and Breakdown</h4>
                  <p>Exhibitors must adhere to designated setup and breakdown times.</p>
                  <h4>3. Insurance</h4>
                  <p>Exhibitors are responsible for obtaining appropriate insurance coverage.</p>
                </div>
              )}
              {signature.documentType === 'VENDOR_AGREEMENT' && (
                <div>
                  <h3>Vendor Service Agreement</h3>
                  <p>This agreement outlines the terms for vendor services.</p>
                  <h4>1. Scope of Services</h4>
                  <p>Services shall be provided as outlined in the agreement.</p>
                  <h4>2. Compensation</h4>
                  <p>Payment terms as agreed in the contract.</p>
                  <h4>3. Confidentiality</h4>
                  <p>Vendor agrees to maintain confidentiality of proprietary information.</p>
                </div>
              )}
              {signature.documentType === 'SPONSOR_AGREEMENT' && (
                <div>
                  <h3>Sponsorship Agreement</h3>
                  <p>This agreement outlines the terms of sponsorship.</p>
                  <h4>1. Sponsorship Benefits</h4>
                  <p>Sponsor shall receive benefits as per the sponsorship package.</p>
                  <h4>2. Payment Terms</h4>
                  <p>Payment schedule as outlined in the agreement.</p>
                  <h4>3. Cancellation</h4>
                  <p>Cancellation policies apply as specified.</p>
                </div>
              )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Signature Pad */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Your Signature</h2>
          <p className="text-gray-600 text-sm mb-4">
            Draw your signature in the box below using your mouse or finger.
          </p>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 mb-4">
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              className="w-full bg-white cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={clearSignature}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className="h-4 w-4" />
              Clear Signature
            </button>
            
            {hasSignature && (
              <span className="text-green-600 flex items-center gap-1">
                <Check className="h-4 w-4" />
                Signature captured
              </span>
            )}
          </div>
        </div>

        {/* Agreement Checkbox */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">
              I have read and understood the document above. By signing, I agree to be legally bound by its terms and conditions. I confirm that the information provided is accurate and that I am authorized to sign this document.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submitSignature}
            disabled={!hasSignature || !agreed || signing}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {signing ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <Pen className="h-5 w-5" />
                Sign Document
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
