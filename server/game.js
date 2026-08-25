// game.js — Authoritative UNO game engine.
// IMPORTANT: This file runs ONLY on the server. Clients never see hidden
// state (other players' hands, draw pile order) because we only ever send
// each player their OWN hand, and everyone else gets just a card count.

const COLORS = ["red", "yellow", "green", "blue"];

function buildDeck() {
  const deck = [];
  let uid = 0;

  const push = (color, value, type) => {
    deck.push({ id: `c${uid++}`, color, value, type });
  };

  for (const color of COLORS) {
    push(color, "0", "number");
    for (let n = 1; n <= 9; n++) {
      push(color, String(n), "number");
      push(color, String(n), "number");
    }
    for (let i = 0; i < 2; i++) {
      push(color, "skip", "skip");
      push(color, "reverse", "reverse");
      push(color, "draw2", "draw2");
    }
  }
  for (let i = 0; i < 4; i++) {
    push("wild", "wild", "wild");
    push("wild", "wild4", "wild4");
  }
  return deck;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

class UnoGame {
  /**
   * @param {{id:string, name:string}[]} players
   */
  constructor(players) {
    this.playerOrder = players.map((p) => p.id);
    this.names = Object.fromEntries(players.map((p) => [p.id, p.name]));
    this.hands = {}; // playerId -> card[]
    this.drawPile = shuffle(buildDeck());
    this.discardPile = [];
    this.currentColor = null;
    this.currentIndex = 0;
    this.direction = 1; // 1 or -1
    this.pendingDraw = 0; // stacked draw2/draw4 amount
    this.mustCallUno = {}; // playerId -> true if they have 1 card and haven't called
    this.status = "playing"; // playing | finished
    this.winnerId = null;
    this.log = [];

    for (const p of players) this.hands[p.id] = [];
    this._deal();
    this._flipFirstCard();
  }

  _deal() {
    for (let i = 0; i < 7; i++) {
      for (const pid of this.playerOrder) {
        this.hands[pid].push(this._draw());
      }
    }
  }

  _draw() {
    if (this.drawPile.length === 0) {
      // reshuffle discard (except top card) back into draw pile
      const top = this.discardPile.pop();
      this.drawPile = shuffle(this.discardPile);
      this.discardPile = top ? [top] : [];
    }
    return this.drawPile.pop();
  }

  _flipFirstCard() {
    let card = this._draw();
    // first card should never be a wild4; keep drawing/reshuffling if so
    while (card.type === "wild4") {
      this.drawPile.unshift(card);
      shuffle(this.drawPile);
      card = this._draw();
    }
    this.discardPile.push(card);
    this.currentColor = card.color === "wild" ? COLORS[Math.floor(Math.random() * 4)] : card.color;
    if (card.type === "skip") this._advance();
    if (card.type === "reverse") this.direction *= -1;
    if (card.type === "draw2") this.pendingDraw = 2;
  }

  currentPlayerId() {
    return this.playerOrder[this.currentIndex];
  }

  topCard() {
    return this.discardPile[this.discardPile.length - 1];
  }

  _advance(steps = 1) {
    const n = this.playerOrder.length;
    this.currentIndex = (this.currentIndex + this.direction * steps + n * steps) % n;
  }

  _isValidPlay(card, top) {
    if (card.color === "wild") return true;
    if (card.color === this.currentColor) return true;
    if (card.value === top.value) return true;
    return false;
  }

  /**
   * @param {string} playerId
   * @param {string} cardId
   * @param {string|null} chosenColor required if card is wild
   */
  playCard(playerId, cardId, chosenColor) {
    this._assertTurn(playerId);
    const hand = this.hands[playerId];
    const idx = hand.findIndex((c) => c.id === cardId);
    if (idx === -1) throw new GameError("Kartu tidak ada di tanganmu.");
    const card = hand[idx];
    const top = this.topCard();

    if (this.pendingDraw > 0) {
      // can only stack a matching draw card, otherwise must draw
      const canStack =
        (card.type === "draw2" && top.type === "draw2") ||
        (card.type === "wild4");
      if (!canStack) {
        throw new GameError(`Kamu harus tarik ${this.pendingDraw} kartu atau tumpuk kartu draw.`);
      }
    } else if (!this._isValidPlay(card, top)) {
      throw new GameError("Kartu tidak cocok warna/angka dengan kartu teratas.");
    }

    if ((card.color === "wild") && !COLORS.includes(chosenColor)) {
      throw new GameError("Pilih warna untuk kartu wild.");
    }

    hand.splice(idx, 1);
    this.discardPile.push(card);
    this.currentColor = card.color === "wild" ? chosenColor : card.color;

    // uno-call bookkeeping
    if (hand.length === 1) {
      this.mustCallUno[playerId] = true;
    } else {
      delete this.mustCallUno[playerId];
    }

    if (hand.length === 0) {
      this.status = "finished";
      this.winnerId = playerId;
      this._advance();
      return { finished: true, winnerId: playerId };
    }

    switch (card.type) {
      case "skip":
        this._advance(2);
        break;
      case "reverse":
        this.direction *= -1;
        if (this.playerOrder.length === 2) this._advance(2);
        else this._advance(1);
        break;
      case "draw2":
        this.pendingDraw += 2;
        this._advance();
        break;
      case "wild4":
        this.pendingDraw += 4;
        this._advance();
        break;
      default:
        this._advance();
    }

    return { finished: false };
  }

  drawCard(playerId) {
    this._assertTurn(playerId);
    const hand = this.hands[playerId];
    const amount = this.pendingDraw > 0 ? this.pendingDraw : 1;
    const drawn = [];
    for (let i = 0; i < amount; i++) drawn.push(this._draw());
    hand.push(...drawn);
    this.pendingDraw = 0;
    delete this.mustCallUno[playerId];
    this._advance();
    return drawn.length;
  }

  callUno(playerId) {
    if (this.hands[playerId]?.length === 1) {
      delete this.mustCallUno[playerId];
      return true;
    }
    return false;
  }

  /** Another player catches someone who has 1 card and didn't call UNO. */
  catchUno(accuserId, targetId) {
    if (!this.mustCallUno[targetId]) {
      throw new GameError("Pemain itu sudah aman (sudah panggil UNO atau kartunya bukan 1).");
    }
    const hand = this.hands[targetId];
    for (let i = 0; i < 2; i++) hand.push(this._draw());
    delete this.mustCallUno[targetId];
    return true;
  }

  removePlayer(playerId) {
    // Player disconnected mid-game: fold their hand into the draw pile
    // and remove them from turn order so the game can continue.
    const idx = this.playerOrder.indexOf(playerId);
    if (idx === -1) return;
    this.drawPile.push(...(this.hands[playerId] || []));
    shuffle(this.drawPile);
    delete this.hands[playerId];
    this.playerOrder.splice(idx, 1);
    if (idx < this.currentIndex) this.currentIndex--;
    if (this.currentIndex >= this.playerOrder.length) this.currentIndex = 0;
    if (this.playerOrder.length === 1) {
      this.status = "finished";
      this.winnerId = this.playerOrder[0];
    }
  }

  _assertTurn(playerId) {
    if (this.status !== "playing") throw new GameError("Permainan sudah selesai.");
    if (this.currentPlayerId() !== playerId) throw new GameError("Bukan giliranmu.");
  }

  /** Public state safe to broadcast to everyone (no hidden info). */
  publicState() {
    return {
      status: this.status,
      winnerId: this.winnerId,
      topCard: this.topCard(),
      currentColor: this.currentColor,
      currentPlayerId: this.status === "playing" ? this.currentPlayerId() : null,
      direction: this.direction,
      pendingDraw: this.pendingDraw,
      drawPileCount: this.drawPile.length,
      players: this.playerOrder.map((pid) => ({
        id: pid,
        name: this.names[pid],
        cardCount: this.hands[pid]?.length ?? 0,
        mustCallUno: !!this.mustCallUno[pid],
      })),
    };
  }

  /** Private hand for one player only — never broadcast to others. */
  handFor(playerId) {
    return this.hands[playerId] || [];
  }
}

class GameError extends Error {}

module.exports = { UnoGame, GameError, COLORS };
