import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Send, User, Bot, Dumbbell, Zap } from "lucide-react";
import { chatWithCoach } from "../services/geminiService";
import { cn } from "../lib/utils";
import Markdown from "react-markdown";

export default function AICoach({ user }: { user: any }) {
  const [messages, setMessages] = useState<any[]>([
    { role: "assistant", content: "I'm Iron Coach. I don't care about your excuses. I care about your results. What's on your mind today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: m.content
      }));
      
      const response = await chatWithCoach(userMsg, history);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      console.error("Coach Error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "My connection is weak, but your muscles shouldn't be. Try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col h-[calc(100vh-180px)]"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Bot className="w-7 h-7 text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Iron Coach</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Always Watching</span>
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar"
      >
        {messages.map((msg, i) => (
          <div 
            key={i}
            className={cn(
              "flex gap-3 max-w-[85%]",
              msg.role === "user" ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              msg.role === "user" ? "bg-blue-500" : "bg-orange-500"
            )}>
              {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-black" />}
            </div>
            <div className={cn(
              "p-4 rounded-2xl text-sm leading-relaxed",
              msg.role === "user" ? "bg-blue-500/10 text-white border border-blue-500/20 rounded-tr-none" : "bg-white/5 text-gray-200 border border-white/10 rounded-tl-none"
            )}>
              <Markdown>{msg.content}</Markdown>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-black" />
            </div>
            <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/10">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 relative">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about your workout..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:border-orange-500 transition-all"
        />
        <button 
          onClick={handleSend}
          className="absolute right-2 top-2 bottom-2 w-10 bg-orange-500 rounded-xl flex items-center justify-center text-black hover:bg-orange-600 transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}
