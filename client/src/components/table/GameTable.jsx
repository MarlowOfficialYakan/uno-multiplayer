import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TableBackground from "./TableBackground";
import OpponentSeat from "./OpponentSeat";
import PlayerHand from "./PlayerHand";
import DiscardPile from "./DiscardPile";
import DrawPile from "./DrawPile";
import ColorPicker from "./ColorPicker";
import UnoCallout from "./UnoCallout";
import { useSound } from "../../hooks/useSound";

/**
 * Pure presentation layer for the in-progress game screen. All game state
 * (`game`, `hand`) and every action (`onPlay`, `onDraw`, ...) are passed in
 * as props from App.jsx, which still owns 100% of the Socket.io logic —
 * this component never touches the socket directly.
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
}) {
  const playSound = useSound();
  const [shake, setShake] = useState(false);
  const [unoTrigger, setUnoTrigger] = useState(0);
  const [justDrawnId, setJustDrawnId] = useState(null);
  const prevHandIds = useRef(hand.map((c) => c.id));

  // Fire draw/play SFX hooks whenever the hand actually changes, and — for
  // the "quick play after draw" feature — figure out which card is the one
  // that just got drawn so PlayerHand can highlight it, making it fast to
  // find and tap without hunting through the fan.
  useEffect(() => {
    const prevIds = prevHandIds.current;
    const currIds = hand.map((c) => c.id);

    if (currIds.length > prevIds.length) {
      playSound("draw");
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

  const handleCallUno = () => {
    onCallUno();
    setUnoTrigger((n) => n + 1);
    setShake(true);
    playSound("unoCall");
    setTimeout(() => setShake(false), 500);
  };

  const opponents = game.players.filter((p) => p.id !== myId);
  const isMyTurn = game.currentPlayerId === myId;
  const activePlayerName = game.players.find((p) => p.id === game.currentPlayerId)?.name;

  return (
    <TableBackground className={shake ? "animate-shake" : ""}>
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
            <DrawPile count={game.drawPileCount} onClick={onDraw} disabled={!isMyTurn} />
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

      <AnimatePresence>{pendingWild && <ColorPicker key="picker" onPick={onPickColor} />}</AnimatePresence>

      <UnoCallout triggerKey={unoTrigger || null} />
    </TableBackground>
  );
}
