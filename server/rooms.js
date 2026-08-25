const { UnoGame } = require("./game");

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion
const RECONNECT_GRACE_MS = 90 * 1000; // how long a disconnected player's seat is held

function genCode(len = 5) {
  let s = "";
  for (let i = 0; i < len; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

class RoomManager {
  constructor() {
    this.rooms = new Map(); // code -> room
  }

  createRoom(playerId, hostName, maxPlayers) {
    let code;
    do {
      code = genCode();
    } while (this.rooms.has(code));

    const room = {
      code,
      hostId: playerId,
      maxPlayers,
      status: "lobby", // lobby | playing | finished
      players: [{ id: playerId, name: hostName, connected: true, removalTimer: null }],
      game: null,
      createdAt: Date.now(),
    };
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code) {
    return this.rooms.get((code || "").toUpperCase());
  }

  joinRoom(code, playerId, name) {
    const room = this.getRoom(code);
    if (!room) throw new Error("Room tidak ditemukan.");
    if (room.status !== "lobby") throw new Error("Permainan sudah dimulai.");
    if (room.players.length >= room.maxPlayers) throw new Error("Room penuh.");
    if (room.players.some((p) => p.id === playerId)) return room;
    room.players.push({ id: playerId, name, connected: true, removalTimer: null });
    return room;
  }

  /**
   * Reattach a returning player (after refresh/disconnect) to their existing seat.
   * Returns the room, or null if the seat no longer exists (grace period expired
   * or room never existed).
   */
  rejoinRoom(code, playerId) {
    const room = this.getRoom(code);
    if (!room) return null;
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return null;
    if (player.removalTimer) {
      clearTimeout(player.removalTimer);
      player.removalTimer = null;
    }
    player.connected = true;
    return room;
  }

  startGame(code, requesterId) {
    const room = this.getRoom(code);
    if (!room) throw new Error("Room tidak ditemukan.");
    if (room.hostId !== requesterId) throw new Error("Hanya host yang bisa memulai game.");
    if (room.players.length < 2) throw new Error("Minimal 2 pemain untuk mulai.");
    if (room.status !== "lobby") throw new Error("Game sudah berjalan.");
    room.game = new UnoGame(room.players.map((p) => ({ id: p.id, name: p.name })));
    room.status = "playing";
    return room;
  }

  /**
   * Called when a socket disconnects. In the lobby, the seat is dropped
   * immediately. During a game, the seat is HELD for RECONNECT_GRACE_MS so
   * refresh/network-blip doesn't kick the player out — only after the grace
   * period expires do we fold their hand back into the draw pile and remove
   * them for real.
   *
   * @param {(room:object)=>void} onFinalRemoval called if/when the grace
   *   period expires, so the caller can rebroadcast state.
   */
  handleDisconnect(code, playerId, onFinalRemoval) {
    const room = this.getRoom(code);
    if (!room) return null;
    const player = room.players.find((p) => p.id === playerId);
    if (player) player.connected = false;

    if (room.status === "lobby") {
      room.players = room.players.filter((pl) => pl.id !== playerId);
      if (room.hostId === playerId && room.players.length > 0) {
        room.hostId = room.players[0].id;
      }
      if (room.players.length === 0) {
        this.rooms.delete(room.code);
        return null;
      }
      return room;
    }

    // status === playing or finished: hold the seat, schedule real removal
    if (player && room.status === "playing") {
      player.removalTimer = setTimeout(() => {
        const stillThere = room.players.find((p) => p.id === playerId);
        if (!stillThere || stillThere.connected) return; // they came back
        if (room.game) {
          room.game.removePlayer(playerId);
          if (room.game.status === "finished") room.status = "finished";
        }
        room.players = room.players.filter((p) => p.id !== playerId);
        if (room.players.length === 0) {
          this.rooms.delete(room.code);
        } else {
          onFinalRemoval?.(room);
        }
      }, RECONNECT_GRACE_MS);
    }

    return room;
  }
}

module.exports = { RoomManager, RECONNECT_GRACE_MS };
