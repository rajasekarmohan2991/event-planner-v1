import { format, parseISO } from 'date-fns';

export function formatDateLabel(dateString: string): string {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    return format(date, 'EEE, d MMM, h:mm a');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date not available';
  }
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}
