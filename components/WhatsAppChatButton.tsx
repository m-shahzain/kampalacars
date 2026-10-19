import { whatsappUrl } from "@/lib/contact";

const WHATSAPP_MESSAGE = "Hello Kampala Cars, I would like to make an enquiry.";

export function WhatsAppChatButton() {
  const chatUrl = whatsappUrl(WHATSAPP_MESSAGE);

  return (
    <a
      href={chatUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Kampala Cars on WhatsApp"
      title="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-200 hover:scale-110 hover:bg-[#20bd5a] focus:outline-none focus:ring-4 focus:ring-[#25D366]/35 sm:bottom-6 sm:right-6"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-8 w-8 fill-current">
        <path d="M16.01 3C8.84 3 3 8.83 3 16c0 2.29.6 4.53 1.74 6.49L3 29l6.68-1.7A12.94 12.94 0 0 0 16.01 29C23.17 29 29 23.17 29 16S23.17 3 16.01 3Zm0 23.63c-2.03 0-4.02-.55-5.75-1.6l-.41-.24-3.96 1.01 1.06-3.86-.27-.4A10.58 10.58 0 0 1 5.04 16c0-6.05 4.92-10.97 10.97-10.97S26.98 9.95 26.98 16s-4.92 10.63-10.97 10.63Zm6.01-7.97c-.33-.17-1.95-.96-2.25-1.07-.3-.11-.52-.17-.74.17-.22.33-.85 1.07-1.04 1.29-.19.22-.39.24-.72.08-.33-.17-1.4-.52-2.66-1.66a9.95 9.95 0 0 1-1.84-2.29c-.19-.33-.02-.51.14-.67.15-.15.33-.39.5-.58.17-.19.22-.33.33-.55.11-.22.06-.41-.03-.58-.08-.17-.74-1.78-1.01-2.44-.27-.65-.54-.56-.74-.57h-.63c-.22 0-.58.08-.88.41-.3.33-1.15 1.12-1.15 2.73 0 1.61 1.18 3.17 1.34 3.39.17.22 2.32 3.54 5.62 4.97.78.34 1.39.54 1.87.69.79.25 1.51.21 2.08.13.63-.09 1.95-.8 2.22-1.57.27-.77.27-1.43.19-1.57-.08-.14-.3-.22-.63-.39Z" />
      </svg>
      <span className="sr-only">Chat with Kampala Cars on WhatsApp</span>
    </a>
  );
}
