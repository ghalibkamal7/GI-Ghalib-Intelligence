import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Download, MessageSquare, PenLine, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { exportChatToPDF, exportChatToText } from "../utils/exportChat";

function Sidebar({ chats, activeChatId, setActiveChatId, createNewChat, deleteChat, renameChat }) {
  const { user, logout } = useAuth();
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [exportMenuId, setExportMenuId] = useState(null);

  const startRename = (chat, e) => {
    e.stopPropagation();
    setRenamingId(chat.id);
    setRenameValue(chat.title);
  };

  const commitRename = (chatId) => {
    if (renameValue.trim()) renameChat(chatId, renameValue.trim());
    setRenamingId(null);
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-[280px] min-h-screen flex flex-col bg-[#0d1117] border-r border-white/[0.07]"
    >
      <div className="p-5 border-b border-white/[0.07]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm glow">
            GI
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Ghalib Intelligence</p>
            <p className="text-slate-500 text-xs">Powered by Gemini</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={createNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors duration-200 cursor-pointer"
        >
          <Plus size={16} /> New Chat
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        <p className="text-slate-600 text-xs uppercase tracking-widest px-2 pb-2">Recent Chats</p>
        <AnimatePresence>
          {chats.map((chat) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                chat.id === activeChatId
                  ? "bg-indigo-600/20 border border-indigo-500/30"
                  : "hover:bg-white/[0.04] border border-transparent"
              }`}
              onClick={() => setActiveChatId(chat.id)}
            >
              <MessageSquare size={14} className={chat.id === activeChatId ? "text-indigo-400 shrink-0" : "text-slate-600 shrink-0"} />

              {renamingId === chat.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => commitRename(chat.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(chat.id);
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-white/10 rounded-lg px-2 py-0.5 text-white text-sm outline-none border border-indigo-500/50 min-w-0"
                />
              ) : (
                <span className={`flex-1 text-sm truncate ${chat.id === activeChatId ? "text-white" : "text-slate-400"}`}>
                  {chat.title}
                </span>
              )}

              <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                <button onClick={(e) => startRename(chat, e)} className="p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors" title="Rename">
                  <PenLine size={12} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setExportMenuId(exportMenuId === chat.id ? null : chat.id); }} className="p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors" title="Export">
                  <Download size={12} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }} className="p-1 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors" title="Delete">
                  <Trash2 size={12} />
                </button>
              </div>

              <AnimatePresence>
                {exportMenuId === chat.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-2 top-10 z-50 glass rounded-xl shadow-xl border border-white/10 overflow-hidden min-w-[130px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button onClick={() => { exportChatToPDF(chat); setExportMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10 transition-colors">
                      📄 Export PDF
                    </button>
                    <button onClick={() => { exportChatToText(chat); setExportMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10 transition-colors">
                      📝 Export TXT
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {chats.length === 0 && (
          <div className="text-center py-10 text-slate-600 text-sm">
            <MessageSquare size={28} className="mx-auto mb-2 opacity-40" />
            <p>No chats yet</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/[0.07]">
        <div className="flex items-center gap-3">
          <img src={user?.photoURL} alt={user?.displayName} className="w-8 h-8 rounded-full border border-white/20 object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.displayName}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
          </div>
          <button onClick={logout} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors" title="Logout">
            <X size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default Sidebar;