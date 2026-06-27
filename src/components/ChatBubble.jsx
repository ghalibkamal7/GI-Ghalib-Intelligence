function ChatBubble({ sender, text }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: sender === "user" ? "flex-end" : "flex-start",
        padding: "6px 10px",
      }}
    >
      <div
        style={{
          maxWidth: "70%",
          padding: "12px 14px",
          borderRadius: "12px",
          backgroundColor: sender === "user" ? "#d1e7ff" : "#f1f1f1",
          color: "#000",
          whiteSpace: "pre-wrap",
          lineHeight: "1.5",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

export default ChatBubble;