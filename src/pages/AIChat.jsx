import { useEffect, useState } from "react";
import Header from "../components/Header";
import ChatHistory from "../components/ChatHistory";
import MessageInput from "../components/MessageInput";
import QuickActions from "../components/QuickActions";
import FocusCard from "../components/FocusCard";
import Sidebar from "../components/Sidebar";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

function AIChat() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const activeChat = chats.find((c) => c.id === activeChatId);

  useEffect(() => {
    const saved = localStorage.getItem("gi_chats");

    if (saved) {
      const data = JSON.parse(saved);
      setChats(data);
      setActiveChatId(data[0]?.id || null);
    } else {
      const first = {
        id: Date.now(),
        title: "New Chat",
        messages: [],
      };

      setChats([first]);
      setActiveChatId(first.id);
    }
  }, []);

  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem("gi_chats", JSON.stringify(chats));
    }
  }, [chats]);

  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "New Chat",
      messages: [],
    };

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  const deleteChat = (id) => {
    const filtered = chats.filter((c) => c.id !== id);
    setChats(filtered);

    if (filtered.length > 0) {
      setActiveChatId(filtered[0].id);
    } else {
      createNewChat();
    }
  };

  const updateChatMessages = (chatId, newMessages) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: newMessages,
              title:
                chat.title === "New Chat" && newMessages.length > 0
                  ? newMessages[0].text?.slice(0, 25) || "Chat"
                  : chat.title,
            }
          : chat
      )
    );
  };

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  // 🔥 FULL IMAGE + TEXT SUPPORT + STREAMING
  const generateResponse = async (updatedMessages) => {
    try {
      setLoading(true);

      const formatted = updatedMessages.map((msg) => {
        if (msg.image) {
          return {
            role: msg.role === "user" ? "user" : "model",
            parts: [
              { text: msg.text || "Analyze this image" },
              {
                inline_data: {
                  mime_type: "image/png",
                  data: msg.image.split(",")[1],
                },
              },
            ],
          };
        }

        return {
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        };
      });

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: formatted }),
        }
      );

      const data = await res.json();

      const aiText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response from AI";

      let streamed = "";

      const baseMessages = [
        ...updatedMessages,
        {
          role: "assistant",
          text: "",
        },
      ];

      for (let i = 0; i < aiText.length; i++) {
        streamed += aiText[i];

        const temp = [...baseMessages];
        temp[temp.length - 1].text = streamed;

        updateChatMessages(activeChatId, temp);

        await delay(8);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (data) => {
    if (!data) return;

    const newMessages = [
      ...(activeChat?.messages || []),
      {
        role: "user",
        text: data.text || "",
        image: data.image || null,
      },
    ];

    setInput("");
    updateChatMessages(activeChatId, newMessages);

    generateResponse(newMessages);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning 👋";
    if (h < 18) return "Good Afternoon ☀️";
    return "Good Evening 🌙";
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
        createNewChat={createNewChat}
        deleteChat={deleteChat}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Header greeting={getGreeting()} />

        <FocusCard />

        <QuickActions onAction={(t) => handleSend({ text: t })} />

        <ChatHistory
          messages={activeChat?.messages || []}
          loading={loading}
        />

        <MessageInput
          value={input}
          setValue={setInput}
          onSend={handleSend}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default AIChat;