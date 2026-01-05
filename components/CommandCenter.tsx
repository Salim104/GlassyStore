
import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, Sparkles, Loader2, Package, Users, ShoppingCart, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useUIStore } from '../lib/store';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const CommandCenter = () => {
  const { commandPaletteOpen, setCommandPalette, addToast } = useUIStore();
  const [query, setQuery] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPalette(true);
      }
      if (e.key === 'Escape') setCommandPalette(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setAiResponse(null);
      setQuery('');
    }
  }, [commandPaletteOpen]);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    // Simple routing commands
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('product')) return navigate('/products'), setCommandPalette(false);
    if (lowerQuery.includes('order')) return navigate('/orders'), setCommandPalette(false);
    if (lowerQuery.includes('setting')) return navigate('/settings'), setCommandPalette(false);
    if (lowerQuery.includes('user')) return navigate('/users'), setCommandPalette(false);

    // AI Logic for complex queries
    setIsAiProcessing(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an eCommerce Command Assistant. The user asked: "${query}". 
        If it's a question about business, give a short 1-sentence tip. 
        If it's a search for a concept like "low stock", suggest checking the Products page. 
        Be concise. Max 15 words.`,
      });
      setAiResponse(response.text || "I'm ready to help with your store.");
    } catch (err) {
      console.error(err);
      addToast('error', 'AI Assistant Error', 'Unable to process command.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center pt-[15vh] px-4">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={() => setCommandPalette(false)}
      ></div>
      
      <div className="relative w-full max-w-2xl glass-panel rounded-3xl overflow-hidden shadow-2xl border-indigo-500/20 animate-in zoom-in-95 duration-200">
        <form onSubmit={handleCommand} className="relative">
          <div className="flex items-center px-6 py-5 border-b border-white/10">
            <Search className="text-slate-500 mr-4" size={24} />
            <input 
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent border-none text-xl text-white placeholder:text-slate-600 focus:outline-none"
              placeholder="Search or ask AI (e.g. 'How to increase sales?')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="flex items-center space-x-2">
               <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded border border-white/10 flex items-center gap-1">
                 <Command size={10} /> K
               </span>
            </div>
          </div>

          <div className="p-4 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quick Navigation</div>
            <button 
              onClick={() => { navigate('/products'); setCommandPalette(false); }}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-slate-300 group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><Package size={18} /></div>
                <span className="font-medium">Inventory Management</span>
              </div>
              <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </button>
            <button 
              onClick={() => { navigate('/orders'); setCommandPalette(false); }}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-slate-300 group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><ShoppingCart size={18} /></div>
                <span className="font-medium">Recent Orders</span>
              </div>
              <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </button>
          </div>

          { (isAiProcessing || aiResponse) && (
            <div className="p-6 bg-indigo-500/5 border-t border-white/5">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <Sparkles size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">AI Insight</span>
              </div>
              {isAiProcessing ? (
                <div className="flex items-center gap-3 text-slate-400 text-sm italic">
                  <Loader2 size={16} className="animate-spin" />
                  Analyzing store patterns...
                </div>
              ) : (
                <div className="text-white text-lg font-medium leading-relaxed flex items-center justify-between">
                  <span>{aiResponse}</span>
                  <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-600/20">
                    <CornerDownLeft size={16} />
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
