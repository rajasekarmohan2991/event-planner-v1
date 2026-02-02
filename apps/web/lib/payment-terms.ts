// Payment terms utilities for invoice management

export interface PaymentTermOption {
  value: number;
  label: string;
  description: string;
}

export const PAYMENT_TERMS_OPTIONS: PaymentTermOption[] = [
  { value: 0, label: 'Due on Receipt', description: 'Payment due immediately' },
  { value: 7, label: 'Net 7', description: 'Payment due within 7 days' },
  { value: 15, label: 'Net 15', description: 'Payment due within 15 days' },
  { value: 30, label: 'Net 30', description: 'Payment due within 30 days' },
  { value: 45, label: 'Net 45', description: 'Payment due within 45 days' },
  { value: 60, label: 'Net 60', description: 'Payment due within 60 days' },
  { value: 90, label: 'Net 90', description: 'Payment due within 90 days' },
];

/**
 * Calculate due date based on invoice date and payment terms
 * @param invoiceDate The date the invoice was issued
 * @param paymentTermsDays Number of days for payment (e.g., 30 for Net 30)
 * @returns The calculated due date
 */
export function calculateDueDate(invoiceDate: Date, paymentTermsDays: number): Date {
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + paymentTermsDays);
  return dueDate;
}

/**
 * Calculate due date based on event date and payment terms
 * Useful for event-based invoices where payment is due relative to the event
 * @param eventDate The event start date
 * @param paymentTermsDays Number of days for payment
 * @param beforeEvent If true, payment is due X days before event; if false, X days after
 * @returns The calculated due date
 */
export function calculateDueDateFromEvent(
  eventDate: Date,
  paymentTermsDays: number,
  beforeEvent: boolean = true
): Date {
  const dueDate = new Date(eventDate);
  if (beforeEvent) {
    dueDate.setDate(dueDate.getDate() - paymentTermsDays);
  } else {
    dueDate.setDate(dueDate.getDate() + paymentTermsDays);
  }
  return dueDate;
}

/**
 * Get payment term label from days value
 * @param days Number of days
 * @returns Human-readable label (e.g., "Net 30")
 */
export function getPaymentTermLabel(days: number): string {
  const option = PAYMENT_TERMS_OPTIONS.find(opt => opt.value === days);
  return option?.label || `Net ${days}`;
}

/**
 * Check if an invoice is overdue
 * @param dueDate The invoice due date
 * @param status Current invoice status
 * @returns True if invoice is overdue
 */
export function isInvoiceOverdue(dueDate: Date, status: string): boolean {
  if (status === 'PAID' || status === 'CANCELLED') {
    return false;
  }
  return new Date() > new Date(dueDate);
}

/**
 * Calculate days until/past due
 * @param dueDate The invoice due date
 * @returns Positive number for days until due, negative for days overdue
 */
export function getDaysUntilDue(dueDate: Date): number {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Format payment terms for display
 * @param days Number of days
 * @returns Formatted string (e.g., "Net 30 days")
 */
export function formatPaymentTerms(days: number): string {
  if (days === 0) return 'Due on Receipt';
  return `Net ${days} days`;
}
