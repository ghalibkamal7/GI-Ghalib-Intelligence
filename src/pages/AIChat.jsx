import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ChatHistory from "../components/ChatHistory";
import MessageInput from "../components/MessageInput";
import QuickActions from "../components/QuickActions";
import SmartSuggestions from "../components/SmartSuggestions";
import VoiceMode from "../components/VoiceMode";
import FocusMode from "../components/FocusMode";
import StudyAnalytics from "../components/StudyAnalytics";
import HinglishToggle, { HINGLISH_SYSTEM_PROMPT } from "../components/HinglishToggle";
import { detectMood, applyMoodTheme, MOOD_THEMES } from "../components/MoodTheme";
import {
  subscribeToChats, createChat,
  deleteChat as firestoreDeleteChat,
  renameChat as firestoreRenameChat,
  subscribeToMessages, addMessage, updateChatTitle,
} from "../services/firestore";
import { generateGeminiResponse, generateSuggestions } from "../services/gemini";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Brain, BarChart2, Timer } from "lucide-react";

function AIChat() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Feature states
  const [suggestions, setSuggestions] = useState([]);
  const [lastAIMsg, setLastAIMsg] = useState("");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [hinglish, setHinglish] = useState(false);
  const [currentMood, setCurrentMood] = useState("focused");
  const [moodLabel, setMoodLabel] = useState("");
  const moodToastRef = useRef(null);

  // Subscribe chats
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToChats(user.uid, (data) => {
      setChats(data);
      if (!activeChatId && data.length > 0) setActiveChatId(data[0].id);
    });
    return () => unsub();
  }, [user]);

  // Subscribe messages of active chat
  useEffect(() => {
    if (!activeChatId) { setMessages([]); return; }
    const unsub = subscribeToMessages(activeChatId, (msgs) => {
      setMessages(msgs);
      setAllMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const newOnes = msgs.filter((m) => !ids.has(m.id));
        return [...prev, ...newOnes];
      });
    });
    return () => unsub();
  }, [activeChatId]);

  const handleCreateNewChat = async () => {
    const id = await createChat(user.uid, "New Chat");
    setActiveChatId(id);
    setSuggestions([]);
    setLastAIMsg("");
  };

  const handleDeleteChat = async (chatId) => {
    await firestoreDeleteChat(chatId);
    if (activeChatId === chatId) {
      const remaining = chats.filter((c) => c.id !== chatId);
      if (remaining.length > 0) setActiveChatId(remaining[0].id);
      else { const id = await createChat(user.uid, "New Chat"); setActiveChatId(id); }
    }
  };

  const handleRenameChat = async (chatId, title) => {
    await firestoreRenameChat(chatId, title);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning 👋";
    if (h < 18) return "Good Afternoon ☀️";
    return "Good Evening 🌙";
  };

  const showMoodToast = (label) => {
    setMoodLabel(label);
    clearTimeout(moodToastRef.current);
    moodToastRef.current = setTimeout(() => setMoodLabel(""), 2500);
  };

  const handleSend = useCallback(async (data) => {
    if (!data || (!data.text?.trim() && !data.image)) return;
    if (loading) return;

    let chatId = activeChatId;
    if (!chatId) {
      chatId = await createChat(user.uid, "New Chat");
      setActiveChatId(chatId);
    }

    const userText = data.text?.trim() || "";
    const userImage = data.image || null;
    setInput("");
    setSuggestions([]);
    setLoading(true);

    await addMessage(chatId, "user", userText, userImage);

    const chat = chats.find((c) => c.id === chatId);
    if (chat?.title === "New Chat" && userText) {
      await updateChatTitle(chatId, userText.slice(0, 40));
    }

    try {
      const history = [
        ...messages.map((m) => ({ role: m.role, text: m.text, image: m.image })),
        { role: "user", text: userText, image: userImage },
      ];

      const systemPrompt = hinglish ? HINGLISH_SYSTEM_PROMPT : null;
      const aiText = await generateGeminiResponse(history, systemPrompt);

      await addMessage(chatId, "assistant", aiText, null);
      setLastAIMsg(aiText);

      // Apply mood theme
      const mood = detectMood(aiText);
      if (mood !== currentMood) {
        const theme = applyMoodTheme(mood);
        setCurrentMood(mood);
        showMoodToast(theme.label);
      }

      // Generate smart suggestions (non-blocking)
      generateSuggestions(aiText).then((s) => setSuggestions(s)).catch(() => {});
    } catch (err) {
      console.error("Gemini error:", err);
      await addMessage(chatId, "assistant", "Sorry, I ran into an error. Please try again.", null);
    } finally {
      setLoading(false);
    }
  }, [activeChatId, chats, messages, loading, user, hinglish, currentMood]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); handleCreateNewChat(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "m") { e.preventDefault(); setVoiceOpen(true); }
      if ((e.metaKey || e.ctrlKey) && e.key === "f") { e.preventDefault(); setFocusOpen(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <div className="flex h-screen bg-[#0a0f1e] overflow-hidden">
      {/* Sidebar */}
      {sidebarOpen && (
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          setActiveChatId={(id) => { setActiveChatId(id); setSuggestions([]); setLastAIMsg(""); }}
          createNewChat={handleCreateNewChat}
          deleteChat={handleDeleteChat}
          renameChat={handleRenameChat}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.07] shrink-0">
          {/* Hamburger */}
          <button onClick={() => setSidebarOpen((p) => !p)}
            className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <span className="text-slate-300 text-sm font-medium truncate flex-1">
            {activeChat?.title || "New Chat"}
          </span>

          {/* Feature Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            <HinglishToggle enabled={hinglish} onToggle={() => setHinglish((h) => !h)} />

            <button onClick={() => setVoiceOpen(true)}
              title="Voice Mode (⌘M)"
              className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-400 hover:text-indigo-400 transition-colors">
              <Mic size={16} />
            </button>

            <button onClick={() => setFocusOpen(true)}
              title="Focus Mode (⌘F)"
              className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-400 hover:text-emerald-400 transition-colors">
              <Timer size={16} />
            </button>

            <button onClick={() => setAnalyticsOpen(true)}
              title="Study Analytics"
              className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-400 hover:text-purple-400 transition-colors">
              <BarChart2 size={16} />
            </button>
          </div>
        </div>

        {/* Chat body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {messages.length === 0 && !loading ? (
            <div className="flex-1 flex flex-col justify-center">
              <Header greeting={getGreeting()} messageCount={0} />
              <QuickActions onAction={(t) => handleSend({ text: t })} hidden={false} />
            </div>
          ) : (
            <ChatHistory messages={messages} loading={loading} />
          )}
        </div>

        {/* Smart Suggestions */}
        <SmartSuggestions
          suggestions={suggestions}
          onSelect={(s) => { setSuggestions([]); handleSend({ text: s }); }}
          visible={!loading && suggestions.length > 0}
        />

        {/* Input */}
        <MessageInput value={input} setValue={setInput} onSend={handleSend} loading={loading} />
      </div>

      {/* Mood Toast */}
      <AnimatePresence>
        {moodLabel && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-28 left-1/2 z-50 px-4 py-2 rounded-full glass border border-white/10 text-xs text-slate-300 shadow-xl"
          >
            Theme changed to {moodLabel}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <VoiceMode
        isOpen={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onTranscript={(t) => { setVoiceOpen(false); handleSend({ text: t }); }}
        lastAIMessage={lastAIMsg}
      />

      <FocusMode
        isOpen={focusOpen}
        onClose={() => setFocusOpen(false)}
        onAskGI={(t) => handleSend({ text: t })}
      />

      <StudyAnalytics
        isOpen={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        chats={chats}
        messages={allMessages}
      />
    </div>
  );
}

export default AIChat;