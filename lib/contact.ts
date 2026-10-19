// Kampala Cars contact details, shared by the WhatsApp button and the info pages.
export const WHATSAPP_NUMBER = '256752328882'
export const PHONE_DISPLAY = '+256 752 328 882'

export function whatsappUrl(message?: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ''}`
}
