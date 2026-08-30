import { db } from "../firebase";
import {
  doc, setDoc, updateDoc, onSnapshot, serverTimestamp,
  arrayUnion, arrayRemove, deleteDoc, getDoc, Timestamp,
} from "firebase/firestore";

// 6-character room codes — easy to read aloud/type, avoids visually
// ambiguous characters (0/O, 1/I/l).
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateRoomCode() {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export async function createStudyRoom(user) {
  const code = generateRoomCode();
  const roomRef = doc(db, "studyRooms", code);
  await setDoc(roomRef, {
    hostId: user.uid,
    createdAt: serverTimestamp(),
    timer: { running: false, endsAt: null, durationMinutes: 25, label: "Focus" },
    participants: [{
      uid: user.uid,
      name: user.displayName || "Student",
      photoURL: user.photoURL || "",
      lastSeen: Timestamp.now(),
    }],
  });
  return code;
}

export async function joinStudyRoom(code, user) {
  const roomRef = doc(db, "studyRooms", code.toUpperCase());
  const snap = await getDoc(roomRef);
  if (!snap.exists()) throw new Error("Room not found — check the code and try again.");

  const data = snap.data();
  const already = data.participants?.some((p) => p.uid === user.uid);
  if (!already) {
    if ((data.participants?.length || 0) >= 6) {
      throw new Error("This room is full (max 6 people).");
    }
    await updateDoc(roomRef, {
      participants: arrayUnion({
        uid: user.uid,
        name: user.displayName || "Student",
        photoURL: user.photoURL || "",
        lastSeen: Timestamp.now(),
      }),
    });
  }
  return code.toUpperCase();
}

export async function leaveStudyRoom(code, user) {
  const roomRef = doc(db, "studyRooms", code);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const me = data.participants?.find((p) => p.uid === user.uid);
  if (me) await updateDoc(roomRef, { participants: arrayRemove(me) });

  // If the room is now empty, clean it up rather than leaving orphaned
  // documents in Firestore forever.
  const after = await getDoc(roomRef);
  if (after.exists() && (after.data().participants?.length || 0) === 0) {
    await deleteDoc(roomRef);
  }
}

export function subscribeToRoom(code, callback) {
  const roomRef = doc(db, "studyRooms", code);
  return onSnapshot(roomRef, (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

// A lightweight heartbeat — updates just this user's lastSeen so
// everyone else can tell who's actually still around vs. who closed
// the tab without formally leaving. One small write every 20s per
// active participant, not per-second — cheap on Firestore quota.
export async function sendHeartbeat(code, user) {
  const roomRef = doc(db, "studyRooms", code);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;
  const participants = snap.data().participants || [];
  const updated = participants.map((p) =>
    p.uid === user.uid ? { ...p, lastSeen: Timestamp.now() } : p
  );
  await updateDoc(roomRef, { participants: updated });
}

// Timer control — only ONE write per action (start/pause/reset), not
// per second. Every participant's client computes the countdown
// locally from `endsAt`, so this scales fine regardless of how many
// people are in the room or how long the session runs.
export async function setRoomTimer(code, { running, durationMinutes, label }) {
  const roomRef = doc(db, "studyRooms", code);
  const endsAt = running
    ? Timestamp.fromMillis(Date.now() + durationMinutes * 60 * 1000)
    : null;
  await updateDoc(roomRef, {
    timer: { running, endsAt, durationMinutes, label: label || "Focus" },
  });
}