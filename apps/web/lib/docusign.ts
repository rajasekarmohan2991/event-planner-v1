// DocuSign Integration Library
// Handles digital signatures for Terms, Disclaimers, Exhibitors, Vendors, and Sponsors

import crypto from 'crypto';

// DocuSign Configuration
const DOCUSIGN_CONFIG = {
  integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY || '',
  secretKey: process.env.DOCUSIGN_SECRET_KEY || '',
  accountId: process.env.DOCUSIGN_ACCOUNT_ID || '',
  basePath: process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi',
  oauthBasePath: process.env.DOCUSIGN_OAUTH_BASE_PATH || 'https://account-d.docusign.com',
  redirectUri: process.env.DOCUSIGN_REDIRECT_URI || '',
};

// Document Types for Signatures
export type SignatureDocumentType = 
  | 'TERMS_AND_CONDITIONS'
  | 'DISCLAIMER'
  | 'EXHIBITOR_AGREEMENT'
  | 'VENDOR_AGREEMENT'
  | 'SPONSOR_AGREEMENT'
  | 'SPEAKER_AGREEMENT'
  | 'ATTENDEE_WAIVER';

export interface SignatureRequest {
  documentType: SignatureDocumentType;
  signerEmail: string;
  signerName: string;
  eventId?: string;
  eventName?: string;
  tenantId: string;
  companyName: string;
  customFields?: Record<string, string>;
  documentContent?: string; // HTML or PDF content
  returnUrl?: string;
}

export interface SignatureResponse {
  envelopeId: string;
  signingUrl: string;
  status: string;
  expiresAt: Date;
}

export interface SignatureStatus {
  envelopeId: string;
  status: 'sent' | 'delivered' | 'signed' | 'completed' | 'declined' | 'voided';
  signerEmail: string;
  signerName: string;
  signedAt?: Date;
  documentUrl?: string;
}

// Document Templates
export const DOCUMENT_TEMPLATES: Record<SignatureDocumentType, {
  title: string;
  description: string;
  defaultContent: (params: any) => string;
}> = {
  TERMS_AND_CONDITIONS: {
    title: 'Terms and Conditions Agreement',
    description: 'General terms and conditions for event participation',
    defaultContent: (params) => `
      <html>
        <head><style>body { font-family: Arial, sans-serif; padding: 40px; } h1 { color: #333; } .signature-box { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; }</style></head>
        <body>
          <h1>Terms and Conditions</h1>
          <h2>${params.eventName || 'Event'}</h2>
          <p><strong>Company:</strong> ${params.companyName}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          
          <h3>1. Acceptance of Terms</h3>
          <p>By signing this agreement, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.</p>
          
          <h3>2. Event Participation</h3>
          <p>Participation in the event is subject to compliance with all applicable rules, regulations, and guidelines set forth by the organizers.</p>
          
          <h3>3. Liability</h3>
          <p>The organizers shall not be liable for any loss, damage, or injury arising from participation in the event, except where such liability cannot be excluded by law.</p>
          
          <h3>4. Intellectual Property</h3>
          <p>All intellectual property rights in materials provided during the event remain with their respective owners.</p>
          
          <h3>5. Data Protection</h3>
          <p>Personal data collected will be processed in accordance with applicable data protection laws and our privacy policy.</p>
          
          <h3>6. Cancellation Policy</h3>
          <p>Cancellation terms and refund policies are as specified in the event registration details.</p>
          
          <div class="signature-box">
            <p><strong>Signatory:</strong> ${params.signerName}</p>
            <p><strong>Email:</strong> ${params.signerEmail}</p>
            <p><strong>Date:</strong> _______________</p>
            <p><strong>Signature:</strong> /sig1/</p>
          </div>
        </body>
      </html>
    `
  },
  
  DISCLAIMER: {
    title: 'Event Disclaimer and Waiver',
    description: 'Liability disclaimer and waiver for event participation',
    defaultContent: (params) => `
      <html>
        <head><style>body { font-family: Arial, sans-serif; padding: 40px; } h1 { color: #333; } .signature-box { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; }</style></head>
        <body>
          <h1>Disclaimer and Waiver</h1>
          <h2>${params.eventName || 'Event'}</h2>
          <p><strong>Organized by:</strong> ${params.companyName}</p>
          
          <h3>Assumption of Risk</h3>
          <p>I understand and acknowledge that participation in this event involves certain risks, including but not limited to physical injury, property damage, and other hazards.</p>
          
          <h3>Release of Liability</h3>
          <p>I hereby release, waive, discharge, and covenant not to sue the organizers, sponsors, volunteers, and all other persons or entities involved in the event from any and all liability, claims, demands, actions, or causes of action arising out of or related to any loss, damage, or injury that may be sustained by me.</p>
          
          <h3>Medical Authorization</h3>
          <p>In case of emergency, I authorize the event organizers to seek medical treatment on my behalf if I am unable to do so myself.</p>
          
          <h3>Photo/Video Release</h3>
          <p>I grant permission for photographs and videos taken during the event to be used for promotional and marketing purposes.</p>
          
          <div class="signature-box">
            <p><strong>I have read and understood this disclaimer:</strong></p>
            <p><strong>Name:</strong> ${params.signerName}</p>
            <p><strong>Email:</strong> ${params.signerEmail}</p>
            <p><strong>Date:</strong> _______________</p>
            <p><strong>Signature:</strong> /sig1/</p>
          </div>
        </body>
      </html>
    `
  },
  
  EXHIBITOR_AGREEMENT: {
    title: 'Exhibitor Agreement',
    description: 'Agreement for exhibitors participating in the event',
    defaultContent: (params) => `
      <html>
        <head><style>body { font-family: Arial, sans-serif; padding: 40px; } h1 { color: #333; } .signature-box { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; } table { width: 100%; border-collapse: collapse; margin: 20px 0; } th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }</style></head>
        <body>
          <h1>Exhibitor Agreement</h1>
          <h2>${params.eventName || 'Event'}</h2>
          <p><strong>Event Organizer:</strong> ${params.companyName}</p>
          <p><strong>Agreement Date:</strong> ${new Date().toLocaleDateString()}</p>
          
          <h3>Exhibitor Details</h3>
          <table>
            <tr><th>Exhibitor Name</th><td>${params.signerName}</td></tr>
            <tr><th>Company/Organization</th><td>${params.exhibitorCompany || '_______________'}</td></tr>
            <tr><th>Email</th><td>${params.signerEmail}</td></tr>
            <tr><th>Booth Number</th><td>${params.boothNumber || '_______________'}</td></tr>
          </table>
          
          <h3>1. Booth Assignment</h3>
          <p>The exhibitor is assigned the booth space as specified above. Booth assignments are final and non-transferable without prior written consent.</p>
          
          <h3>2. Setup and Breakdown</h3>
          <p>Exhibitors must adhere to the designated setup and breakdown times. All materials must be removed by the specified deadline.</p>
          
          <h3>3. Conduct and Compliance</h3>
          <p>Exhibitors agree to conduct themselves professionally and comply with all venue rules and regulations.</p>
          
          <h3>4. Insurance</h3>
          <p>Exhibitors are responsible for obtaining appropriate insurance coverage for their booth, products, and personnel.</p>
          
          <h3>5. Payment Terms</h3>
          <p>Payment for booth space must be completed according to the agreed payment schedule. ${params.paymentTerms || 'Net 30 days from invoice date.'}</p>
          
          <h3>6. Cancellation</h3>
          <p>Cancellation policies apply as per the exhibitor registration terms.</p>
          
          <div class="signature-box">
            <p><strong>Exhibitor Acknowledgment:</strong></p>
            <p>I, the undersigned, agree to the terms and conditions set forth in this Exhibitor Agreement.</p>
            <p><strong>Name:</strong> ${params.signerName}</p>
            <p><strong>Title:</strong> _______________</p>
            <p><strong>Date:</strong> _______________</p>
            <p><strong>Signature:</strong> /sig1/</p>
          </div>
        </body>
      </html>
    `
  },
  
  VENDOR_AGREEMENT: {
    title: 'Vendor Service Agreement',
    description: 'Agreement for vendors providing services to the event',
    defaultContent: (params) => `
      <html>
        <head><style>body { font-family: Arial, sans-serif; padding: 40px; } h1 { color: #333; } .signature-box { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; } table { width: 100%; border-collapse: collapse; margin: 20px 0; } th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }</style></head>
        <body>
          <h1>Vendor Service Agreement</h1>
          <h2>${params.eventName || 'Event'}</h2>
          <p><strong>Client:</strong> ${params.companyName}</p>
          <p><strong>Agreement Date:</strong> ${new Date().toLocaleDateString()}</p>
          
          <h3>Vendor Information</h3>
          <table>
            <tr><th>Vendor Name</th><td>${params.signerName}</td></tr>
            <tr><th>Company</th><td>${params.vendorCompany || '_______________'}</td></tr>
            <tr><th>Email</th><td>${params.signerEmail}</td></tr>
            <tr><th>Service Type</th><td>${params.serviceType || '_______________'}</td></tr>
          </table>
          
          <h3>1. Scope of Services</h3>
          <p>The Vendor agrees to provide the following services: ${params.serviceDescription || '[Service description to be specified]'}</p>
          
          <h3>2. Service Period</h3>
          <p>Services shall be provided during the event dates and any agreed setup/breakdown periods.</p>
          
          <h3>3. Compensation</h3>
          <p>Total compensation: ${params.compensation || '_______________'}</p>
          <p>Payment terms: ${params.paymentTerms || 'Net 30 days from invoice date'}</p>
          
          <h3>4. Insurance and Liability</h3>
          <p>Vendor shall maintain appropriate insurance coverage and indemnify the Client against any claims arising from Vendor's services.</p>
          
          <h3>5. Confidentiality</h3>
          <p>Vendor agrees to maintain confidentiality of all proprietary information shared during the engagement.</p>
          
          <h3>6. Termination</h3>
          <p>Either party may terminate this agreement with 30 days written notice, subject to any cancellation fees.</p>
          
          <div class="signature-box">
            <p><strong>Vendor Acceptance:</strong></p>
            <p><strong>Name:</strong> ${params.signerName}</p>
            <p><strong>Title:</strong> _______________</p>
            <p><strong>Date:</strong> _______________</p>
            <p><strong>Signature:</strong> /sig1/</p>
          </div>
        </body>
      </html>
    `
  },
  
  SPONSOR_AGREEMENT: {
    title: 'Sponsorship Agreement',
    description: 'Agreement for event sponsors',
    defaultContent: (params) => `
      <html>
        <head><style>body { font-family: Arial, sans-serif; padding: 40px; } h1 { color: #333; } .signature-box { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; } table { width: 100%; border-collapse: collapse; margin: 20px 0; } th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }</style></head>
        <body>
          <h1>Sponsorship Agreement</h1>
          <h2>${params.eventName || 'Event'}</h2>
          <p><strong>Event Organizer:</strong> ${params.companyName}</p>
          <p><strong>Agreement Date:</strong> ${new Date().toLocaleDateString()}</p>
          
          <h3>Sponsor Information</h3>
          <table>
            <tr><th>Sponsor Name</th><td>${params.signerName}</td></tr>
            <tr><th>Company</th><td>${params.sponsorCompany || '_______________'}</td></tr>
            <tr><th>Email</th><td>${params.signerEmail}</td></tr>
            <tr><th>Sponsorship Level</th><td>${params.sponsorshipLevel || '_______________'}</td></tr>
          </table>
          
          <h3>1. Sponsorship Benefits</h3>
          <p>The Sponsor shall receive the following benefits as per the ${params.sponsorshipLevel || 'selected'} sponsorship package:</p>
          <ul>
            ${params.benefits || '<li>Logo placement on event materials</li><li>Booth space (if applicable)</li><li>Speaking opportunity (if applicable)</li><li>Complimentary registrations</li>'}
          </ul>
          
          <h3>2. Sponsorship Fee</h3>
          <p>Total sponsorship amount: ${params.sponsorshipAmount || '_______________'}</p>
          <p>Payment schedule: ${params.paymentSchedule || '50% upon signing, 50% 30 days before event'}</p>
          
          <h3>3. Logo and Branding</h3>
          <p>Sponsor agrees to provide high-resolution logos and branding materials within 14 days of signing this agreement.</p>
          
          <h3>4. Exclusivity</h3>
          <p>${params.exclusivity || 'Non-exclusive sponsorship unless otherwise specified in the sponsorship package.'}</p>
          
          <h3>5. Cancellation</h3>
          <p>Cancellation by Sponsor: Fees are non-refundable within 60 days of the event.</p>
          <p>Cancellation by Organizer: Full refund of sponsorship fees paid.</p>
          
          <h3>6. Intellectual Property</h3>
          <p>Each party retains ownership of their respective intellectual property. Limited license granted for event promotional purposes only.</p>
          
          <div class="signature-box">
            <h4>Sponsor Acceptance</h4>
            <p><strong>Name:</strong> ${params.signerName}</p>
            <p><strong>Title:</strong> _______________</p>
            <p><strong>Company:</strong> ${params.sponsorCompany || '_______________'}</p>
            <p><strong>Date:</strong> _______________</p>
            <p><strong>Signature:</strong> /sig1/</p>
          </div>
          
          <div class="signature-box">
            <h4>Event Organizer Acceptance</h4>
            <p><strong>Name:</strong> _______________</p>
            <p><strong>Title:</strong> _______________</p>
            <p><strong>Company:</strong> ${params.companyName}</p>
            <p><strong>Date:</strong> _______________</p>
            <p><strong>Signature:</strong> /sig2/</p>
          </div>
        </body>
      </html>
    `
  },
  
  SPEAKER_AGREEMENT: {
    title: 'Speaker Agreement',
    description: 'Agreement for event speakers and presenters',
    defaultContent: (params) => `
      <html>
        <head><style>body { font-family: Arial, sans-serif; padding: 40px; } h1 { color: #333; } .signature-box { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; }</style></head>
        <body>
          <h1>Speaker Agreement</h1>
          <h2>${params.eventName || 'Event'}</h2>
          <p><strong>Event Organizer:</strong> ${params.companyName}</p>
          
          <h3>Speaker Details</h3>
          <p><strong>Speaker Name:</strong> ${params.signerName}</p>
          <p><strong>Email:</strong> ${params.signerEmail}</p>
          <p><strong>Session Title:</strong> ${params.sessionTitle || '_______________'}</p>
          
          <h3>1. Presentation</h3>
          <p>Speaker agrees to deliver the presentation as outlined in the session details.</p>
          
          <h3>2. Materials</h3>
          <p>Speaker will provide presentation materials at least 7 days before the event.</p>
          
          <h3>3. Recording Rights</h3>
          <p>Speaker grants permission for the session to be recorded and distributed.</p>
          
          <h3>4. Compensation</h3>
          <p>${params.compensation || 'As per agreed terms.'}</p>
          
          <div class="signature-box">
            <p><strong>Speaker Signature:</strong></p>
            <p><strong>Name:</strong> ${params.signerName}</p>
            <p><strong>Date:</strong> _______________</p>
            <p><strong>Signature:</strong> /sig1/</p>
          </div>
        </body>
      </html>
    `
  },
  
  ATTENDEE_WAIVER: {
    title: 'Attendee Waiver and Release',
    description: 'Waiver form for event attendees',
    defaultContent: (params) => `
      <html>
        <head><style>body { font-family: Arial, sans-serif; padding: 40px; } h1 { color: #333; } .signature-box { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; }</style></head>
        <body>
          <h1>Attendee Waiver and Release</h1>
          <h2>${params.eventName || 'Event'}</h2>
          
          <p>I, ${params.signerName}, acknowledge and agree to the following:</p>
          
          <h3>Assumption of Risk</h3>
          <p>I understand that attendance at this event involves certain risks and I voluntarily assume all such risks.</p>
          
          <h3>Release of Liability</h3>
          <p>I release the event organizers from any liability for injury or loss.</p>
          
          <h3>Photo/Video Consent</h3>
          <p>I consent to being photographed or recorded during the event.</p>
          
          <div class="signature-box">
            <p><strong>Name:</strong> ${params.signerName}</p>
            <p><strong>Email:</strong> ${params.signerEmail}</p>
            <p><strong>Date:</strong> _______________</p>
            <p><strong>Signature:</strong> /sig1/</p>
          </div>
        </body>
      </html>
    `
  }
};

/**
 * DocuSign API Client
 */
export class DocuSignClient {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  /**
   * Get OAuth access token
   */
  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    // For JWT Grant flow (server-to-server)
    const response = await fetch(`${DOCUSIGN_CONFIG.oauthBasePath}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${DOCUSIGN_CONFIG.integrationKey}:${DOCUSIGN_CONFIG.secretKey}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'signature'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get DocuSign access token: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000);
    
    return this.accessToken!;
  }

  /**
   * Create and send envelope for signature
   */
  async createEnvelope(request: SignatureRequest): Promise<SignatureResponse> {
    const template = DOCUMENT_TEMPLATES[request.documentType];
    const documentContent = request.documentContent || template.defaultContent({
      ...request,
      ...request.customFields
    });

    // Convert HTML to base64
    const documentBase64 = Buffer.from(documentContent).toString('base64');

    const envelopeDefinition = {
      emailSubject: `Please sign: ${template.title}`,
      documents: [{
        documentBase64,
        name: `${template.title}.html`,
        fileExtension: 'html',
        documentId: '1'
      }],
      recipients: {
        signers: [{
          email: request.signerEmail,
          name: request.signerName,
          recipientId: '1',
          routingOrder: '1',
          tabs: {
            signHereTabs: [{
              anchorString: '/sig1/',
              anchorUnits: 'pixels',
              anchorXOffset: '0',
              anchorYOffset: '-10'
            }],
            dateSignedTabs: [{
              anchorString: 'Date:',
              anchorUnits: 'pixels',
              anchorXOffset: '50',
              anchorYOffset: '0'
            }]
          }
        }]
      },
      status: 'sent'
    };

    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(
        `${DOCUSIGN_CONFIG.basePath}/v2.1/accounts/${DOCUSIGN_CONFIG.accountId}/envelopes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(envelopeDefinition)
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`DocuSign API error: ${error}`);
      }

      const envelope = await response.json();

      // Get signing URL for embedded signing
      const signingUrl = await this.getSigningUrl(envelope.envelopeId, request);

      return {
        envelopeId: envelope.envelopeId,
        signingUrl,
        status: envelope.status,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };
    } catch (error: any) {
      console.error('DocuSign createEnvelope error:', error);
      throw error;
    }
  }

  /**
   * Get embedded signing URL
   */
  async getSigningUrl(envelopeId: string, request: SignatureRequest): Promise<string> {
    const accessToken = await this.getAccessToken();

    const recipientViewRequest = {
      returnUrl: request.returnUrl || `${process.env.NEXTAUTH_URL}/signature/complete`,
      authenticationMethod: 'none',
      email: request.signerEmail,
      userName: request.signerName,
      clientUserId: request.signerEmail // For embedded signing
    };

    const response = await fetch(
      `${DOCUSIGN_CONFIG.basePath}/v2.1/accounts/${DOCUSIGN_CONFIG.accountId}/envelopes/${envelopeId}/views/recipient`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recipientViewRequest)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get signing URL: ${error}`);
    }

    const data = await response.json();
    return data.url;
  }

  /**
   * Get envelope status
   */
  async getEnvelopeStatus(envelopeId: string): Promise<SignatureStatus> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${DOCUSIGN_CONFIG.basePath}/v2.1/accounts/${DOCUSIGN_CONFIG.accountId}/envelopes/${envelopeId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get envelope status: ${response.statusText}`);
    }

    const envelope = await response.json();

    return {
      envelopeId: envelope.envelopeId,
      status: envelope.status,
      signerEmail: envelope.recipients?.signers?.[0]?.email || '',
      signerName: envelope.recipients?.signers?.[0]?.name || '',
      signedAt: envelope.completedDateTime ? new Date(envelope.completedDateTime) : undefined
    };
  }

  /**
   * Download signed document
   */
  async downloadDocument(envelopeId: string): Promise<Buffer> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${DOCUSIGN_CONFIG.basePath}/v2.1/accounts/${DOCUSIGN_CONFIG.accountId}/envelopes/${envelopeId}/documents/combined`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Void an envelope
   */
  async voidEnvelope(envelopeId: string, reason: string): Promise<void> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${DOCUSIGN_CONFIG.basePath}/v2.1/accounts/${DOCUSIGN_CONFIG.accountId}/envelopes/${envelopeId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'voided',
          voidedReason: reason
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to void envelope: ${response.statusText}`);
    }
  }
}

// Singleton instance
export const docuSignClient = new DocuSignClient();

/**
 * Generate a simple signature without DocuSign (fallback)
 * Uses canvas-based signature for basic use cases
 */
export function generateSimpleSignatureUrl(name: string): string {
  // This would generate a simple text-based signature image
  // In production, you'd use a canvas library to create an actual signature image
  const signatureText = encodeURIComponent(name);
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="100">
      <text x="10" y="60" font-family="Brush Script MT, cursive" font-size="40" fill="#000">
        ${name}
      </text>
      <line x1="10" y1="80" x2="290" y2="80" stroke="#000" stroke-width="1"/>
    </svg>
  `)}`;
}

/**
 * Verify signature hash
 */
export function verifySignatureHash(data: string, hash: string, secret: string): boolean {
  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
  return hash === expectedHash;
}

/**
 * Create signature hash for verification
 */
export function createSignatureHash(data: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
}
