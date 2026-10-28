"use client";

import { motion, useAnimationControls } from "framer-motion";
import { useEffect } from "react";

interface Props {
  color: string;
  accent: string;
  hitKey: number; // 값이 바뀔 때마다 피격 모션
  defeated?: boolean;
  size?: number;
}

export default function BossMonster({ color, accent, hitKey, defeated, size = 200 }: Props) {
  const controls = useAnimationControls();

  useEffect(() => {
    if (!hitKey) return;
    controls.start({
      x: [0, -14, 12, -8, 6, 0],
      scaleY: [1, 0.82, 1.08, 1],
      filter: ["brightness(1)", "brightness(2.2)", "brightness(1)"],
      transition: { duration: 0.5 },
    });
  }, [hitKey, controls]);

  return (
    <motion.div style={{ width: size, height: size }} animate={controls}>
      <motion.svg
        viewBox="0 0 200 200"
        className="h-full w-full overflow-visible"
        animate={defeated ? { rotate: 90, y: 40, opacity: 0.5 } : { scaleX: [1, 1.04, 1], scaleY: [1, 0.96, 1] }}
        transition={defeated ? { duration: 0.6 } : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <ellipse cx="100" cy="188" rx="70" ry="9" fill="rgba(91,70,54,0.15)" />
        {/* 왕관 같은 뿔 */}
        <path d="M60 52 L70 18 L86 44 L100 10 L114 44 L130 18 L140 52 Z" fill={accent} stroke="#5B4636" strokeWidth="4" strokeLinejoin="round" />
        <path d="M20 180 Q10 60 100 48 Q190 60 180 180 Q160 170 140 182 Q120 170 100 182 Q80 170 60 182 Q40 170 20 180 Z"
          fill={color} stroke="#5B4636" strokeWidth="4" strokeLinejoin="round" />
        <path d="M50 90 Q60 70 80 68" stroke="rgba(255,255,255,0.7)" strokeWidth="8" fill="none" strokeLinecap="round" />
        {defeated ? (
          <g stroke="#5B4636" strokeWidth="5" strokeLinecap="round">
            <path d="M64 104 L84 124 M84 104 L64 124" />
            <path d="M116 104 L136 124 M136 104 L116 124" />
          </g>
        ) : (
          <g>
            <path d="M60 96 L88 106" stroke="#5B4636" strokeWidth="5" strokeLinecap="round" />
            <path d="M140 96 L112 106" stroke="#5B4636" strokeWidth="5" strokeLinecap="round" />
            <circle cx="76" cy="118" r="12" fill="#fff" stroke="#5B4636" strokeWidth="4" />
            <circle cx="124" cy="118" r="12" fill="#fff" stroke="#5B4636" strokeWidth="4" />
            <circle cx="79" cy="120" r="6" fill="#5B4636" />
            <circle cx="121" cy="120" r="6" fill="#5B4636" />
          </g>
        )}
        <path d="M78 148 Q100 136 122 148" stroke="#5B4636" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M86 146 L90 156 L94 144" fill="#fff" stroke="#5B4636" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M106 144 L110 156 L114 146" fill="#fff" stroke="#5B4636" strokeWidth="2.5" strokeLinejoin="round" />
      </motion.svg>
    </motion.div>
  );
}
