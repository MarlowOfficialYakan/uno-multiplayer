const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const { RoomManager } = require("./rooms");
const { GameError } = require("./game");

const PORT = process.env.PORT || 3001;
// Comma-separated list of allowed frontend origins, e.g.
// "https://your-app.vercel.app,http://localhost:5173"
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const MIN_PLAYERS = 2;
const MAX_PLAYERS_CAP = 10; // hard ceiling — host cannot exceed this
const MAX_CHAT_LEN = 200;

const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.get("/", (_req, res) => res.send("UNO multiplayer server is running."));
app.get("/health", (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ["GET", "POST"] },
});

const rooms = new RoomManager();

// Maps a persistent player identity (clientId, generated & stored in the
// browser's localStorage) to whichever socket.id they're CURRENTLY
// connected with. This is what makes reconnect-after-refresh possible:
// the player's seat in the room/game is keyed by clientId, not socket.id.
const clientToSocket = new Map(); // clientId -> socket.id

// ---------- security helpers ----------

// Simple per-socket token-bucket rate limiter to blunt spam / DoS abuse.
const buckets = new Map(); // socket.id -> { tokens, last }
const RATE_CAPACITY = 20; // max burst
const RATE_REFILL_PER_SEC = 10;

function allowEvent(socketId) {
  const now = Date.now();
  let b = buckets.get(socketId);
  if (!b) {
    b = { tokens: RATE_CAPACITY, last: now };
    buckets.set(socketId, b);
  }
  const elapsed = (now - b.last) / 1000;
  b.tokens = Math.min(RATE_CAPACITY, b.tokens + elapsed * RATE_REFILL_PER_SEC);
  b.last = now;
  if (b.tokens < 1) return false;
  b.tokens -= 1;
  return true;
}

function sanitizeName(raw) {
  const name = String(raw ?? "").trim().slice(0, 16);
  return name.length > 0 ? name.replace(/[<>]/g, "") : "Player";
}

function sanitizeCode(raw) {
  return String(raw ?? "").trim().toUpperCase().slice(0, 8);
}

// A clientId must look like a UUID-ish token we generated client-side —
// reject anything else so someone can't pass junk/huge strings as an "id".
function sanitizeClientId(raw) {
  const id = String(raw ?? "").trim().slice(0, 64);
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(id)) throw new GameError("ID sesi tidak valid.");
  return id;
}

function sanitizeChat(raw) {
  return String(raw ?? "").trim().slice(0, MAX_CHAT_LEN).replace(/[<>]/g, "");
}

function guarded(socket, handler) {
  return (payload, ack) => {
    try {
      if (!allowEvent(socket.id)) {
        if (typeof ack === "function") ack({ ok: false, error: "Terlalu banyak permintaan, pelan-pelan." });
        return;
      }
      handler(payload || {}, ack);
    } catch (err) {
      const message = err instanceof GameError || err.message ? err.message : "Terjadi kesalahan.";
      if (typeof ack === "function") ack({ ok: false, error: message });
      else socket.emit("error_message", message);
    }
  };
}

function broadcastRoom(room) {
  io.to(room.code).emit("room_update", publicRoom(room));
  if (room.game) {
    io.to(room.code).emit("game_update", room.game.publicState());
    for (const p of room.players) {
      const sid = clientToSocket.get(p.id);
      if (p.connected && sid) io.to(sid).emit("your_hand", room.game.handFor(p.id));
    }
  }
}

function publicRoom(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    maxPlayers: room.maxPlayers,
    status: room.status,
    players: room.players.map((p) => ({ id: p.id, name: p.name, connected: p.connected })),
  };
}

// ---------- socket handlers ----------

io.on("connection", (socket) => {
  socket.data.roomCode = null;
  socket.data.clientId = null;

  socket.on(
    "create_room",
    guarded(socket, (payload, ack) => {
      const name = sanitizeName(payload.name);
      const clientId = sanitizeClientId(payload.clientId);
      let maxPlayers = parseInt(payload.maxPlayers, 10);
      if (!Number.isFinite(maxPlayers)) maxPlayers = 4;
      maxPlayers = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS_CAP, maxPlayers));

      const room = rooms.createRoom(clientId, name, maxPlayers);
      socket.join(room.code);
      socket.data.roomCode = room.code;
      socket.data.clientId = clientId;
      clientToSocket.set(clientId, socket.id);
      ack?.({ ok: true, room: publicRoom(room), clientId });
      broadcastRoom(room);
    })
  );

  socket.on(
    "join_room",
    guarded(socket, (payload, ack) => {
      const code = sanitizeCode(payload.code);
      const name = sanitizeName(payload.name);
      const clientId = sanitizeClientId(payload.clientId);
      const room = rooms.joinRoom(code, clientId, name);
      socket.join(room.code);
      socket.data.roomCode = room.code;
      socket.data.clientId = clientId;
      clientToSocket.set(clientId, socket.id);
      ack?.({ ok: true, room: publicRoom(room), clientId });
      broadcastRoom(room);
    })
  );

  // Called automatically by the client on load if it has a saved
  // {roomCode, clientId} from a previous session (e.g. after a refresh or
  // a dropped connection). Restores their seat if the grace period hasn't
  // expired yet.
  socket.on(
    "rejoin_room",
    guarded(socket, (payload, ack) => {
      const code = sanitizeCode(payload.code);
      const clientId = sanitizeClientId(payload.clientId);
      const room = rooms.rejoinRoom(code, clientId);
      if (!room) {
        ack?.({ ok: false, error: "Sesi sudah berakhir, silakan gabung ulang." });
        return;
      }
      socket.join(room.code);
      socket.data.roomCode = room.code;
      socket.data.clientId = clientId;
      clientToSocket.set(clientId, socket.id);
      const hand = room.game ? room.game.handFor(clientId) : [];
      ack?.({ ok: true, room: publicRoom(room), clientId, hand, game: room.game?.publicState() ?? null });
      broadcastRoom(room);
    })
  );

  socket.on(
    "start_game",
    guarded(socket, (_payload, ack) => {
      const code = socket.data.roomCode;
      const room = rooms.startGame(code, socket.data.clientId);
      ack?.({ ok: true });
      broadcastRoom(room);
    })
  );

  socket.on(
    "play_card",
    guarded(socket, (payload, ack) => {
      const room = rooms.getRoom(socket.data.roomCode);
      if (!room?.game) throw new GameError("Game belum dimulai.");
      const cardId = String(payload.cardId ?? "");
      const chosenColor = payload.chosenColor ? String(payload.chosenColor) : null;
      const result = room.game.playCard(socket.data.clientId, cardId, chosenColor);
      if (result.finished) room.status = "finished";
      ack?.({ ok: true });
      broadcastRoom(room);
    })
  );

  socket.on(
    "draw_card",
    guarded(socket, (_payload, ack) => {
      const room = rooms.getRoom(socket.data.roomCode);
      if (!room?.game) throw new GameError("Game belum dimulai.");
      room.game.drawCard(socket.data.clientId);
      ack?.({ ok: true });
      broadcastRoom(room);
    })
  );

  socket.on(
    "call_uno",
    guarded(socket, (_payload, ack) => {
      const room = rooms.getRoom(socket.data.roomCode);
      if (!room?.game) throw new GameError("Game belum dimulai.");
      const ok = room.game.callUno(socket.data.clientId);
      ack?.({ ok });
      broadcastRoom(room);
    })
  );

  socket.on(
    "catch_uno",
    guarded(socket, (payload, ack) => {
      const room = rooms.getRoom(socket.data.roomCode);
      if (!room?.game) throw new GameError("Game belum dimulai.");
      const targetId = String(payload.targetId ?? "");
      room.game.catchUno(socket.data.clientId, targetId);
      ack?.({ ok: true });
      broadcastRoom(room);
    })
  );

  socket.on(
    "chat_message",
    guarded(socket, (payload, ack) => {
      const room = rooms.getRoom(socket.data.roomCode);
      if (!room) throw new GameError("Kamu belum ada di room.");
      const text = sanitizeChat(payload.text);
      if (!text) return;
      const sender = room.players.find((p) => p.id === socket.data.clientId);
      io.to(room.code).emit("chat_message", {
        name: sender?.name ?? "Player",
        text,
        ts: Date.now(),
      });
      ack?.({ ok: true });
    })
  );

  socket.on("disconnect", () => {
    buckets.delete(socket.id);
    const code = socket.data.roomCode;
    const clientId = socket.data.clientId;
    if (!code || !clientId) return;
    // Only clear the socket mapping if this socket is still the "current"
    // one for that clientId (a fast refresh may have already reconnected
    // with a new socket before the old one's disconnect event fires).
    if (clientToSocket.get(clientId) === socket.id) clientToSocket.delete(clientId);

    const room = rooms.handleDisconnect(code, clientId, (updatedRoom) => broadcastRoom(updatedRoom));
    if (room) broadcastRoom(room);
  });
});

server.listen(PORT, () => {
  console.log(`UNO server listening on port ${PORT}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
});
