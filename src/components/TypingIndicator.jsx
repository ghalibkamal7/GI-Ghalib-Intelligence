function TypingIndicator() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "10px 14px",
        borderRadius: "12px",
        background: "#f2f2f2",
        width: "fit-content",
        marginLeft: "10px",
      }}
    >
      <span>GI is thinking</span>

      <div style={{ display: "flex", gap: "4px" }}>
        <span className="dot">.</span>
        <span className="dot">.</span>
        <span className="dot">.</span>
      </div>

      <style>
        {`
          .dot {
            animation: blink 1.4s infinite;
            font-size: 20px;
            line-height: 0;
          }

          .dot:nth-child(2) {
            animation-delay: 0.2s;
          }

          .dot:nth-child(3) {
            animation-delay: 0.4s;
          }

          @keyframes blink {
            0% { opacity: 0.2; transform: translateY(0px); }
            50% { opacity: 1; transform: translateY(-2px); }
            100% { opacity: 0.2; transform: translateY(0px); }
          }
        `}
      </style>
    </div>
  );
}

export default TypingIndicator;