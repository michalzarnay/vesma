import { MessageCircle } from 'lucide-react';

// TODO: Future AI integration - chatbot using Anthropic Claude API
export function ChatAssistant() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        className="w-12 h-12 bg-brand-strong rounded-full shadow-lg flex items-center justify-center text-white hover:bg-brand-strong/90 transition-colors"
        onClick={() => alert('Táto funkcia bude dostupná čoskoro. AI asistent vám pomôže s vyplnením dotazníka.')}
        aria-label="AI Asistent"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
}
