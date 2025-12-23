import { ComprehensiveSponsor, ContactData, PaymentData } from '@/types/sponsor'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface ContactPaymentProps {
    data: Partial<ComprehensiveSponsor>
    updateData: (key: keyof ComprehensiveSponsor, value: any) => void
}

export default function ContactPayment({ data, updateData }: ContactPaymentProps) {
    const contact = data.contactData || {} as ContactData
    const payment = data.paymentData || {} as PaymentData

    const updateContact = (key: keyof ContactData, value: any) => {
        updateData('contactData', { ...contact, [key]: value })
    }

    const updatePayment = (key: keyof PaymentData, value: any) => {
        updateData('paymentData', { ...payment, [key]: value })
    }

    return (
        <div className="space-y-8">
            {/* Contact Details Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Contact Person Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="contactName">Contact Name *</Label>
                        <Input
                            id="contactName"
                            value={contact.contactName || ''}
                            onChange={(e) => updateContact('contactName', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="designation">Designation</Label>
                        <Input
                            id="designation"
                            value={contact.designation || ''}
                            onChange={(e) => updateContact('designation', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={contact.email || ''}
                            onChange={(e) => updateContact('email', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                            id="phone"
                            value={contact.phone || ''}
                            onChange={(e) => updateContact('phone', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp</Label>
                        <Input
                            id="whatsapp"
                            value={contact.whatsapp || ''}
                            onChange={(e) => updateContact('whatsapp', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="alternateContact">Alternate Contact</Label>
                        <Input
                            id="alternateContact"
                            value={contact.alternateContact || ''}
                            onChange={(e) => updateContact('alternateContact', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Payment Information Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Payment Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="paymentMode">Payment Mode *</Label>
                        <Select
                            value={payment.paymentMode}
                            onValueChange={(value) => updatePayment('paymentMode', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Mode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</SelectItem>
                                <SelectItem value="CHEQUE">Cheque</SelectItem>
                                <SelectItem value="ONLINE">Online Payment</SelectItem>
                                <SelectItem value="UPI">UPI</SelectItem>
                                <SelectItem value="CASH">Cash</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="paymentStatus">Payment Status *</Label>
                        <Select
                            value={payment.paymentStatus}
                            onValueChange={(value) => updatePayment('paymentStatus', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="PAID">Paid</SelectItem>
                                <SelectItem value="PARTIAL">Partial</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="amountPaid">Amount Paid</Label>
                        <Input
                            id="amountPaid"
                            type="number"
                            value={payment.amountPaid || ''}
                            onChange={(e) => updatePayment('amountPaid', Number(e.target.value))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="paymentDueDate">Payment Due Date</Label>
                        <Input
                            id="paymentDueDate"
                            type="date"
                            value={payment.paymentDueDate || ''}
                            onChange={(e) => updatePayment('paymentDueDate', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="transactionId">Transaction ID / Cheque No.</Label>
                        <Input
                            id="transactionId"
                            value={payment.transactionId || ''}
                            onChange={(e) => updatePayment('transactionId', e.target.value)}
                        />
                    </div>
                    <div className="flex items-end pb-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="invoiceRequired"
                                checked={payment.invoiceRequired || false}
                                onCheckedChange={(checked) => updatePayment('invoiceRequired', checked)}
                            />
                            <Label htmlFor="invoiceRequired">GST Invoice Required</Label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
