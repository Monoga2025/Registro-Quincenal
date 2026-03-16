import { useState, useRef, useEffect } from "react";
import { motion, useAnimation, useMotionValue } from "framer-motion";
import { Fingerprint, LogIn, LogOut } from "lucide-react";

interface HoldToRegisterProps {
  onRegister: () => void;
  isProcessing: boolean;
  holdDuration?: number;
  hasOpenRecord?: boolean;
}

export function HoldToRegister({ onRegister, isProcessing, holdDuration = 3000, hasOpenRecord = false }: HoldToRegisterProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const progress = useMotionValue(0);
  const controls = useAnimation();
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const countIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isCheckOut = hasOpenRecord;

  const startHold = () => {
    if (isProcessing || isComplete) return;

    setIsHolding(true);
    setCountdown(3);
    startTimeRef.current = Date.now();

    // Countdown timer
    countIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, Math.ceil((holdDuration - elapsed) / 1000));
      setCountdown(remaining);
    }, 100);

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentProgress = Math.min(elapsed / holdDuration, 1);
      progress.set(currentProgress);

      if (currentProgress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        completeHold();
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    controls.start({ scale: 0.93 });
  };

  const stopHold = () => {
    if (isComplete) return;
    setIsHolding(false);
    setCountdown(3);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (countIntervalRef.current) clearInterval(countIntervalRef.current);

    progress.set(0);
    controls.start({ scale: 1 });
  };

  const completeHold = () => {
    if (countIntervalRef.current) clearInterval(countIntervalRef.current);
    setIsHolding(false);
    setIsComplete(true);
    progress.set(1);
    controls.start({ scale: 1.05, transition: { type: "spring", stiffness: 300, damping: 20 } });
    onRegister();

    setTimeout(() => {
      setIsComplete(false);
      progress.set(0);
      controls.start({ scale: 1 });
      setCountdown(3);
    }, 2000);
  };

  useEffect(() => {
    const prevent = (e: Event) => { if (isHolding) e.preventDefault(); };
    document.addEventListener("contextmenu", prevent);
    return () => document.removeEventListener("contextmenu", prevent);
  }, [isHolding]);

  // Ring colors
  const ringColor = isCheckOut ? "#ef4444" : "var(--color-primary)";
  const btnBg = isComplete
    ? "bg-green-500 text-white"
    : isCheckOut
    ? "bg-red-500 text-white"
    : "bg-black text-yellow-400";

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div
        className="relative flex items-center justify-center touch-none select-none"
        onPointerDown={startHold}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
      >
        {/* SVG Rings */}
        <svg width="240" height="240" className="absolute -rotate-90 pointer-events-none drop-shadow-xl">
          {/* Track */}
          <circle cx="120" cy="120" r="110" fill="none" stroke="#e5e7eb" strokeWidth="10" />
          {/* Progress */}
          <motion.circle
            cx="120"
            cy="120"
            r="110"
            fill="none"
            stroke={ringColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="691"
            style={{
              strokeDashoffset: 691,
              pathLength: progress,
            }}
          />
        </svg>

        {/* Inner Button */}
        <motion.div
          animate={controls}
          className={`
            w-[200px] h-[200px] rounded-full flex flex-col items-center justify-center z-10
            shadow-2xl transition-colors duration-300 cursor-pointer
            ${btnBg}
            ${isProcessing ? "opacity-70 cursor-not-allowed" : ""}
          `}
        >
          {isProcessing ? (
            <div className="w-12 h-12 rounded-full border-4 border-current border-t-transparent animate-spin" />
          ) : isComplete ? (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-black text-lg">¡Listo!</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {isCheckOut
                ? <LogOut className="w-14 h-14" />
                : <LogIn className="w-14 h-14" />
              }
              <span className="font-black text-lg tracking-wide uppercase">
                {isCheckOut ? "Salida" : "Entrada"}
              </span>
              <span className="text-xs opacity-70 font-bold">
                {isHolding ? `${countdown}...` : "Mantén 3s"}
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
