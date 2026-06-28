import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check } from "lucide-react";
import MarkdownMessage from "./MarkdownMessage";
import TypingIndicator from "./TypingIndicator";
import { useAuth } from "../context/AuthContext";

function MessageBubble({ msg, index }) {
  const { user } = useAuth();
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.02 }}
      className={`flex items-start gap-3 mb-5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {isUser ? (
        <img src={user?.photoURL} alt="You" className="w-8 h-8 rounded-full border border-white/20 object-cover shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
          GI
        </div>
      )}

      <div className={`group max-w-[75%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        {msg.image && (
          <img src={msg.image} alt="Uploaded" className="max-w-xs rounded-2xl border border-white/10 mb-1" />
        )}
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-[#1e293b] text-slate-100 rounded-tl-sm border border-white/[0.07]"
        }`}>
          {isUser ? <p className="whitespace-pre-wrap">{msg.text}</p> : <MarkdownMessage text={msg.text} />}
        </div>
        {!isUser && msg.text && (
          <button onClick={handleCopy} className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-all px-1">
            {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function ChatHistory({ messages, loading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <MessageBubble key={msg.id || i} msg={msg} index={i} />
          ))}
        </AnimatePresence>
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default ChatHistory;