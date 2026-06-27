import { jsPDF } from "jspdf";

export const exportChatToPDF = (chat) => {
  const doc = new jsPDF();

  let y = 10;

  doc.setFontSize(12);
  doc.text("GI Chat Export", 10, y);
  y += 10;

  chat.messages.forEach((msg) => {
    const sender = msg.role === "user" ? "You" : "GI";
    const text = `${sender}: ${msg.text}`;

    const lines = doc.splitTextToSize(text, 180);

    doc.text(lines, 10, y);
    y += lines.length * 7;

    if (y > 280) {
      doc.addPage();
      y = 10;
    }
  });

  doc.save(`${chat.title || "chat"}.pdf`);
};