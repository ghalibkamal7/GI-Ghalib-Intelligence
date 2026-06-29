import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, orderBy, onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export function subscribeToChats(userId, callback) {
  const q = query(
    collection(db, "chats"),
    where("userId", "==", userId),
    orderBy("updatedAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function createChat(userId, title = "New Chat") {
  const ref = await addDoc(collection(db, "chats"), {
    userId, title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function renameChat(chatId, title) {
  await updateDoc(doc(db, "chats", chatId), { title, updatedAt: serverTimestamp() });
}

export async function deleteChat(chatId) {
  await deleteDoc(doc(db, "chats", chatId));
}

export function subscribeToMessages(chatId, callback) {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function addMessage(chatId, role, text, image = null) {
  const ref = await addDoc(collection(db, "chats", chatId, "messages"), {
    role, text, image, createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateMessage(chatId, messageId, text) {
  await updateDoc(doc(db, "chats", chatId, "messages", messageId), { text });
}

export async function updateChatTitle(chatId, title) {
  await updateDoc(doc(db, "chats", chatId), { title, updatedAt: serverTimestamp() });
}