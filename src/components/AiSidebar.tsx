import { useState, useRef, useEffect } from 'react';
import { X, Bot, Send, User, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your AI assistant. How can I help you regarding your assets and maintenance today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: inputValue.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("No token");

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: messages.concat(userMessage).map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.choices[0]?.message?.content || "Sorry, I could not generate a response." 
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Error: Could not connect to AI service.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20"
          onClick={onClose}
        />
      )}
      <div className={cn(
        "fixed inset-y-0 right-0 z-50 flex w-80 sm:w-96 flex-col bg-surface-container-lowest border-l border-outline-variant transition-transform duration-300 shadow-xl",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-outline-variant bg-surface">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Bot className="h-5 w-5" />
            <span>MiMo AI Assistant</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-background">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "")}>
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                msg.role === 'user' ? "bg-primary text-on-primary" : "bg-secondary-container text-on-secondary-container"
              )}>
                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={cn(
                "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                msg.role === 'user' 
                  ? "bg-primary text-on-primary rounded-tr-sm" 
                  : "bg-surface-container text-on-surface rounded-tl-sm px-4 py-3"
              )}>
                {msg.role === 'assistant' ? (
                  <div className="markdown-body text-sm max-w-none">
                    <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-surface-container text-on-surface rounded-2xl rounded-tl-sm px-4 py-3 text-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-on-surface-variant text-xs">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-outline-variant bg-surface">
          <div className="flex items-end gap-2 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about assets..."
              className="flex-1 max-h-32 min-h-[44px] resize-none rounded-xl border border-outline-variant bg-surface-container-lowest py-2.5 pl-4 pr-12 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary overflow-hidden"
              rows={1}
              style={{ height: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-1.5 bottom-1.5 p-2 bg-primary text-on-primary rounded-lg disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="text-[10px] text-center text-on-surface-variant mt-2">
            Powered by Xiaomi MiMo 2.5
          </div>
        </div>
      </div>
    </>
  );
}
