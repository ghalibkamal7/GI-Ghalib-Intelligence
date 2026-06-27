function ChatMessage({ sender, text }) {
  return (
    <div
      className={
        sender === "user"
          ? "message user-message"
          : "message gi-message"
      }
    >
      {sender === "gi" && (
        <div className="gi-avatar">GI</div>
      )}

      <div className="message-text">
        {text}
      </div>
    </div>
  );
}

export default ChatMessage;