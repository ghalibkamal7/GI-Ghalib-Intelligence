import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Copy, LogOut, Play, Pause, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  createStudyRoom, joinStudyRoom, leaveStudyRoom,
  subscribeToRoom, sendHeartbeat, setRoomTimer,
} from "../services/studyRoom";

const ONLINE_WINDOW_MS = 40000; // participant counts as online if seen in the last 40s

function StudyRoom({ isOpen, onClose }) {
  const { user } = useAuth();
  const [roomCode, setRoomCode] = useState(null);
  const [joinInput, setJoinInput] = useState("");
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());
  const heartbeatRef = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setRoomCode(null);
      setRoom(null);
      setError("");
      setJoinInput("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!roomCode) return;
    const unsub = subscribeToRoom(roomCode, setRoom);
    return unsub;
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode || !user) return;
    sendHeartbeat(roomCode, user);
    heartbeatRef.current = setInterval(() => sendHeartbeat(roomCode, user), 20000);
    return () => clearInterval(heartbeatRef.current);
  }, [roomCode, user]);

  useEffect(() => {
    if (!room?.timer?.running) return;
    tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tickRef.current);
  }, [room?.timer?.running]);

  const handleCreate = async () => {
    setBusy(true);
    setError("");
    try {
      const code = await createStudyRoom(user);
      setRoomCode(code);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    if (!joinInput.trim()) return;
    setBusy(true);
    setError("");
    try {
      const code = await joinStudyRoom(joinInput.trim(), user);
      setRoomCode(code);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    if (roomCode) await leaveStudyRoom(roomCode, user);
    setRoomCode(null);
    setRoom(null);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleTimer = () => {
    if (!room) return;
    setRoomTimer(roomCode, {
      running: !room.timer.running,
      durationMinutes: room.timer.durationMinutes,
      label: room.timer.label,
    });
  };

  const isHost = room?.hostId === user?.uid;
  const onlineCount = room?.participants?.filter(
    (p) => now - (p.lastSeen?.toMillis?.() || 0) < ONLINE_WINDOW_MS
  ).length || 0;

  const secondsLeft = room?.timer?.running && room.timer.endsAt
    ? Math.max(0, Math.round((room.timer.endsAt.toMillis() - now) / 1000))
    : room?.timer?.durationMinutes * 60 || 0;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        role="dialog" aria-modal="true" aria-label="Study Together"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong rounded-3xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">

          <div className="flex items-center justify-between p-6 border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-indigo-400" />
              <div>
                <h3 className="text-white font-bold text-lg">Study Together</h3>
                <p className="text-slate-500 text-xs mt-0.5">Focus with a friend, in real time</p>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close"
              className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {!roomCode ? (
              <div>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={handleCreate} disabled={busy}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm transition-colors mb-5">
                  {busy ? "Creating..." : "Create a Room"}
                </motion.button>

                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-slate-600 text-xs">OR</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <label className="text-slate-500 text-xs block mb-2">Join with a code</label>
                <div className="flex gap-2">
                  <input value={joinInput} onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    placeholder="e.g. AB3XQ7" maxLength={6}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50 tracking-widest font-mono" />
                  <button onClick={handleJoin} disabled={busy || !joinInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-40 text-white text-sm font-medium transition-colors">
                    Join
                  </button>
                </div>

                {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-5 px-4 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                  <div>
                    <p className="text-slate-500 text-xs">Room code</p>
                    <p className="text-white font-bold text-2xl font-mono tracking-widest">{roomCode}</p>
                  </div>
                  <button onClick={copyCode}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors">
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">
                  {onlineCount} online
                </p>
                <div className="space-y-2 mb-6">
                  {room?.participants?.map((p) => {
                    const online = now - (p.lastSeen?.toMillis?.() || 0) < ONLINE_WINDOW_MS;
                    return (
                      <div key={p.uid} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="relative shrink-0">
                          {p.photoURL ? (
                            <img src={p.photoURL} alt={p.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                              {p.name?.[0] || "?"}
                            </div>
                          )}
                          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0d1117] ${online ? "bg-emerald-400" : "bg-slate-600"}`} />
                        </div>
                        <span className="text-slate-300 text-sm truncate">{p.name}{p.uid === room.hostId ? " (host)" : ""}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center mb-6">
                  <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">
                    Shared {room?.timer?.label || "Focus"} Timer
                  </p>
                  <p className="text-white font-bold text-4xl font-mono tabular-nums mb-4">{mm}:{ss}</p>
                  {isHost ? (
                    <button onClick={toggleTimer}
                      className={`flex items-center gap-2 mx-auto px-6 py-2.5 rounded-2xl text-white text-sm font-medium transition-colors ${
                        room?.timer?.running ? "bg-red-500/80 hover:bg-red-500" : "bg-indigo-600 hover:bg-indigo-500"
                      }`}>
                      {room?.timer?.running ? <><Pause size={15} /> Pause for everyone</> : <><Play size={15} /> Start for everyone</>}
                    </button>
                  ) : (
                    <p className="text-slate-600 text-xs">Only the host can control the timer</p>
                  )}
                </div>

                <button onClick={handleLeave}
                  className="flex items-center gap-2 mx-auto text-red-400 hover:text-red-300 text-xs transition-colors">
                  <LogOut size={13} /> Leave Room
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default StudyRoom;