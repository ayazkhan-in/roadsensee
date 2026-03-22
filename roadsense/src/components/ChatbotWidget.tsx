import { useState } from "react";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([
    { role: "bot", text: "Hi! I'm RoadSense Assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setMessages((prev) => [
      ...prev,
      { role: "user" as const, text },
    ]);
    setInput("");

    try {
      const response = await api.assistantChat({ message: text });
      setMessages((prev) => [...prev, { role: "bot" as const, text: response.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot" as const,
          text: "I am having trouble connecting right now. You can still report an issue, track by complaint ID, or refresh and try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-card rounded-2xl shadow-xl border border-border/60 overflow-hidden animate-scale-in">
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
            <span className="font-semibold text-sm">RoadSense Assistant</span>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-70 transition-opacity">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-64 overflow-y-auto p-3 space-y-2">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border p-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              disabled={isSending}
              className="flex-1 bg-secondary rounded-lg px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={handleSend}
              disabled={isSending || !input.trim()}
              className="bg-primary text-primary-foreground rounded-lg p-2 hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-50"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary text-primary-foreground h-14 w-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow active:scale-95"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-teal rounded-full border-2 border-card" />
        )}
      </button>
    </div>
  );
};

export default ChatbotWidget;
