import { useState } from "react";

function MessageInput({ value, setValue, onSend, loading }) {
  const [image, setImage] = useState(null);

  const handleImage = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const handleSend = () => {
    if (!value.trim() && !image) return;

    onSend({
      text: value,
      image: image,
    });

    setValue("");
    setImage(null);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        padding: "15px",
        borderTop: "1px solid #ddd",
        alignItems: "center",
      }}
    >
      {/* TEXT INPUT */}
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask GI anything..."
        style={{
          flex: 1,
          padding: "12px",
          borderRadius: "10px",
          border: "1px solid #ccc",
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSend();
        }}
        disabled={loading}
      />

      {/* IMAGE UPLOAD */}
      <input type="file" accept="image/*" onChange={handleImage} />

      {/* SEND BUTTON */}
      <button
        onClick={handleSend}
        disabled={loading}
        style={{
          padding: "10px 14px",
          borderRadius: "10px",
          background: "#000",
          color: "#fff",
          border: "none",
        }}
      >
        Send
      </button>
    </div>
  );
}

export default MessageInput;