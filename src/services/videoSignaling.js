import { db } from "../firebase";
import {
  doc, setDoc, updateDoc, onSnapshot, deleteDoc,
  arrayUnion, collection, getDoc,
} from "firebase/firestore";

// Firestore-based WebRTC signaling — no separate signaling server
// needed. For every PAIR of participants, exactly one deterministic
// document holds their offer/answer/ICE exchange. Whoever has the
// lexicographically smaller uid always initiates (the "offerer") —
// this simple rule means both sides never race to create an offer
// at the same time, with zero extra coordination messages.
function pairDocRef(roomCode, uidA, uidB) {
  const [a, b] = [uidA, uidB].sort();
  return doc(db, "studyRooms", roomCode, "signals", `${a}_${b}`);
}

export function isOfferer(myUid, theirUid) {
  return myUid < theirUid;
}

export async function ensurePairDoc(roomCode, uidA, uidB) {
  const ref = pairDocRef(roomCode, uidA, uidB);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { offer: null, answer: null, offererCandidates: [], answererCandidates: [] });
  }
  return ref;
}

export function subscribeToPair(roomCode, uidA, uidB, callback) {
  const ref = pairDocRef(roomCode, uidA, uidB);
  return onSnapshot(ref, (snap) => callback(snap.exists() ? snap.data() : null));
}

export async function writeOffer(roomCode, uidA, uidB, offer) {
  const ref = pairDocRef(roomCode, uidA, uidB);
  await updateDoc(ref, { offer: JSON.stringify(offer) });
}

export async function writeAnswer(roomCode, uidA, uidB, answer) {
  const ref = pairDocRef(roomCode, uidA, uidB);
  await updateDoc(ref, { answer: JSON.stringify(answer) });
}

export async function addIceCandidate(roomCode, uidA, uidB, candidate, fromOfferer) {
  const ref = pairDocRef(roomCode, uidA, uidB);
  const field = fromOfferer ? "offererCandidates" : "answererCandidates";
  await updateDoc(ref, { [field]: arrayUnion(JSON.stringify(candidate)) });
}

export async function clearPair(roomCode, uidA, uidB) {
  const ref = pairDocRef(roomCode, uidA, uidB);
  try { await deleteDoc(ref); } catch { /* already gone */ }
}