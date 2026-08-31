import { useCallback, useRef } from "react";

// Central place to wire up SFX later. Drop audio files into /public/sfx/
// and fill in the paths below — every trigger point in the table
// components (card play, draw, UNO call, win) already calls this hook,
// so adding real sound is a one-line change here, not a hunt through
// every component.
const SOUND_MAP = {
  cardPlay: null, // e.g. "/sfx/card-play.mp3"
  draw: null, // e.g. "/sfx/card-draw.mp3"
  unoCall: null, // e.g. "/sfx/uno-call.mp3"
  win: null, // e.g. "/sfx/win-fanfare.mp3"
  flip: null, // e.g. "/sfx/card-flip.mp3"
  epicCharge: null, // e.g. "/sfx/epic-whoosh.mp3" — Epic Moment CHARGE beat
  epicBurst: null, // e.g. "/sfx/epic-boom.mp3" — Epic Moment BURST beat
  epicResolve: null, // e.g. "/sfx/epic-sting.mp3" — Epic Moment RESOLVE beat
};

export function useSound() {
  const cache = useRef({});

  return useCallback((name) => {
    const src = SOUND_MAP[name];
    if (!src) return; // silent no-op until a file is wired up above
    if (!cache.current[name]) cache.current[name] = new Audio(src);
    const audio = cache.current[name];
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, []);
}
