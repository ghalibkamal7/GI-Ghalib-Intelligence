import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ChatHistory from "../components/ChatHistory";
import MessageInput from "../components/MessageInput";
import QuickActions from "../components/QuickActions";
import SmartSuggestions from "../components/SmartSuggestions";
import VoiceMode from "../components/VoiceMode";
import GIVoiceAssistant from "../components/GIVoiceAssistant";
import FocusMode from "../components/FocusMode";
import StudyAnalytics from "../components/StudyAnalytics";
import Flashcards from "../components/Flashcards";
import PinnedMessages from "../components/PinnedMessages";
import HinglishToggle, { HINGLISH_SYSTEM_PROMPT } from "../components/HinglishToggle";
import { detectMood, applyMoodTheme } from "../components/MoodTheme";
import {
  subscribeToChats, createChat,
  deleteChat as firestoreDeleteChat,
  renameChat as firestoreRenameChat,
  subscribeToMessages, addMessage, updateMessage, updateChatTitle,
} from "../services/firestore";
import { streamGeminiResponse } from "../services/gemini";
import { isGhalibQuery, getGhalibBio } from "../components/GhalibBio";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Timer, BarChart2, BookOpen, Pin, Menu } from "lucide-react";

const TOOLS = [
  { icon: <Mic size={14} />,      label: "Voice",  key: "voice" },
  { icon: <Timer size={14} />,    label: "Focus",  key: "focus" },
  { icon: <BookOpen size={14} />, label: "Cards",  key: "cards" },
  { icon: <Pin size={14} />,      label: "Pins",   key: "pins"  },
  { icon: <BarChart2 size={14} />,label: "Stats",  key: "stats" },
];

function AIChat() {
  const { user } = useAuth();
  const [chats, setChats]               = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages]         = useState([]);
  const [allMessages, setAllMessages]   = useState([]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const [suggestions, setSuggestions]   = useState([]);
  const [lastAIMsg, setLastAIMsg]       = useState("");
  const [voiceOpen, setVoiceOpen]       = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [focusOpen, setFocusOpen]       = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [flashcardsOpen, setFlashcardsOpen] = useState(false);
  const [pinsOpen, setPinsOpen]         = useState(false);
  const [pins, setPins]                 = useState([]);
  const [hinglish, setHinglish]         = useState(false);
  const [currentMood, setCurrentMood]   = useState("focused");
  const [moodLabel, setMoodLabel]       = useState("");
  const [moodColor, setMoodColor]       = useState("#6366f1");
  const moodToastRef  = useRef(null);

  const lastUserMsg    = useRef("");
  const activeChatRef  = useRef(null);
  const messagesRef    = useRef([]);
  const hinglishRef    = useRef(false);
  const currentMoodRef = useRef("focused");
  const chatsRef       = useRef([]);
  const sendingRef     = useRef(false);

  useEffect(() => { activeChatRef.current = activeChatId; }, [activeChatId]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { hinglishRef.current = hinglish; }, [hinglish]);
  useEffect(() => { currentMoodRef.current = currentMood; }, [currentMood]);
  useEffect(() => { chatsRef.current = chats; }, [chats]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToChats(user.uid, (data) => {
      setChats(data);
      if (!activeChatRef.current && data.length > 0) setActiveChatId(data[0].id);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!activeChatId) { setMessages([]); return; }
    let cancelled = false;
    setMessages([]);
    const unsub = subscribeToMessages(activeChatId, (msgs) => {
      if (cancelled) return;
      setMessages(msgs);
      setAllMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        return [...prev, ...msgs.filter((m) => !ids.has(m.id))];
      });
    });
    return () => { cancelled = true; unsub(); };
  }, [activeChatId]);

  const resetComposerState = () => {
    setSuggestions([]);
    setLastAIMsg("");
    setStreamingText("");
  };

  const handleCreateNewChat = useCallback(async () => {
    const id = await createChat(user.uid, "New Chat");
    setMessages([]);
    setActiveChatId(id);
    resetComposerState();
  }, [user]);

  const handleSwitchChat = useCallback((id) => {
    if (id === activeChatRef.current) return;
    setMessages([]);
    setActiveChatId(id);
    resetComposerState();
  }, []);

  const handleDeleteChat = async (chatId) => {
    await firestoreDeleteChat(chatId);
    if (activeChatRef.current === chatId) {
      const rest = chatsRef.current.filter((c) => c.id !== chatId);
      if (rest.length > 0) handleSwitchChat(rest[0].id);
      else {
        const id = await createChat(user.uid, "New Chat");
        setMessages([]);
        setActiveChatId(id);
        resetComposerState();
      }
    }
  };

  const showMoodToast = (label, color) => {
    setMoodLabel(label); setMoodColor(color);
    clearTimeout(moodToastRef.current);
    moodToastRef.current = setTimeout(() => setMoodLabel(""), 2500);
  };

  const handlePin   = (msg) => setPins((p) => p.find((x) => x.text === msg.text) ? p : [...p, msg]);
  const handleUnpin = (idx) => setPins((p) => p.filter((_, i) => i !== idx));

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning 👋";
    if (h < 18) return "Good Afternoon ☀️";
    return "Good Evening 🌙";
  };

  const handleSend = useCallback(async (data) => {
    if (!data || (!data.text?.trim() && !data.image)) return;
    if (sendingRef.current) return;
    sendingRef.current = true;
    setLoading(true);

    try {
      let chatId = activeChatRef.current;
      let priorMessages = messagesRef.current;

      if (!chatId) {
        chatId = await createChat(user.uid, "New Chat");
        priorMessages = [];
        activeChatRef.current = chatId;
        setActiveChatId(chatId);
      }

      const userText  = data.text?.trim() || "";
      const userImage = data.image || null;
      if (userText) lastUserMsg.current = userText;

      setInput("");
      setSuggestions([]);
      setStreamingText("");

      await addMessage(chatId, "user", userText, userImage);

      const chat = chatsRef.current.find((c) => c.id === chatId);
      if ((!chat || chat.title === "New Chat") && userText) {
        await updateChatTitle(chatId, userText.slice(0, 42));
      }

      // Create placeholder AI message in Firestore
      const aiMsgId = await addMessage(chatId, "assistant", "", null);

      let fullText = "";
      try {
        // Special case: questions about Ghalib Kamal get an instant,
        // accurate, hand-written bio instead of going to Gemini —
        // faster, never hallucinated, and doesn't use API quota.
        if (isGhalibQuery(userText)) {
          const bio = getGhalibBio();
          const words = bio.split(" ");
          let built = "";
          for (let i = 0; i < words.length; i++) {
            built += (i > 0 ? " " : "") + words[i];
            if (activeChatRef.current === chatId) setStreamingText(built);
            if (i % 6 === 0) await new Promise((r) => setTimeout(r, 12));
          }
          fullText = bio;
        } else {
          const history = [
            ...priorMessages.map((m) => ({ role: m.role, text: m.text, image: m.image })),
            { role: "user", text: userText, image: userImage },
          ];

          const systemPrompt = hinglishRef.current ? HINGLISH_SYSTEM_PROMPT : null;

          fullText = await streamGeminiResponse(history, systemPrompt, (streamed) => {
            if (activeChatRef.current === chatId) setStreamingText(streamed);
          });
        }

        if (!fullText || !fullText.trim()) {
          fullText = "I couldn't generate a response for that. Could you try rephrasing your question?";
        }

        await updateMessage(chatId, aiMsgId, fullText);
        if (activeChatRef.current === chatId) {
          setStreamingText("");
          setLastAIMsg(fullText);
        }

        const mood = detectMood(fullText);
        if (mood !== currentMoodRef.current) {
          const theme = applyMoodTheme(mood);
          setCurrentMood(mood);
          showMoodToast(theme.label, theme.accent);
        }
} catch (err) {
        console.error("GI response error:", err);
        const friendly = err?.message?.includes("API key")
          ? "⚠️ GI isn't configured correctly (missing or invalid API key). Please check the app setup."
          : err?.message?.includes("quota") || err?.message?.includes("429")
          ? "⚠️ GI has hit its usage limit for now. Please try again in a bit."
          : "⚠️ Something went wrong while getting a response. Please try again.";
        await updateMessage(chatId, aiMsgId, friendly);
        if (activeChatRef.current === chatId) setStreamingText("");
      }
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  }, [user]);

  const handleRegenerate = useCallback(async () => {
    if (!lastUserMsg.current || sendingRef.current) return;
    await handleSend({ text: lastUserMsg.current, image: null });
  }, [handleSend]);

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") setMobileSidebar(false);
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); handleCreateNewChat(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "m") { e.preventDefault(); setVoiceOpen(true); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [handleCreateNewChat]);

  const openTool = (key) => {
    if (key === "voice") setVoiceOpen(true);
    if (key === "focus") setFocusOpen(true);
    if (key === "cards") setFlashcardsOpen(true);
    if (key === "pins")  setPinsOpen(true);
    if (key === "stats") setAnalyticsOpen(true);
  };

  const sidebarProps = {
    chats, activeChatId,
    setActiveChatId: handleSwitchChat,
    createNewChat: handleCreateNewChat,
    deleteChat: handleDeleteChat,
    renameChat: async (id, title) => { await firestoreRenameChat(id, title); },
  };

  const activeChat = chats.find((c) => c.id === activeChatId);

  const displayMessages = streamingText
    ? [
        ...messages.filter((m) => m.role !== "assistant" || m.text),
        ...(messages.at(-1)?.role === "assistant" && !messages.at(-1)?.text
          ? [{ ...messages.at(-1), text: streamingText, streaming: true }]
          : [{ id: "streaming", role: "assistant", text: streamingText, streaming: true }]
        ),
      ]
    : messages;

  return (
    <div className="flex h-screen bg-[#0a0f1e] overflow-hidden">

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.22 }}
            className="hidden md:flex shrink-0 overflow-hidden h-full">
            <Sidebar {...sidebarProps} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileSidebar && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileSidebar(false)} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed left-0 top-0 h-full z-50 md:hidden flex">
              <Sidebar {...sidebarProps} isMobile onClose={() => setMobileSidebar(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">

        <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-white/[0.06] shrink-0 bg-[#0a0f1e]/90 backdrop-blur-sm">
          <button onClick={() => setSidebarOpen((p) => !p)}
            className="hidden md:flex p-2 rounded-xl hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors shrink-0">
            <Menu size={17} />
          </button>
          <button onClick={() => setMobileSidebar(true)}
            className="flex md:hidden p-2 rounded-xl hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors shrink-0">
            <Menu size={17} />
          </button>

          <span className="text-slate-300 text-sm font-medium truncate flex-1 min-w-0">
            {activeChat?.title || "New Chat"}
          </span>

          <HinglishToggle enabled={hinglish} onToggle={() => setHinglish((h) => !h)} />

          <div className="flex items-center gap-1 shrink-0">
            {TOOLS.map(({ icon, label, key }) => (
              <motion.button key={key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => openTool(key)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  key === "pins" && pins.length > 0
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.07] border border-transparent hover:border-white/10"
                }`}>
                {icon}
                <span className="hidden sm:inline">{label}</span>
                {key === "pins" && pins.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold">
                    {pins.length}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {displayMessages.length === 0 && !loading ? (
            <div className="flex-1 flex flex-col overflow-y-auto">
              <Header greeting={getGreeting()} messageCount={0} onAction={(t) => handleSend({ text: t })} />
              <QuickActions
  onAction={(t) => handleSend({ text: t })}
  onAssistant={() => setAssistantOpen(true)}
  hidden={false}
/>
            </div>
          ) : (
            <ChatHistory
              messages={displayMessages}
              loading={loading && !streamingText}
              onPin={handlePin}
              onRegenerate={handleRegenerate}
            />
          )}
        </div>

        <SmartSuggestions
          suggestions={suggestions}
          onSelect={(s) => { setSuggestions([]); handleSend({ text: s }); }}
          visible={!loading && suggestions.length > 0}
        />

        <MessageInput
          value={input}
          setValue={setInput}
          onSend={handleSend}
          loading={loading}
          onVoiceOpen={() => setVoiceOpen(true)}
        />
      </div>

      <AnimatePresence>
        {moodLabel && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-28 left-1/2 z-50 px-4 py-2 rounded-full glass border border-white/10 text-xs text-slate-300 shadow-xl flex items-center gap-2 pointer-events-none"
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: moodColor }} />
            Mood → {moodLabel}
          </motion.div>
        )}
      </AnimatePresence>

      <VoiceMode isOpen={voiceOpen} onClose={() => setVoiceOpen(false)}
        onTranscript={(t) => { setVoiceOpen(false); handleSend({ text: t }); }}
        lastAIMessage={lastAIMsg} />
        <GIVoiceAssistant
  isOpen={assistantOpen}
  onClose={() => setAssistantOpen(false)}
  onUserSpeech={(t) => handleSend({ text: t })}
  aiReply={lastAIMsg}
  isThinking={loading}
/>
      <FocusMode isOpen={focusOpen} onClose={() => setFocusOpen(false)} onAskGI={(t) => handleSend({ text: t })} />
      <StudyAnalytics isOpen={analyticsOpen} onClose={() => setAnalyticsOpen(false)} chats={chats} messages={allMessages} />
      <Flashcards isOpen={flashcardsOpen} onClose={() => setFlashcardsOpen(false)} />
      <PinnedMessages isOpen={pinsOpen} onClose={() => setPinsOpen(false)} pins={pins} onUnpin={handleUnpin} />
    </div>
  );
}

export default AIChat;