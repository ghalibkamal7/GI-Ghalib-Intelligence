import { jsPDF } from "jspdf";

export function exportChatToPDF(chat) {
  const doc = new jsPDF();
  const margin = 15;
  const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
  let y = 20;

  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text("GI — Chat Export", margin, y); y += 8;
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Chat: ${chat.title || "Untitled"}`, margin, y); y += 6;
  doc.text(`Exported: ${new Date().toLocaleString()}`, margin, y); y += 12;

  (chat.messages || []).forEach((msg) => {
    const sender = msg.role === "user" ? "You" : "GI";
    doc.setFontSize(10);
    doc.setTextColor(99, 102, 241);
    doc.text(`${sender}:`, margin, y); y += 5;
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(msg.text || "", maxWidth);
    lines.forEach((line) => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(line, margin, y); y += 6;
    });
    y += 4;
  });

  doc.save(`GI-${chat.title || "chat"}.pdf`);
}

export function exportChatToText(chat) {
  const lines = (chat.messages || []).map((msg) =>
    `${msg.role === "user" ? "You" : "GI"}:\n${msg.text}\n`
  );
  const content = `GI Chat Export\nChat: ${chat.title}\nDate: ${new Date().toLocaleString()}\n\n${lines.join("\n")}`;
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `GI-${chat.title || "chat"}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}