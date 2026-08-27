import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { socket, emitAsync, getClientId, saveSession, loadSession, clearSession } from "./socket";
import TableBackground from "./components/table/TableBackground";
import GameTable from "./components/table/GameTable";

function ChatPanel({ messages, onSend }) {
  const [text, setText] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  };

  return (
    <div className="w-full max-w-xs bg-black/30 backdrop-blur rounded-2xl border border-white/10 p-2 flex flex-col gap-2">
      <div className="max-h-28 overflow-y-auto flex flex-col gap-1 text-xs font-body text-left px-1">
        {messages.map((m, i) => (
          <div key={i} className="break-words">
            <b className="text-uno-yellow">{m.name}:</b> {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-uno-yellow font-body"
          placeholder="Ketik pesan..."
          value={text}
          maxLength={200}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          onClick={send}
          className="px-3 py-1.5 rounded-full bg-uno-blue text-white text-sm font-bold shadow-glow-blue shrink-0"
        >
          Kirim
        </button>
      </div>
    </div>
  );
}

function ChatToggle({ messages, onSend }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
          >
            <ChatPanel messages={messages} onSend={onSend} />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((o) => !o)}
        className="w-11 h-11 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white flex items-center justify-center shadow-lg text-lg"
      >
        💬
      </motion.button>
    </div>
  );
}

export default function App() {
  const [connected, setConnected] = useState(socket.connected);
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [room, setRoom] = useState(null);
  const [game, setGame] = useState(null);
  const [hand, setHand] = useState([]);
  const [error, setError] = useState("");
  const [pendingWild, setPendingWild] = useState(null);
  const [messages, setMessages] = useState([]);
  const [rejoining, setRejoining] = useState(true);

  const myId = getClientId();

  // Try to silently restore a previous session (refresh / dropped connection)
  const tryRejoin = useCallback(async () => {
    const session = loadSession();
    if (!session) {
      setRejoining(false);
      return;
    }
    try {
      const res = await emitAsync("rejoin_room", { code: session.code, clientId: session.clientId });
      setRoom(res.room);
      if (res.game) setGame(res.game);
      if (res.hand) setHand(res.hand);
    } catch {
      clearSession();
    } finally {
      setRejoining(false);
    }
  }, []);

  useEffect(() => {
    const onConnect = () => {
      setConnected(true);
      tryRejoin();
    };
    const onDisconnect = () => setConnected(false);
    const onRoomUpdate = (r) => setRoom(r);
    const onGameUpdate = (g) => setGame(g);
    const onHand = (h) => setHand(h);
    const onErr = (msg) => setError(msg);
    const onChat = (m) => setMessages((prev) => [...prev.slice(-49), m]);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room_update", onRoomUpdate);
    socket.on("game_update", onGameUpdate);
    socket.on("your_hand", onHand);
    socket.on("error_message", onErr);
    socket.on("chat_message", onChat);

    if (socket.connected) tryRejoin();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room_update", onRoomUpdate);
      socket.off("game_update", onGameUpdate);
      socket.off("your_hand", onHand);
      socket.off("error_message", onErr);
      socket.off("chat_message", onChat);
    };
  }, [tryRejoin]);

  const clearError = useCallback(() => setError(""), []);

  const createRoom = async () => {
    clearError();
    try {
      const res = await emitAsync("create_room", { name, maxPlayers, clientId: myId });
      setRoom(res.room);
      saveSession(res.room.code);
    } catch (e) {
      setError(e.message);
    }
  };

  const joinRoom = async () => {
    clearError();
    try {
      const res = await emitAsync("join_room", { name, code: joinCode, clientId: myId });
      setRoom(res.room);
      saveSession(res.room.code);
    } catch (e) {
      setError(e.message);
    }
  };

  const startGame = async () => {
    clearError();
    try {
      await emitAsync("start_game", {});
    } catch (e) {
      setError(e.message);
    }
  };

  const playCard = async (card) => {
    clearError();
    if (card.color === "wild") {
      setPendingWild(card.id);
      return;
    }
    try {
      await emitAsync("play_card", { cardId: card.id });
    } catch (e) {
      setError(e.message);
    }
  };

  const confirmWildColor = async (color) => {
    const cardId = pendingWild;
    setPendingWild(null);
    try {
      await emitAsync("play_card", { cardId, chosenColor: color });
    } catch (e) {
      setError(e.message);
    }
  };

  const drawCard = async () => {
    clearError();
    try {
      await emitAsync("draw_card", {});
    } catch (e) {
      setError(e.message);
    }
  };

  const callUno = async () => {
    try {
      await emitAsync("call_uno", {});
    } catch (e) {
      setError(e.message);
    }
  };

  const catchUno = async (targetId) => {
    try {
      await emitAsync("catch_uno", { targetId });
    } catch (e) {
      setError(e.message);
    }
  };

  const sendChat = async (text) => {
    try {
      await emitAsync("chat_message", { text });
    } catch (e) {
      setError(e.message);
    }
  };

  const leaveRoom = () => {
    clearSession();
    setRoom(null);
    setGame(null);
    setHand([]);
    setMessages([]);
    socket.disconnect();
    socket.connect();
  };

  if (rejoining) {
    return (
      <TableBackground>
        <div className="relative z-10 h-full flex flex-col items-center justify-center gap-2 text-white">
          <h1 className="font-display text-3xl font-black tracking-wide">UNO Online</h1>
          <p className="text-white/60 text-sm font-body">Memuat sesi...</p>
        </div>
      </TableBackground>
    );
  }

  if (!room) {
    return (
      <TableBackground>
        <div className="relative z-10 h-full flex flex-col items-center justify-center gap-4 px-4 text-center overflow-y-auto py-6">
          <motion.h1
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="font-display text-5xl sm:text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(255,214,10,0.4)]"
          >
            UNO <span className="text-uno-yellow">Online</span>
          </motion.h1>
          <p className="text-white/50 text-xs font-body">{connected ? "Terhubung ke server" : "Menghubungkan..."}</p>
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="px-3 py-1 rounded-full bg-uno-red/90 text-white text-sm font-body"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <input
            className="w-64 rounded-full bg-white/10 border border-white/15 px-4 py-2.5 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-uno-yellow font-body"
            placeholder="Nama kamu"
            value={name}
            maxLength={16}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="w-72 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur">
            <h3 className="font-display font-bold text-white text-lg">Buat Room</h3>
            <label className="flex items-center justify-between text-sm text-white/70 font-body">
              Maks pemain
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="bg-slate-800 rounded-lg px-2 py-1 text-white"
              >
                {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={createRoom}
              disabled={!name}
              className="py-2.5 rounded-full font-display font-bold text-white bg-uno-red shadow-glow-red disabled:opacity-30 disabled:shadow-none"
            >
              Buat Room
            </motion.button>
          </div>

          <div className="w-72 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur">
            <h3 className="font-display font-bold text-white text-lg">Gabung Room</h3>
            <input
              className="rounded-full bg-white/10 border border-white/15 px-4 py-2 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-uno-blue font-body text-center tracking-widest"
              placeholder="Kode room"
              value={joinCode}
              maxLength={8}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            />
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={joinRoom}
              disabled={!name || !joinCode}
              className="py-2.5 rounded-full font-display font-bold text-white bg-uno-blue shadow-glow-blue disabled:opacity-30 disabled:shadow-none"
            >
              Gabung
            </motion.button>
          </div>
        </div>
      </TableBackground>
    );
  }

  if (room.status === "lobby") {
    const isHost = room.hostId === myId;
    return (
      <TableBackground>
        <div className="relative z-10 h-full flex flex-col items-center justify-center gap-3 px-4 text-center overflow-y-auto py-6">
          <h1 className="font-display text-3xl font-black text-white">
            Room: <span className="text-uno-yellow">{room.code}</span>
          </h1>
          <p className="text-white/50 text-xs font-body">Bagikan kode ini ke teman-temanmu.</p>
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 py-1 rounded-full bg-uno-red/90 text-white text-sm font-body"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <ul className="flex flex-col gap-1 font-body text-white/90 text-sm">
            {room.players.map((p) => (
              <li key={p.id}>
                {p.name} {p.id === room.hostId && "👑"} {!p.connected && "(terputus)"}
              </li>
            ))}
          </ul>
          <p className="text-white/60 text-xs font-body">
            {room.players.length} / {room.maxPlayers} pemain
          </p>
          {isHost ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.03 }}
              onClick={startGame}
              disabled={room.players.length < 2}
              className="px-6 py-2.5 rounded-full font-display font-bold text-white bg-uno-green shadow-glow-green disabled:opacity-30 disabled:shadow-none"
            >
              Mulai Game
            </motion.button>
          ) : (
            <p className="text-white/50 text-sm font-body">Menunggu host memulai game...</p>
          )}
          <ChatPanel messages={messages} onSend={sendChat} />
          <button onClick={leaveRoom} className="text-white/50 text-xs underline font-body">
            Keluar Room
          </button>
        </div>
      </TableBackground>
    );
  }

  if (!game) {
    return (
      <TableBackground>
        <div className="relative z-10 h-full flex items-center justify-center text-white/60 font-body">
          Memuat game...
        </div>
      </TableBackground>
    );
  }

  if (game.status === "finished") {
    const winner = game.players.find((p) => p.id === game.winnerId);
    return (
      <TableBackground>
        <div className="relative z-10 h-full flex flex-col items-center justify-center gap-4 text-center px-4">
          <motion.h1
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="font-display text-5xl font-black text-uno-yellow drop-shadow-[0_0_30px_rgba(255,214,10,0.6)]"
          >
            🎉 Game Selesai
          </motion.h1>
          <p className="font-body text-white/90 text-lg">
            Pemenang: <span className="font-bold text-white">{winner ? winner.name : "-"}</span>
          </p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.03 }}
            onClick={leaveRoom}
            className="px-6 py-2.5 rounded-full font-display font-bold text-white bg-uno-blue shadow-glow-blue"
          >
            Kembali ke Menu
          </motion.button>
        </div>
      </TableBackground>
    );
  }

  return (
    <>
      <GameTable
        game={game}
        hand={hand}
        myId={myId}
        onPlay={playCard}
        onDraw={drawCard}
        onCallUno={callUno}
        onCatchUno={catchUno}
        pendingWild={pendingWild}
        onPickColor={confirmWildColor}
        error={error}
      />
      <div className="fixed bottom-3 right-3 z-40">
        <ChatToggle messages={messages} onSend={sendChat} />
      </div>
    </>
  );
}
