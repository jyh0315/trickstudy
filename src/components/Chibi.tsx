"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Character } from "@/lib/characters";
import { asset } from "@/lib/asset";

// image 주소 → public/characters/<id>.png → .webp 순서로 찾아보고, 결과는 캐시한다.
const imageCache: Record<string, string | null | undefined> = {};

export function useCharacterImage(character: Character) {
  const { id, image } = character;
  const [src, setSrc] = useState(imageCache[id]);
  useEffect(() => {
    if (imageCache[id] !== undefined) return setSrc(imageCache[id]);
    const candidates = [image, asset(`/characters/${id}.png`), asset(`/characters/${id}.webp`)].filter(Boolean) as string[];
    let cancelled = false;
    const tryNext = (i: number) => {
      if (i >= candidates.length) {
        imageCache[id] = null;
        if (!cancelled) setSrc(null);
        return;
      }
      const img = new Image();
      img.onload = () => { imageCache[id] = candidates[i]; if (!cancelled) setSrc(candidates[i]); };
      img.onerror = () => tryNext(i + 1);
      img.src = candidates[i];
    };
    tryNext(0);
    return () => { cancelled = true; };
  }, [id, image]);
  return src;
}

interface Props {
  character: Character;
  size?: number;
  pinched?: boolean; // true면 볼따구 쭈욱
  float?: boolean;
  className?: string;
  silhouette?: boolean;
}

const SKIN = "#FFE9DA";
const spring = { type: "spring", stiffness: 380, damping: 14 } as const;

export default function Chibi({ character, size = 160, pinched = false, float = false, className, silhouette }: Props) {
  const imageSrc = useCharacterImage(character);

  const floatAnim = float ? { y: [0, -10, 0] } : {};
  const floatTrans = float ? { duration: 3, repeat: Infinity, ease: "easeInOut" as const } : {};

  return (
    <motion.div
      className={`relative select-none ${className ?? ""}`}
      style={{ width: size, height: size, filter: silhouette ? "brightness(0) opacity(0.25)" : undefined }}
      animate={floatAnim}
      transition={floatTrans}
    >
      {imageSrc ? (
        <ImageChibi character={character} src={imageSrc} pinched={pinched} />
      ) : (
        <SvgChibi character={character} pinched={pinched} />
      )}
    </motion.div>
  );
}

function ImageChibi({ character, src, pinched }: { character: Character; src: string; pinched: boolean }) {
  return (
    <>
      <motion.img
        src={src}
        alt={character.name}
        draggable={false}
        className="h-full w-full object-contain"
        animate={pinched ? { scaleX: [1, 1.28, 1.2], scaleY: [1, 0.88, 0.92], rotate: [0, -3, 3, 0] } : { scaleX: 1, scaleY: 1, rotate: 0 }}
        transition={spring}
      />
      {pinched && (
        <>
          <motion.span className="absolute left-0 top-[42%] text-3xl" initial={{ x: 20, opacity: 0 }} animate={{ x: -12, opacity: 1 }}>🤏</motion.span>
          <motion.span className="absolute right-0 top-[42%] -scale-x-100 text-3xl" initial={{ x: -20, opacity: 0 }} animate={{ x: 12, opacity: 1 }}>🤏</motion.span>
        </>
      )}
    </>
  );
}

function SvgChibi({ character, pinched }: { character: Character; pinched: boolean }) {
  const { hair, eye, outfit, accessory } = character;
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 2800 + Math.random() * 2000);
    return () => clearInterval(t);
  }, []);

  const stretch = pinched ? 34 : 0;

  return (
    <svg viewBox="-20 0 240 210" className="h-full w-full overflow-visible">
      {/* 그림자 */}
      <ellipse cx="100" cy="202" rx="52" ry="7" fill="rgba(91,70,54,0.12)" />

      {/* 몸 */}
      <path d="M62 200 Q60 160 100 152 Q140 160 138 200 Z" fill={outfit} stroke="#5B4636" strokeWidth="3" />
      <circle cx="100" cy="170" r="6" fill="#fff" stroke="#5B4636" strokeWidth="2" />

      {/* 뒷머리 / 귀 / 뿔 */}
      {accessory === "ears" && (
        <g fill={hair} stroke="#5B4636" strokeWidth="3" strokeLinejoin="round">
          <path d="M44 62 L40 14 L82 40 Z" />
          <path d="M156 62 L160 14 L118 40 Z" />
          <path d="M50 52 L48 26 L70 40 Z" fill="#FFC6D3" stroke="none" />
          <path d="M150 52 L152 26 L130 40 Z" fill="#FFC6D3" stroke="none" />
        </g>
      )}
      {accessory === "horns" && (
        <g fill="#FFF4D6" stroke="#5B4636" strokeWidth="3" strokeLinejoin="round">
          <path d="M60 46 Q48 18 66 10 Q64 30 76 40 Z" />
          <path d="M140 46 Q152 18 134 10 Q136 30 124 40 Z" />
        </g>
      )}
      <ellipse cx="100" cy="96" rx="72" ry="70" fill={hair} stroke="#5B4636" strokeWidth="3" />

      {/* 늘어나는 볼 (얼굴 뒤에서 옆으로 쭈욱) */}
      <motion.ellipse cy="124" fill={SKIN} stroke="#5B4636" strokeWidth="3"
        animate={{ cx: 62 - stretch, rx: 14 + stretch * 0.7, ry: pinched ? 17 : 10 }} transition={spring} />
      <motion.ellipse cy="124" fill={SKIN} stroke="#5B4636" strokeWidth="3"
        animate={{ cx: 138 + stretch, rx: 14 + stretch * 0.7, ry: pinched ? 17 : 10 }} transition={spring} />

      {/* 얼굴 */}
      <motion.ellipse cx="100" cy="106" fill={SKIN} stroke="#5B4636" strokeWidth="3"
        animate={{ rx: pinched ? 64 : 58, ry: pinched ? 52 : 54 }} transition={spring} />
      {/* 볼과 얼굴 이음새 가리기 */}
      <motion.ellipse cy="124" fill={SKIN} animate={{ cx: 62 - stretch * 0.6, rx: 10 + stretch * 0.5, ry: pinched ? 14 : 7 }} transition={spring} />
      <motion.ellipse cy="124" fill={SKIN} animate={{ cx: 138 + stretch * 0.6, rx: 10 + stretch * 0.5, ry: pinched ? 14 : 7 }} transition={spring} />

      {/* 앞머리 */}
      <path
        d="M40 100 Q36 40 100 34 Q164 40 160 100 Q150 76 132 78 Q126 60 112 74 Q100 56 88 74 Q74 60 68 78 Q50 76 40 100 Z"
        fill={hair} stroke="#5B4636" strokeWidth="3" strokeLinejoin="round"
      />
      <path d="M70 50 Q84 42 96 46" stroke="rgba(255,255,255,0.7)" strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* 눈 */}
      {pinched ? (
        <g stroke="#5B4636" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M70 100 L82 108 L70 116" />
          <path d="M130 100 L118 108 L130 116" />
        </g>
      ) : (
        <g>
          {[78, 122].map((cx) => (
            <g key={cx} transform={`translate(${cx} 108) scale(1 ${blink ? 0.1 : 1})`}>
              <ellipse rx="10" ry="13" fill={eye} stroke="#5B4636" strokeWidth="2.5" />
              <ellipse cy="3" rx="6" ry="7" fill="#3a2b22" opacity="0.55" />
              <circle cx="-3" cy="-5" r="4" fill="#fff" />
              <circle cx="4" cy="4" r="1.8" fill="#fff" />
            </g>
          ))}
        </g>
      )}

      {/* 홍조 */}
      <motion.ellipse cy="126" fill="#FF9EB1" animate={{ cx: 66 - stretch * 0.9, rx: pinched ? 16 : 10, opacity: pinched ? 0.85 : 0.55 }} ry="6" transition={spring} />
      <motion.ellipse cy="126" fill="#FF9EB1" animate={{ cx: 134 + stretch * 0.9, rx: pinched ? 16 : 10, opacity: pinched ? 0.85 : 0.55 }} ry="6" transition={spring} />

      {/* 입 */}
      {pinched ? (
        <path d="M86 134 Q93 128 100 134 Q107 140 114 134" stroke="#5B4636" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M92 130 Q100 138 108 130" stroke="#5B4636" strokeWidth="3" fill="#FF8FA3" strokeLinecap="round" />
      )}

      {/* 볼 잡는 손 */}
      {pinched && (
        <g fill={SKIN} stroke="#5B4636" strokeWidth="3">
          <motion.circle cy="124" r="13" initial={{ cx: 62 }} animate={{ cx: 62 - stretch * 1.45 }} transition={spring} />
          <motion.circle cy="124" r="13" initial={{ cx: 138 }} animate={{ cx: 138 + stretch * 1.45 }} transition={spring} />
        </g>
      )}

      {/* 액세서리 */}
      {accessory === "ribbon" && (
        <g transform="translate(146 44) rotate(20)" stroke="#5B4636" strokeWidth="3" strokeLinejoin="round">
          <path d="M0 0 L-22 -14 L-22 14 Z" fill="#FF6F91" />
          <path d="M0 0 L22 -14 L22 14 Z" fill="#FF6F91" />
          <circle r="6" fill="#FFB3C6" />
        </g>
      )}
      {accessory === "flower" && (
        <g transform="translate(52 50)" stroke="#5B4636" strokeWidth="2.5">
          {[0, 72, 144, 216, 288].map((r) => (
            <ellipse key={r} rx="7" ry="11" cy="-10" transform={`rotate(${r})`} fill="#FFF" />
          ))}
          <circle r="6" fill="#FFD43B" />
        </g>
      )}
      {accessory === "leaf" && (
        <g transform="translate(100 30)" stroke="#5B4636" strokeWidth="3">
          <path d="M0 6 Q-2 -14 -18 -20 Q-12 -2 0 6 Z" fill="#7BD389" />
          <path d="M0 6 Q4 -14 20 -18 Q14 0 0 6 Z" fill="#9BE3A6" />
        </g>
      )}
      {accessory === "hat" && (
        <g stroke="#5B4636" strokeWidth="3" strokeLinejoin="round">
          <path d="M100 -6 L68 46 L132 46 Z" fill={outfit} />
          <ellipse cx="100" cy="46" rx="50" ry="10" fill={outfit} />
          <circle cx="100" cy="-6" r="7" fill="#FFF" />
        </g>
      )}
    </svg>
  );
}
