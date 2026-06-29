import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Pin, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";
import MarkdownMessage from "./MarkdownMessage";
import TypingIndicator from "./TypingIndicator";
import GILogo from "./GILogo";
import { useAuth } from "../context/AuthContext";

function MessageBubble({ msg, index, onPin, onRegenerate, isLast }) {
  const { user } = useAuth();
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.02, 0.2) }}
      className={`flex items-start gap-3 mb-6 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      {isUser ? (
        <img
          src={user?.photoURL}
          alt="You"
          className="w-10 h-10 rounded-full border-2 border-indigo-500/30 object-cover shrink-0 mt-1"
        />
      ) : (
        <div className="shrink-0 mt-1">
          <GILogo size={40} animate={false} spinning={false} />
        </div>
      )}

      <div className={`group max-w-[78%] flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
        {/* Name label */}
        <div className={`flex items-center gap-2 px-1 ${isUser ? "flex-row-reverse" : ""}`}>
          <span className="text-xs text-slate-600 font-medium">{isUser ? "You" : "GI"}</span>
          {msg.pinned && <span className="text-xs text-indigo-400">📌 Pinned</span>}
        </div>

        {/* Image preview */}
        {msg.image && (
          <img
            src={msg.image}
            alt="Uploaded"
            className="max-w-xs rounded-2xl border border-white/10 mb-1 shadow-lg"
          />
        )}

        {/* Bubble */}
        <div className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm"
            : "bg-[#1a2235] text-slate-100 rounded-tl-sm border border-white/[0.06]"
        }`}>
          {isUser
            ? <p className="whitespace-pre-wrap">{msg.text}</p>
            : <MarkdownMessage text={msg.text} />
          }
        </div>

        {/* Action bar — AI messages only */}
        {!isUser && msg.text && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 px-1">
            <button onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-all">
              {copied ? <><Check size={11} className="text-emerald-400" /> Copied</> : <><Copy size={11} /> Copy</>}
            </button>
            <button onClick={() => onPin?.(msg)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all">
              <Pin size={11} /> Pin
            </button>
            {isLast && (
              <button onClick={() => onRegenerate?.()}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 transition-all">
                <RotateCcw size={11} /> Retry
              </button>
            )}
            <div className="flex items-center gap-0.5 ml-1">
              <button onClick={() => setLiked(true)}
                className={`p-1 rounded-lg transition-all ${liked === true ? "text-emerald-400" : "text-slate-600 hover:text-emerald-400"}`}>
                <ThumbsUp size={11} />
              </button>
              <button onClick={() => setLiked(false)}
                className={`p-1 rounded-lg transition-all ${liked === false ? "text-red-400" : "text-slate-600 hover:text-red-400"}`}>
                <ThumbsDown size={11} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ChatHistory({ messages, loading, onPin, onRegenerate }) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200);
  };

  return (
    <div className="relative flex-1 overflow-hidden">
      <div ref={containerRef} onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id || i}
                msg={msg}
                index={i}
                onPin={onPin}
                onRegenerate={i === messages.length - 1 && msg.role === "assistant" ? onRegenerate : null}
                isLast={i === messages.length - 1 && msg.role === "assistant"}
              />
            ))}
          </AnimatePresence>
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="absolute bottom-4 right-4 p-2.5 rounded-full glass border border-white/10 text-slate-400 hover:text-white shadow-lg transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChatHistory;