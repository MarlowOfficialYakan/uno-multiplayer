import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TableBackground from "./TableBackground";
import OpponentSeat from "./OpponentSeat";
import PlayerHand from "./PlayerHand";
import DiscardPile from "./DiscardPile";
import DrawPile from "./DrawPile";
import DrawFlight from "./DrawFlight";
import ColorPicker from "./ColorPicker";
import { useSound } from "../../hooks/useSound";

const DRAW_WILD_TYPES = new Set(["wild4", "wild10"]);

/**
 * Pure presentation layer for the in-progress game screen. All game state
 * (`game`, `hand`) and every action (`onPlay`, `onDraw`, ...) are passed in
 * as props from App.jsx, which still owns 100% of the Socket.io logic —
 * this component never touches the socket directly.
 *
 * `triggerEpic(type, payload)` fires the Epic Moment overlay (mounted once,
 * globally, in App.jsx) — this component calls it for the "UNO call" and
 * "+4/+10 attack" triggers; the "game win" trigger is detected in App.jsx
 * itself since it needs to freeze the board across a status transition.
 */
export default function GameTable({
  game,
  hand,
  myId,
  onPlay,
  onDraw,
  onCallUno,
  onCatchUno,
  pendingWild,
  onPickColor,
  error,
  triggerEpic,
}) {
  const playSound = useSound();
  const [justDrawnId, setJustDrawnId] = useState(null);
  const [drawFlight, setDrawFlight] = useState(null);
  const prevHandIds = useRef(hand.map((c) => c.id));
  const prevGameRef = useRef(game);
  const drawPileRef = useRef(null);

  // Fire draw/play SFX hooks whenever the hand actually changes, and — for
  // the "quick play after draw" feature — figure out which card is the one
  // that just got drawn so PlayerHand can highlight it, making it fast to
  // find and tap without hunting through the fan. Also kicks off the
  // draw-pile -> hand "flight" ghost card with a glow trail.
  useEffect(() => {
    const prevIds = prevHandIds.current;
    const currIds = hand.map((c) => c.id);

    if (currIds.length > prevIds.length) {
      playSound("draw");

      const rect = drawPileRef.current?.getBoundingClientRect();
      if (rect) {
        const from = { x: rect.left + rect.width / 2 - 24, y: rect.top + rect.height / 2 - 32 };
        // Approximate hand-area target (bottom-center) rather than a precise
        // per-card point — the fan re-flows on every hand change anyway.
        const to = { x: window.innerWidth / 2 - 24, y: window.innerHeight - 160 };
        setDrawFlight({ from, to });
        setTimeout(() => setDrawFlight(null), 600);
      }

      const prevSet = new Set(prevIds);
      const newCard = hand.find((c) => !prevSet.has(c.id));
      if (newCard) {
        setJustDrawnId(newCard.id);
        setTimeout(() => setJustDrawnId((id) => (id === newCard.id ? null : id)), 2500);
      }
    } else if (currIds.length < prevIds.length) {
      playSound("cardPlay");
      setJustDrawnId(null);
    }

    prevHandIds.current = currIds;
  }, [hand, playSound]);

  // Epic Moment — "+4 / +10 attack" trigger: detected by diffing the top
  // card. When a fresh draw-wild lands on the discard pile, the turn has
  // already advanced past the attacker to the target, so:
  //   attacker = whoever's turn it was right before this update
  //   target   = whoever's turn it is now
  useEffect(() => {
    const prev = prevGameRef.current;
    if (prev && game.topCard && prev.topCard?.id !== game.topCard.id) {
      const isDrawWild = DRAW_WILD_TYPES.has(game.topCard.type);
      const wasDrawWild = prev.topCard && DRAW_WILD_TYPES.has(prev.topCard.type);
      if (isDrawWild && !wasDrawWild) {
        const attackerName = game.players.find((p) => p.id === prev.currentPlayerId)?.name || "?";
        const targetName = game.players.find((p) => p.id === game.currentPlayerId)?.name || "?";
        const amount = game.topCard.type === "wild10" ? 10 : 4;
        triggerEpic?.("attack", { attackerName, targetName, amount });
      }
    }
    prevGameRef.current = game;
  }, [game, triggerEpic]);

  const handleCallUno = () => {
    onCallUno();
    const me = game.players.find((p) => p.id === myId);
    triggerEpic?.("uno", { playerName: me?.name || "?" });
  };

  const opponents = game.players.filter((p) => p.id !== myId);
  const isMyTurn = game.currentPlayerId === myId;
  const activePlayerName = game.players.find((p) => p.id === game.currentPlayerId)?.name;

  return (
    <TableBackground tilted>
      {/* overflow-y-auto is a safety net: if a phone's font-size/accessibility
          settings make content taller than the viewport, it scrolls instead
          of silently overlapping the sections below it. */}
      <div className="relative z-10 flex flex-col h-full overflow-y-auto">
        <AnimatePresence>
          {error && (
            <motion.p
              key={error}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto mt-2 px-4 py-1.5 rounded-full bg-uno-red/90 text-white text-sm font-body shadow-glow-red shrink-0"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 pt-4 px-2 shrink-0">
          {opponents.map((p) => (
            <OpponentSeat key={p.id} player={p} isActive={game.currentPlayerId === p.id} onCatchUno={onCatchUno} />
          ))}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[9rem] py-3">
          <div className="flex items-center gap-8 sm:gap-14">
            <DrawPile ref={drawPileRef} count={game.drawPileCount} onClick={onDraw} disabled={!isMyTurn} />
            <DiscardPile topCard={game.topCard} currentColor={game.currentColor} />
          </div>

          <p className="font-display font-bold text-white/90 text-sm sm:text-base text-center px-4">
            {isMyTurn ? "Giliranmu!" : `Giliran ${activePlayerName}`}
            {game.pendingDraw > 0 && <span className="text-uno-yellow"> — tumpukan tarik: {game.pendingDraw}</span>}
          </p>

          <motion.button
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.04 }}
            onClick={handleCallUno}
            disabled={hand.length !== 1}
            className="px-6 py-2 rounded-full font-display font-bold text-white bg-uno-red shadow-glow-red disabled:opacity-30 disabled:shadow-none"
          >
            UNO!
          </motion.button>
        </div>

        <PlayerHand cards={hand} disabled={!isMyTurn} onPlay={onPlay} justDrawnId={justDrawnId} />
      </div>

      <AnimatePresence>{pendingWild && <ColorPicker key="picker" origin={pendingWild.origin} onPick={onPickColor} />}</AnimatePresence>

      <DrawFlight from={drawFlight?.from} to={drawFlight?.to} />
    </TableBackground>
  );
}
