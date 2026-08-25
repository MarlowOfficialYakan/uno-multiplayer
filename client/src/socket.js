import { io } from "socket.io-client";

// Set VITE_SERVER_URL in Vercel project env vars to your deployed
// server's URL, e.g. https://uno-server.onrender.com
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

export const socket = io(SERVER_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
});

// Promise-wrapper around socket.emit with ack, so components can await it.
export function emitAsync(event, payload) {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (res) => {
      if (res && res.ok === false) reject(new Error(res.error || "Gagal."));
      else resolve(res);
    });
  });
}

// A persistent per-browser identity, independent of socket.id (which
// changes on every reconnect). This is what lets a player refresh the page
// or briefly lose connection and come back to the same seat/hand.
const CLIENT_ID_KEY = "uno_client_id";
const SESSION_KEY = "uno_session"; // { code, clientId } of the room they're in

export function getClientId() {
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

export function saveSession(code) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ code, clientId: getClientId() }));
}

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
