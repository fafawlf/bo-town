import { useCallback } from 'react';

/**
 * Virtual D-pad for touch / small screens. Writes into inputRef: { up, down, left, right }.
 */
const ARIA = { up: '向上移动', down: '向下移动', left: '向左移动', right: '向右移动' };

function PadBtn({ dir, inputRef, label }) {
  const set = useCallback((v) => {
    if (!inputRef?.current) return;
    inputRef.current[dir] = v;
  }, [dir, inputRef]);

  return (
    <button
      type="button"
      className="mobile-dpad-btn"
      aria-label={ARIA[dir] || label}
      onPointerDown={(e) => {
        e.preventDefault();
        set(true);
      }}
      onPointerUp={() => set(false)}
      onPointerLeave={() => set(false)}
      onPointerCancel={() => set(false)}
    >
      {label}
    </button>
  );
}

export default function MobileDpad({ inputRef }) {
  return (
    <div className="mobile-dpad" aria-hidden>
      <div className="mobile-dpad-row">
        <span className="mobile-dpad-spacer" />
        <PadBtn dir="up" inputRef={inputRef} label="↑" />
        <span className="mobile-dpad-spacer" />
      </div>
      <div className="mobile-dpad-row">
        <PadBtn dir="left" inputRef={inputRef} label="←" />
        <span className="mobile-dpad-center" />
        <PadBtn dir="right" inputRef={inputRef} label="→" />
      </div>
      <div className="mobile-dpad-row">
        <span className="mobile-dpad-spacer" />
        <PadBtn dir="down" inputRef={inputRef} label="↓" />
        <span className="mobile-dpad-spacer" />
      </div>
    </div>
  );
}
