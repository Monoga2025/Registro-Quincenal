import { useState, useRef, useEffect } from "react";
import { motion, useAnimation, useMotionValue } from "framer-motion";
import { Fingerprint } from "lucide-react";

interface HoldToRegisterProps {
  onRegister: () => void;
  isProcessing: boolean;
  holdDuration?: number; // in ms
}

export function HoldToRegister({ onRegister, isProcessing, holdDuration = 3000 }: HoldToRegisterProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const progress = useMotionValue(0);
  const controls = useAnimation();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const startHold = () => {
    if (isProcessing || isComplete) return;
    
    setIsHolding(true);
    startTimeRef.current = Date.now();
    
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
    controls.start({ scale: 0.95 });
  };

  const stopHold = () => {
    if (isComplete) return;
    setIsHolding(false);
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    progress.set(0);
    controls.start({ scale: 1 });
  };

  const completeHold = () => {
    setIsHolding(false);
    setIsComplete(true);
    progress.set(1);
    controls.start({ scale: 1.05, transition: { type: "spring", stiffness: 300, damping: 20 } });
    onRegister();
    
    // Reset after a delay
    setTimeout(() => {
      setIsComplete(false);
      progress.set(0);
      controls.start({ scale: 1 });
    }, 2000);
  };

  // Prevent context menu on mobile long press
  useEffect(() => {
    const handleContextMenu = (e: Event) => {
      if (isHolding) e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, [isHolding]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div 
        className="relative flex items-center justify-center touch-none select-none"
        onPointerDown={startHold}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
      >
        {/* Background Ring */}
        <svg width="240" height="240" className="absolute -rotate-90 pointer-events-none drop-shadow-xl">
          <circle
            cx="120"
            cy="120"
            r="110"
            fill="none"
            stroke="var(--color-secondary)"
            strokeWidth="12"
            className="opacity-10"
          />
          {/* Progress Ring */}
          <motion.circle
            cx="120"
            cy="120"
            r="110"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="691" // 2 * PI * 110 approx 691
            style={{ 
              strokeDashoffset: 691,
              pathLength: progress 
            }}
          />
        </svg>

        {/* Inner Button */}
        <motion.div
          animate={controls}
          className={`
            w-[200px] h-[200px] rounded-full flex flex-col items-center justify-center z-10
            shadow-2xl transition-colors duration-300
            ${isComplete 
              ? 'bg-primary text-secondary' 
              : 'bg-secondary text-white hover:bg-secondary/90'
            }
            ${isProcessing ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {isProcessing ? (
            <div className="w-12 h-12 rounded-full border-4 border-white border-t-transparent animate-spin" />
          ) : isComplete ? (
            <div className="flex flex-col items-center">
              <svg className="w-16 h-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-display font-bold text-xl">Registrado</span>
            </div>
          ) : (
            <>
              <Fingerprint className="w-16 h-16 mb-3 opacity-90" />
              <span className="font-display font-bold text-xl tracking-wide uppercase">
                {isHolding ? 'Mantén...' : 'Registrar'}
              </span>
              <span className="text-xs opacity-60 mt-1 font-medium">3 Segundos</span>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
