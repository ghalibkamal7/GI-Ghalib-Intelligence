import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ChatHistory from "../components/ChatHistory";
import MessageInput from "../components/MessageInput";
import QuickActions from "../components/QuickActions";
import {
  subscribeToChats, createChat,
  deleteChat as firestoreDeleteChat,
  renameChat as firestoreRenameChat,
  subscribeToMessages, addMessage, updateChatTitle,
} from "../services/firestore";
import { generateGeminiResponse } from "../services/gemini";

function AIChat() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToChats(user.uid, (data) => {
      setChats(data);
      if (!activeChatId && data.length > 0) setActiveChatId(data[0].id);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!activeChatId) { setMessages([]); return; }
    const unsub = subscribeToMessages(activeChatId, setMessages);
    return () => unsub();
  }, [activeChatId]);

  const handleCreateNewChat = async () => {
    const id = await createChat(user.uid, "New Chat");
    setActiveChatId(id);
  };

  const handleDeleteChat = async (chatId) => {
    await firestoreDeleteChat(chatId);
    if (activeChatId === chatId) {
      const remaining = chats.filter((c) => c.id !== chatId);
      if (remaining.length > 0) {
        setActiveChatId(remaining[0].id);
      } else {
        const id = await createChat(user.uid, "New Chat");
        setActiveChatId(id);
      }
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
      const aiText = await generateGeminiResponse(history);
      await addMessage(chatId, "assistant", aiText, null);
    } catch (err) {
      console.error("Gemini error:", err);
      await addMessage(chatId, "assistant", "Sorry, I encountered an error. Please try again.", null);
    } finally {
      setLoading(false);
    }
  }, [activeChatId, chats, messages, loading, user]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        handleCreateNewChat();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <div className="flex h-screen bg-[#0a0f1e] overflow-hidden">
      {sidebarOpen && (
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          setActiveChatId={setActiveChatId}
          createNewChat={handleCreateNewChat}
          deleteChat={handleDeleteChat}
          renameChat={handleRenameChat}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] shrink-0">
          <button
            onClick={() => setSidebarOpen((p) => !p)}
            className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="text-slate-300 text-sm font-medium truncate">
            {activeChat?.title || "New Chat"}
          </span>
          <span className="ml-auto text-slate-600 text-xs hidden sm:block">⌘K — New Chat</span>
        </div>

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

        <MessageInput value={input} setValue={setInput} onSend={handleSend} loading={loading} />
      </div>
    </div>
  );
}

export default AIChat;