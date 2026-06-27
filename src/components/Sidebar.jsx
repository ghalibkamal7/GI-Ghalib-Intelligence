import { exportChatToPDF } from "../utils/exportChat";

function Sidebar({
  chats,
  activeChatId,
  setActiveChatId,
  createNewChat,
  deleteChat,
}) {
  return (
    <div style={{ width: "280px", background: "#111", color: "#fff" }}>
      <button onClick={createNewChat}>+ New Chat</button>

      {chats.map((chat) => (
        <div
          key={chat.id}
          style={{
            padding: "10px",
            background: chat.id === activeChatId ? "#333" : "transparent",
            cursor: "pointer",
          }}
          onClick={() => setActiveChatId(chat.id)}
        >
          <span>{chat.title}</span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              exportChatToPDF(chat);
            }}
          >
            ⬇
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteChat(chat.id);
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export default Sidebar;