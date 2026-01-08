import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, Zap, Waves, Phone, Key, AlertCircle, ShieldAlert } from 'lucide-react';
import { generateChatResponse } from '../services/geminiService';
import { ChatMessage } from '../types';
import { useTranslation } from './LanguageContext';

const Chatbot: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { 
          role: 'model', 
          text: t('Hello! I am the ReliefNet AI assistant. I can help with safety tips, reporting incidents, or finding donation centers.'), 
          timestamp: Date.now() 
        }
      ]);
    }
  }, [t, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleOpenKeySetup = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      await aistudio.openSelectKey();
    }
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const responseText = await generateChatResponse(history, userMsg.text);
      
      let finalResponse = responseText;
      if (responseText === "QUOTA_EXCEEDED") {
        finalResponse = "I've hit the limit for free requests (15 per minute). You can fix this by selecting an API key from a project with billing enabled.";
      } else if (responseText === "AUTH_ERROR") {
        finalResponse = "There is an issue with your API key. Please click the button below to select a valid key.";
      }

      setMessages(prev => [...prev, { role: 'model', text: finalResponse, timestamp: Date.now() }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: t("Sorry, I encountered an error. Please check your API key and try again."), 
        timestamp: Date.now() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end print:hidden">
      {isOpen && (
        <div className="bg-white w-80 sm:w-96 h-[550px] rounded-2xl shadow-2xl border border-slate-200 flex flex-col mb-4 overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-blue-600 p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2 text-white">
              <Bot className="h-5 w-5" />
              <span className="font-semibold">{t('ReliefNet AI')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleOpenKeySetup}
                className="p-1.5 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                title={t("Setup API Key")}
              >
                <Key className="h-4 w-4" />
              </button>
              <button onClick={() => setIsOpen(false)} className="text-blue-100 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 text-left">
            {messages.map((msg, idx) => {
              const isError = msg.text.includes("limit") || msg.text.includes("API key");
              return (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : isError 
                          ? 'bg-red-50 text-red-800 border border-red-100 rounded-bl-none'
                          : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                    }`}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        {isError && <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />}
                        <span>{msg.text}</span>
                      </div>
                      
                      {isError && (
                        <button 
                          onClick={handleOpenKeySetup}
                          className="flex items-center justify-center gap-2 py-2 px-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-black transition-all"
                        >
                          <ShieldAlert className="h-3 w-3" />
                          UPDATE API KEY
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="bg-white border-t border-slate-100 px-2 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
             <button onClick={() => handleSend(t("What should I do during an Earthquake?"))} className="flex-shrink-0 flex items-center px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full hover:bg-amber-100 border border-amber-100 transition-colors">
                <Zap className="h-3 w-3 mr-1" /> {t('Earthquake')}
             </button>
             <button onClick={() => handleSend(t("Safety tips for floods"))} className="flex-shrink-0 flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full hover:bg-blue-100 border border-blue-100 transition-colors">
                <Waves className="h-3 w-3 mr-1" /> {t('Flood')}
             </button>
             <button onClick={() => handleSend(t("Emergency helpline numbers India"))} className="flex-shrink-0 flex items-center px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-full hover:bg-red-100 border border-red-100 transition-colors">
                <Phone className="h-3 w-3 mr-1" /> {t('Help')}
             </button>
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-100">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={t("Ask for help...")}
                className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
              />
              <button 
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
};

export default Chatbot;