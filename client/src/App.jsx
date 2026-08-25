import React, { useEffect, useState, useCallback, useRef } from "react";
import { socket, emitAsync, getClientId, saveSession, loadSession, clearSession } from "./socket";

const COLOR_HEX = {
  red: "#e63946",
  yellow: "#f4c430",
  green: "#2a9d59",
  blue: "#2b6cb0",
  wild: "#2d2d2d",
};

function Card({ card, onClick, disabled, small }) {
  const bg = COLOR_HEX[card.color] || "#333";
  const label =
    card.type === "number"
      ? card.value
      : card.type === "wild"
      ? "★"
      : card.type === "wild4"
      ? "+4"
      : card.type === "draw2"
      ? "+2"
      : card.type === "skip"
      ? "⦸"
      : card.type === "reverse"
      ? "⇄"
      : "?";
  return (
    <button
      className={`uno-card${small ? " small" : ""}${disabled ? " disabled" : ""}`}
      style={{ background: bg }}
      onClick={() => !disabled && onClick?.(card)}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

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
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className="chat-line">
            <b>{m.name}:</b> {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="chat-input-row">
        <input
          className="input chat-input"
          placeholder="Ketik pesan..."
          value={text}
          maxLength={200}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button className="btn small" onClick={send}>
          Kirim
        </button>
      </div>
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
      <div className="screen center">
        <h1>UNO Online</h1>
        <p className="status">Memuat sesi...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="screen center">
        <h1>UNO Online</h1>
        <p className="status">{connected ? "Terhubung ke server" : "Menghubungkan..."}</p>
        {error && <p className="error">{error}</p>}

        <input
          className="input"
          placeholder="Nama kamu"
          value={name}
          maxLength={16}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="panel">
          <h3>Buat Room</h3>
          <label>
            Maks pemain:{" "}
            <select value={maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))}>
              {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button className="btn primary" onClick={createRoom} disabled={!name}>
            Buat Room
          </button>
        </div>

        <div className="panel">
          <h3>Gabung Room</h3>
          <input
            className="input"
            placeholder="Kode room"
            value={joinCode}
            maxLength={8}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          />
          <button className="btn" onClick={joinRoom} disabled={!name || !joinCode}>
            Gabung
          </button>
        </div>
      </div>
    );
  }

  if (room.status === "lobby") {
    const isHost = room.hostId === myId;
    return (
      <div className="screen center">
        <h1>Room: {room.code}</h1>
        <p>Bagikan kode ini ke teman-temanmu.</p>
        {error && <p className="error">{error}</p>}
        <ul className="player-list">
          {room.players.map((p) => (
            <li key={p.id}>
              {p.name} {p.id === room.hostId && "👑"} {!p.connected && "(terputus)"}
            </li>
          ))}
        </ul>
        <p>
          {room.players.length} / {room.maxPlayers} pemain
        </p>
        {isHost ? (
          <button className="btn primary" onClick={startGame} disabled={room.players.length < 2}>
            Mulai Game
          </button>
        ) : (
          <p>Menunggu host memulai game...</p>
        )}
        <ChatPanel messages={messages} onSend={sendChat} />
        <button className="btn" onClick={leaveRoom}>
          Keluar Room
        </button>
      </div>
    );
  }

  if (!game) return <div className="screen center">Memuat game...</div>;

  const isMyTurn = game.currentPlayerId === myId;
  const top = game.topCard;

  if (game.status === "finished") {
    const winner = game.players.find((p) => p.id === game.winnerId);
    return (
      <div className="screen center">
        <h1>🎉 Game Selesai</h1>
        <p>Pemenang: {winner ? winner.name : "-"}</p>
        <button className="btn" onClick={leaveRoom}>
          Kembali ke Menu
        </button>
      </div>
    );
  }

  return (
    <div className="screen game">
      {error && <p className="error">{error}</p>}

      <div className="opponents">
        {game.players
          .filter((p) => p.id !== myId)
          .map((p) => (
            <div key={p.id} className={`opponent${game.currentPlayerId === p.id ? " active" : ""}`}>
              <div className="opponent-name">
                {p.name} {!p.connected && "⚠️"}
              </div>
              <div className="opponent-cards">{p.cardCount} kartu</div>
              {p.mustCallUno && (
                <button className="btn small danger" onClick={() => catchUno(p.id)}>
                  Tangkap UNO!
                </button>
              )}
            </div>
          ))}
      </div>

      <div className="table">
        <div className="pile draw" onClick={isMyTurn ? drawCard : undefined}>
          <div className="uno-card back" />
          <span>{game.drawPileCount} kartu</span>
        </div>
        <div className="pile discard">
          {top && <Card card={top} disabled />}
          <span className="current-color" style={{ background: COLOR_HEX[game.currentColor] }} />
        </div>
      </div>

      <p className="turn-indicator">
        {isMyTurn ? "Giliranmu!" : `Giliran ${game.players.find((p) => p.id === game.currentPlayerId)?.name}`}
        {game.pendingDraw > 0 && ` — tumpukan tarik: ${game.pendingDraw}`}
      </p>

      {pendingWild && (
        <div className="color-picker">
          <p>Pilih warna:</p>
          {["red", "yellow", "green", "blue"].map((c) => (
            <button
              key={c}
              className="color-btn"
              style={{ background: COLOR_HEX[c] }}
              onClick={() => confirmWildColor(c)}
            />
          ))}
        </div>
      )}

      <div className="controls">
        <button className="btn" onClick={drawCard} disabled={!isMyTurn}>
          Tarik Kartu
        </button>
        <button className="btn" onClick={callUno} disabled={hand.length !== 1}>
          Panggil UNO!
        </button>
      </div>

      <div className="hand">
        {hand.map((c) => (
          <Card key={c.id} card={c} onClick={playCard} disabled={!isMyTurn} />
        ))}
      </div>

      <ChatPanel messages={messages} onSend={sendChat} />
    </div>
  );
}
