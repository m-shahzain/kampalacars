const WHATSAPP_NUMBER = "256752328882";
const WHATSAPP_MESSAGE = "Hello Kampala Cars, I would like to make an enquiry.";

export function WhatsAppChatButton() {
  const chatUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={chatUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Kampala Cars on WhatsApp"
      title="Chat with us on WhatsApp"
      className="fixed bottom-3 right-3 z-50 block h-28 w-28 overflow-hidden rounded-full shadow-lg transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#25D366]/35 sm:bottom-4 sm:right-4 sm:h-32 sm:w-32"
    >
      <img src="/whatsapp_logo.png" alt="" className="h-full w-full object-contain" />
      <span className="sr-only">Chat with Kampala Cars on WhatsApp</span>
    </a>
  );
}
