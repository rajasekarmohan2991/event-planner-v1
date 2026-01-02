import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const {
            to,
            adminName,
            eventName,
            vendorName,
            category,
            contractAmount,
            paidAmount,
            remainingAmount,
            paymentDueDate,
            bankDetails,
            vendorContact,
            paymentLink
        } = body

        const subject = `Payment Required: ${vendorName} - ₹${remainingAmount.toLocaleString('en-IN')}`

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vendor Payment Required</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                      💳 Vendor Payment Required
                    </h1>
                    <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                      ${eventName}
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                      Hi <strong>${adminName}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 30px 0; color: #555555; font-size: 15px; line-height: 1.6;">
                      A new vendor has been added to your event with a pending payment. Please review the details below and process the payment at your earliest convenience.
                    </p>

                    <!-- Vendor Details Card -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 20px;">
                          <h2 style="margin: 0 0 15px 0; color: #667eea; font-size: 20px; font-weight: 600;">
                            Vendor Details
                          </h2>
                          <table width="100%" cellpadding="8" cellspacing="0">
                            <tr>
                              <td style="color: #666666; font-size: 14px; width: 40%;">Vendor Name:</td>
                              <td style="color: #333333; font-size: 14px; font-weight: 600;">${vendorName}</td>
                            </tr>
                            <tr>
                              <td style="color: #666666; font-size: 14px;">Category:</td>
                              <td style="color: #333333; font-size: 14px; font-weight: 600;">${category}</td>
                            </tr>
                            ${vendorContact.name ? `
                            <tr>
                              <td style="color: #666666; font-size: 14px;">Contact Person:</td>
                              <td style="color: #333333; font-size: 14px;">${vendorContact.name}</td>
                            </tr>
                            ` : ''}
                            ${vendorContact.email ? `
                            <tr>
                              <td style="color: #666666; font-size: 14px;">Email:</td>
                              <td style="color: #333333; font-size: 14px;"><a href="mailto:${vendorContact.email}" style="color: #667eea; text-decoration: none;">${vendorContact.email}</a></td>
                            </tr>
                            ` : ''}
                            ${vendorContact.phone ? `
                            <tr>
                              <td style="color: #666666; font-size: 14px;">Phone:</td>
                              <td style="color: #333333; font-size: 14px;"><a href="tel:${vendorContact.phone}" style="color: #667eea; text-decoration: none;">${vendorContact.phone}</a></td>
                            </tr>
                            ` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Payment Details Card -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%); border-radius: 8px; margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 20px;">
                          <h2 style="margin: 0 0 15px 0; color: #2d3436; font-size: 20px; font-weight: 600;">
                            💰 Payment Summary
                          </h2>
                          <table width="100%" cellpadding="8" cellspacing="0">
                            <tr>
                              <td style="color: #2d3436; font-size: 14px; width: 50%;">Contract Amount:</td>
                              <td style="color: #2d3436; font-size: 14px; font-weight: 600; text-align: right;">₹${contractAmount.toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                              <td style="color: #2d3436; font-size: 14px;">Paid Amount:</td>
                              <td style="color: #27ae60; font-size: 14px; font-weight: 600; text-align: right;">₹${paidAmount.toLocaleString('en-IN')}</td>
                            </tr>
                            <tr style="border-top: 2px solid rgba(0,0,0,0.1);">
                              <td style="color: #2d3436; font-size: 18px; font-weight: 700; padding-top: 12px;">Remaining Amount:</td>
                              <td style="color: #e74c3c; font-size: 20px; font-weight: 700; text-align: right; padding-top: 12px;">₹${remainingAmount.toLocaleString('en-IN')}</td>
                            </tr>
                            ${paymentDueDate ? `
                            <tr>
                              <td style="color: #2d3436; font-size: 14px;">Due Date:</td>
                              <td style="color: #e74c3c; font-size: 14px; font-weight: 600; text-align: right;">${new Date(paymentDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                            </tr>
                            ` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Bank Details Card -->
                    ${bankDetails.bankName || bankDetails.accountNumber || bankDetails.upiId ? `
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e8f5e9; border-radius: 8px; border-left: 4px solid #4caf50; margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 20px;">
                          <h2 style="margin: 0 0 15px 0; color: #2e7d32; font-size: 20px; font-weight: 600;">
                            🏦 Vendor Bank Details
                          </h2>
                          <table width="100%" cellpadding="8" cellspacing="0">
                            ${bankDetails.bankName ? `
                            <tr>
                              <td style="color: #555555; font-size: 14px; width: 40%;">Bank Name:</td>
                              <td style="color: #333333; font-size: 14px; font-weight: 600;">${bankDetails.bankName}</td>
                            </tr>
                            ` : ''}
                            ${bankDetails.accountHolderName ? `
                            <tr>
                              <td style="color: #555555; font-size: 14px;">Account Holder:</td>
                              <td style="color: #333333; font-size: 14px; font-weight: 600;">${bankDetails.accountHolderName}</td>
                            </tr>
                            ` : ''}
                            ${bankDetails.accountNumber ? `
                            <tr>
                              <td style="color: #555555; font-size: 14px;">Account Number:</td>
                              <td style="color: #333333; font-size: 14px; font-weight: 600; font-family: 'Courier New', monospace;">${bankDetails.accountNumber}</td>
                            </tr>
                            ` : ''}
                            ${bankDetails.ifscCode ? `
                            <tr>
                              <td style="color: #555555; font-size: 14px;">IFSC Code:</td>
                              <td style="color: #333333; font-size: 14px; font-weight: 600; font-family: 'Courier New', monospace;">${bankDetails.ifscCode}</td>
                            </tr>
                            ` : ''}
                            ${bankDetails.upiId ? `
                            <tr>
                              <td style="color: #555555; font-size: 14px;">UPI ID:</td>
                              <td style="color: #333333; font-size: 14px; font-weight: 600; font-family: 'Courier New', monospace;">${bankDetails.upiId}</td>
                            </tr>
                            ` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="${paymentLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                            View Vendor & Make Payment
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 30px 0 0 0; color: #777777; font-size: 13px; line-height: 1.6; text-align: center;">
                      This is an automated notification. Please contact the vendor directly for any queries regarding payment terms or bank details.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0; color: #999999; font-size: 12px;">
                      © ${new Date().getFullYear()} Event Planner. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

        await sendEmail({
            to,
            subject,
            html
        })

        return NextResponse.json({ success: true, message: 'Payment notification sent' })
    } catch (error: any) {
        console.error('Error sending vendor payment email:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
