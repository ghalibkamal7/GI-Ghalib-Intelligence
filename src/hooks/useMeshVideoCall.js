import { useRef, useState, useCallback, useEffect } from "react";
import {
  ensurePairDoc, subscribeToPair, writeOffer, writeAnswer,
  addIceCandidate, clearPair, isOfferer,
} from "../services/videoSignaling";

// Google's public STUN servers — free, no account needed. STUN helps
// peers discover their own public address; it does NOT relay media,
// so this alone won't work on every network (see the honesty note
// below). A TURN server (relay fallback) would fix that but requires
// a paid service — flagged clearly rather than silently degraded.
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

/**
 * Manages one WebRTC connection PER other participant in the room —
 * a full mesh. Each peer connection is independent: video toggling,
 * connection state, and remote streams are tracked per-uid so the UI
 * can render a proper multi-person grid.
 */
export function useMeshVideoCall({ roomCode, myUid, participantUids, enabled }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { uid: MediaStream }
  const [connectionState, setConnectionState] = useState({}); // { uid: "connecting"|"connected"|"failed" }
  const [cameraError, setCameraError] = useState("");
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  const peersRef = useRef({}); // { uid: RTCPeerConnection }
  const unsubsRef = useRef({}); // { uid: unsubscribeFn }
  const localStreamRef = useRef(null);

  const cleanupPeer = useCallback((uid) => {
    peersRef.current[uid]?.close();
    delete peersRef.current[uid];
    unsubsRef.current[uid]?.();
    delete unsubsRef.current[uid];
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[uid];
      return next;
    });
    setConnectionState((prev) => {
      const next = { ...prev };
      delete next[uid];
      return next;
    });
  }, []);

  const connectToPeer = useCallback(async (theirUid) => {
    if (!localStreamRef.current || peersRef.current[theirUid]) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current[theirUid] = pc;
    setConnectionState((prev) => ({ ...prev, [theirUid]: "connecting" }));

    localStreamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });

    pc.ontrack = (event) => {
      setRemoteStreams((prev) => ({ ...prev, [theirUid]: event.streams[0] }));
    };

    pc.onconnectionstatechange = () => {
      setConnectionState((prev) => ({ ...prev, [theirUid]: pc.connectionState }));
    };

    const amOfferer = isOfferer(myUid, theirUid);
    await ensurePairDoc(roomCode, myUid, theirUid);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addIceCandidate(roomCode, myUid, theirUid, event.candidate, amOfferer);
      }
    };

    const seenAnswererCandidates = new Set();
    const seenOffererCandidates = new Set();

    const unsub = subscribeToPair(roomCode, myUid, theirUid, async (data) => {
      if (!data || !peersRef.current[theirUid]) return;
      const pcNow = peersRef.current[theirUid];

      try {
        if (amOfferer) {
          if (data.answer && !pcNow.currentRemoteDescription) {
            await pcNow.setRemoteDescription(JSON.parse(data.answer));
          }
          for (const raw of data.answererCandidates || []) {
            if (!seenAnswererCandidates.has(raw)) {
              seenAnswererCandidates.add(raw);
              if (pcNow.remoteDescription) await pcNow.addIceCandidate(JSON.parse(raw));
            }
          }
        } else {
          if (data.offer && !pcNow.currentRemoteDescription) {
            await pcNow.setRemoteDescription(JSON.parse(data.offer));
            const answer = await pcNow.createAnswer();
            await pcNow.setLocalDescription(answer);
            await writeAnswer(roomCode, myUid, theirUid, answer);
          }
          for (const raw of data.offererCandidates || []) {
            if (!seenOffererCandidates.has(raw)) {
              seenOffererCandidates.add(raw);
              if (pcNow.remoteDescription) await pcNow.addIceCandidate(JSON.parse(raw));
            }
          }
        }
      } catch (err) {
        console.error("Signaling error with peer", theirUid, err);
      }
    });
    unsubsRef.current[theirUid] = unsub;

    if (amOfferer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await writeOffer(roomCode, myUid, theirUid, offer);
    }
  }, [roomCode, myUid]);

  // Acquire the local camera/mic once video calling is enabled.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch (err) {
        setCameraError(
          err?.name === "NotAllowedError"
            ? "Camera/microphone permission was denied."
            : "Couldn't access your camera or microphone."
        );
      }
    })();
    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    };
  }, [enabled]);

  // Connect to every OTHER participant currently in the room, and
  // tear down connections to anyone who's left.
  useEffect(() => {
    if (!enabled || !localStream) return;
    const others = participantUids.filter((uid) => uid !== myUid);

    others.forEach((uid) => { if (!peersRef.current[uid]) connectToPeer(uid); });

    Object.keys(peersRef.current).forEach((uid) => {
      if (!others.includes(uid)) {
        cleanupPeer(uid);
        clearPair(roomCode, myUid, uid);
      }
    });
  }, [enabled, localStream, participantUids, myUid, connectToPeer, cleanupPeer, roomCode]);

  // Full cleanup when video calling is turned off or the component unmounts.
  useEffect(() => {
    if (enabled) return;
    Object.keys(peersRef.current).forEach((uid) => {
      cleanupPeer(uid);
      clearPair(roomCode, myUid, uid);
    });
  }, [enabled, cleanupPeer, roomCode, myUid]);

  useEffect(() => {
    return () => {
      Object.keys(peersRef.current).forEach(cleanupPeer);
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const next = !camOn;
    localStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = next; });
    setCamOn(next);
  }, [camOn]);

  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return;
    const next = !micOn;
    localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = next; });
    setMicOn(next);
  }, [micOn]);

  return { localStream, remoteStreams, connectionState, cameraError, camOn, micOn, toggleCamera, toggleMic };
}