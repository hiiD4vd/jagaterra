// Site-wide contact constants. One place to change the number.
export const WHATSAPP_NUMBER = '6281808130070';

/** Build a wa.me deep link with a prefilled message. */
export function waLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
