import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Timestamp } from 'firebase/firestore';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Timestamp | Date | undefined): string {
  if (!date) return '';
  const d = date instanceof Timestamp ? date.toDate() : date;
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function generateWhatsAppMessage(
  items: Array<{ name: string; quantity: number; price: number }>,
  customerName: string,
  phone: string,
  address?: string,
  notes?: string
): string {
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '2348000000000';
  
  const itemsList = items
    .map(item => `• ${item.name} x${item.quantity} — ${formatPrice(item.price * item.quantity)}`)
    .join('\n');
  
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  const message = [
    '🛒 *New Order from Omoola Supermarket*',
    '',
    `*Customer:* ${customerName}`,
    `*Phone:* ${phone}`,
    address ? `*Address:* ${address}` : '',
    '',
    '*Order Items:*',
    itemsList,
    '',
    `*Total:* ${formatPrice(total)}`,
    notes ? `\n*Notes:* ${notes}` : '',
    '',
    `_Order placed on ${new Date().toLocaleString('en-NG')}_`,
  ]
    .filter(line => line !== undefined)
    .join('\n');
  
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function getImagePlaceholder(name: string): string {
  const colors = ['166534', '15803d', '16a34a', '14532d', '052e16'];
  const index = name.charCodeAt(0) % colors.length;
  const bg = colors[index];
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
  return `https://placehold.co/400x400/${bg}/ffffff?text=${encodeURIComponent(initials)}&font=playfair-display`;
}
