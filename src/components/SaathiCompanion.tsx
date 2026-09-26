import { motion, useReducedMotion } from "motion/react";

export type CompanionExpression = "idle" | "happy" | "thinking" | "listening" | "supportive" | "grounding" | "celebrating" | "curious" | "welcoming" | "responding" | "voice" | "handoff" | "excited" | "sleepy";
type Props = { expression?: CompanionExpression; className?: string; lively?: boolean };
type Keys = number[];

/** Per-mood motion presets — every state keeps moving, each one visibly different. */
const BODY: Record<string, { y: Keys; rotate: Keys; duration: number }> = {
  excited: { y: [0, -18, 0, -10, 0], rotate: [0, -8, 8, 0], duration: 1 },
  sleepy: { y: [0, 2, 0], rotate: [0, 3, 0], duration: 4.2 },
  happy: { y: [0, -12, 0, -6, 0], rotate: [0, -5, 4, 0], duration: 1.3 },
  celebrating: { y: [0, -14, 0, -8, 0], rotate: [0, -6, 6, 0], duration: 1.1 },
  welcoming: { y: [0, -9, 0], rotate: [0, 3, 0], duration: 1.6 },
  listening: { y: [0, -3, 0], rotate: [0, 8, 8, 0], duration: 2.4 },
  supportive: { y: [0, 4, 0], rotate: [0, -6, 0], duration: 2.8 },
  grounding: { y: [0, 5, 0], rotate: [0, 0, 0], duration: 3.8 },
  thinking: { y: [0, -3, 0], rotate: [0, -7, -7, 0], duration: 2.6 },
  curious: { y: [0, -6, 0, -3, 0], rotate: [0, 5, -4, 0], duration: 2 },
  responding: { y: [0, -6, 0], rotate: [0, 3, -3, 0], duration: 1.4 },
  voice: { y: [0, -4, 0], rotate: [0, 2, 0], duration: 1.6 },
  handoff: { y: [0, -4, 0], rotate: [0, 6, 0], duration: 2.2 },
  idle: { y: [0, -5, 0], rotate: [0, 2, 0], duration: 2.6 },
};
const TAIL: Record<string, { rotate: Keys; duration: number }> = {
  happy: { rotate: [0, 34, -20, 30, -14, 0], duration: 1.2 },
  celebrating: { rotate: [0, 36, -26, 24, 0], duration: 1 },
  welcoming: { rotate: [0, 26, -12, 0], duration: 1.8 },
  listening: { rotate: [0, 14, -10, 12, 0], duration: 2.6 },
  supportive: { rotate: [0, -18, -6, -16, 0], duration: 3 },
  grounding: { rotate: [0, -22, -12, -20, 0], duration: 3.6 },
  thinking: { rotate: [0, 8, 20, 8, 0], duration: 2.8 },
  curious: { rotate: [0, 28, -18, 22, 0], duration: 1.9 },
  responding: { rotate: [0, 22, -14, 0], duration: 1.5 },
  voice: { rotate: [0, 18, -10, 0], duration: 1.7 },
  handoff: { rotate: [0, 16, -8, 0], duration: 2.2 },
  idle: { rotate: [0, 24, -14, 18, -8, 0], duration: 2.4 },
};
const LEFT_EAR: Record<string, { rotate: Keys; duration: number }> = {
  happy: { rotate: [0, -18, 6, -12, 0], duration: 1.3 },
  celebrating: { rotate: [0, -20, 6, 0], duration: 1 },
  listening: { rotate: [0, -6, 10, 0], duration: 2.2 },
  supportive: { rotate: [0, -12, -4, 0], duration: 2.8 },
  grounding: { rotate: [0, -16, -9, 0], duration: 3.4 },
  curious: { rotate: [0, -14, 0, -8, 0], duration: 1.7 },
  thinking: { rotate: [0, -10, -4, 0], duration: 2.6 },
  idle: { rotate: [0, 10, -4, 0], duration: 2.5 },
};
const RIGHT_EAR: Record<string, { rotate: Keys; duration: number }> = {
  happy: { rotate: [0, 17, -6, 12, 0], duration: 1.25 },
  celebrating: { rotate: [0, 18, -6, 0], duration: 1 },
  listening: { rotate: [0, 20, -5, 14, 0], duration: 1.6 },
  supportive: { rotate: [0, 12, 5, 0], duration: 2.8 },
  grounding: { rotate: [0, 17, 10, 0], duration: 3.4 },
  curious: { rotate: [0, 4, 16, 4, 0], duration: 2.1 },
  thinking: { rotate: [0, 14, 6, 0], duration: 2.4 },
  idle: { rotate: [0, -11, 5, 0], duration: 2.3 },
};
const PUPILS: Record<string, { x: Keys; y: Keys; duration: number }> = {
  happy: { x: [0, 5, 0, -4, 0], y: [0, -4, 0], duration: 1.5 },
  listening: { x: [0, -6, -6, 3, 0], y: [0, 1, 0], duration: 2.6 },
  supportive: { x: [0, -4, 0], y: [0, 4, 0], duration: 2.8 },
  grounding: { x: [0, -3, 3, 0], y: [0, 5, 5, 0], duration: 3.4 },
  thinking: { x: [0, -5, -5, 0], y: [0, -4, -4, 0], duration: 2.6 },
  curious: { x: [0, 6, 6, -5, 0], y: [0, -3, 2, -2, 0], duration: 2.2 },
  handoff: { x: [0, 5, 5, 0], y: [0, -1, 0], duration: 2.4 },
  idle: { x: [0, -6, -6, 5, 5, 0], y: [0, -2, -2, 1, -2, 0], duration: 2.8 },
};

/** Articulated lantern-tailed SAATHI cat. All reactions come from explicit UI states, never mood diagnosis. */
export function SaathiCompanion({ expression = "idle", className = "h-28 w-28", lively = false }: Props) {
  const reduce = useReducedMotion();
  const sleepy = expression === "sleepy";
  const happy = expression === "happy" || expression === "excited" || expression === "celebrating" || expression === "welcoming";
  const calm = expression === "supportive" || expression === "grounding" || expression === "listening" || expression === "handoff";
  const speaking = expression === "responding" || expression === "voice";
  const body = BODY[expression] ?? BODY["idle"]!;
  const tail = TAIL[expression] ?? TAIL["idle"]!;
  const leftEar = LEFT_EAR[expression] ?? LEFT_EAR["idle"]!;
  const rightEar = RIGHT_EAR[expression] ?? RIGHT_EAR["idle"]!;
  const pupils = PUPILS[expression] ?? PUPILS["idle"]!;
  return (
    <motion.svg data-expression={expression} viewBox="15 18 130 132" className={className} role="img" aria-label={`Animated SAATHI cat, ${expression}`} xmlns="http://www.w3.org/2000/svg" initial={false} animate={reduce ? {} : { y: body.y, rotate: body.rotate }} transition={{ duration: body.duration, repeat: Infinity, ease: "easeInOut" }}>
      <defs><linearGradient id="saathi-fur" x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--avatar)" /><stop offset="1" stopColor="var(--secondary)" /></linearGradient><linearGradient id="saathi-light" x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--coral)" /><stop offset="1" stopColor="var(--warm)" /></linearGradient></defs>
      <ellipse cx="78" cy="147" rx="47" ry="6" fill="var(--primary)" opacity=".1" />
      <motion.g data-part="tail" style={{ transformOrigin: "112px 106px" }} animate={reduce ? {} : { rotate: tail.rotate }} transition={{ duration: tail.duration, repeat: Infinity, ease: "easeInOut" }}>
        <motion.path d="M109 110 C145 117 150 79 133 68 C124 61 117 69 123 78 C129 85 138 95 113 96" fill="none" stroke="var(--primary)" strokeWidth="13" strokeLinecap="round" animate={reduce ? {} : { d: ["M109 110 C145 117 150 79 133 68 C124 61 117 69 123 78 C129 85 138 95 113 96", "M109 110 C149 102 143 63 123 67 C111 69 120 84 132 84 C145 84 142 104 113 96", "M109 110 C145 117 150 79 133 68 C124 61 117 69 123 78 C129 85 138 95 113 96"] }} transition={{ duration: tail.duration, repeat: Infinity, ease: "easeInOut" }} />
        <motion.circle cx="133" cy="68" r="6" fill="var(--coral)" animate={reduce ? {} : { scale: [1, 1.3, 1] }} style={{ transformOrigin: "133px 68px" }} transition={{ duration: tail.duration / 2, repeat: Infinity, ease: "easeInOut" }} />
      </motion.g>
      <motion.g style={{ transformOrigin: "78px 102px" }} animate={reduce ? {} : { scaleY: [1, 1.035, 1], x: expression === "curious" ? [0, 3, 0] : 0 }} transition={{ duration: expression === "grounding" ? 3.8 : 2.6, repeat: Infinity, ease: "easeInOut" }}>
        <motion.path d="M27 99 Q17 117 37 131 L46 116Z" fill="var(--secondary)" stroke="var(--primary)" strokeWidth="2" style={{ transformOrigin: "36px 112px" }} animate={reduce ? {} : { rotate: [0, -7, 0] }} transition={{ duration: 3, repeat: Infinity }} />
        <motion.g data-part="left-ear" style={{ transformOrigin: "48px 50px" }} animate={reduce ? {} : { rotate: leftEar.rotate, y: [0, -3, 1, 0] }} transition={{ duration: leftEar.duration, repeat: Infinity, ease: "easeInOut" }}><path d="M33 70 L34 32 Q35 25 42 30 L60 46 Q43 51 33 70Z" fill="url(#saathi-fur)" stroke="var(--primary)" strokeWidth="2.5" /><path d="M39 39 L39 61 Q45 53 53 48Z" fill="var(--coral)" opacity=".48" /></motion.g>
        <motion.g data-part="right-ear" style={{ transformOrigin: "108px 50px" }} animate={reduce ? {} : { rotate: rightEar.rotate, y: [0, 2, -3, 0] }} transition={{ duration: rightEar.duration, repeat: Infinity, ease: "easeInOut", delay: .18 }}><path d="M95 46 L115 29 Q122 25 123 34 L122 75 Q112 54 95 46Z" fill="url(#saathi-fur)" stroke="var(--primary)" strokeWidth="2.5" /><path d="M116 39 L115 61 Q108 53 102 48Z" fill="var(--coral)" opacity=".48" /></motion.g>
        <path d="M34 65 Q43 46 61 43 Q78 38 95 43 Q114 47 122 66 L122 77 Q133 92 129 111 Q124 139 82 141 L69 141 Q26 139 25 109 Q23 87 34 65Z" fill="url(#saathi-fur)" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
        <ellipse cx="49" cy="97" rx="7" ry="4" fill="var(--coral)" opacity=".2" /><ellipse cx="107" cy="97" rx="7" ry="4" fill="var(--coral)" opacity=".2" />
        <motion.g data-part="eyes" style={{ transformOrigin: "78px 82px" }} animate={reduce ? {} : { scaleY: [1, 1, 0.06, 1, 1] }} transition={{ duration: 2.8, repeat: Infinity, times: [0, 0.55, 0.59, 0.63, 1] }}>{sleepy ? <path d="M53 80 Q60 86 67 80 M89 80 Q96 86 103 80" fill="none" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" /> : happy && !lively ? <><path d="M53 82 Q60 74 67 82 M89 82 Q96 74 103 82" fill="none" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" /></> : <motion.g data-part="pupils" animate={reduce ? {} : { x: pupils.x, y: pupils.y }} transition={{ duration: pupils.duration, ease: "easeInOut", repeat: Infinity }}><ellipse cx="60" cy="81" rx="4.8" ry={calm ? 4.5 : 6} fill="var(--ink)" /><ellipse cx="96" cy="81" rx="4.8" ry={calm ? 4.5 : 6} fill="var(--ink)" /><circle cx="58.5" cy="78.5" r="1.3" fill="var(--card)" /><circle cx="94.5" cy="78.5" r="1.3" fill="var(--card)" /></motion.g>}</motion.g>
        {expression === "thinking" && <motion.path d="M51 69 Q57 65 63 69" fill="none" stroke="var(--ink)" strokeWidth="1.5" animate={reduce ? {} : { y: [0, -2, 0] }} transition={{ duration: 2, repeat: Infinity }} />}
        <path d="M74 91 Q78 95 82 91 L78 89Z" fill="var(--coral)" />{sleepy ? <motion.ellipse cx="78" cy="101" rx="4" ry="3" fill="var(--ink)" style={{ transformOrigin: "78px 101px" }} animate={reduce ? {} : { scaleY: [0.4, 0.4, 2, 0.4], scaleX: [1, 1, 1.3, 1] }} transition={{ duration: 4, repeat: Infinity, times: [0, .5, .7, 1] }} /> : speaking ? <motion.ellipse cx="78" cy="101" rx="5" ry="4" fill="var(--ink)" animate={reduce ? {} : { scaleY: [0.5, 1.5, 0.7, 1.2, 0.5] }} style={{ transformOrigin: "78px 101px" }} transition={{ duration: 1.1, repeat: Infinity }} /> : <motion.path d={happy ? "M68 97 Q78 112 88 97" : expression === "listening" ? "M71 99 Q78 106 85 99" : expression === "supportive" ? "M71 101 Q78 106 85 101" : expression === "grounding" ? "M72 102 Q78 104 84 102" : expression === "thinking" ? "M75 100 Q79 97 83 101" : "M72 99 Q78 104 84 99"} fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" initial={false} animate={{ opacity: 1 }} />}
        <path d="M73 118 Q79 114 85 118 L86 130 Q79 133 72 130Z" fill="url(#saathi-light)" opacity=".9" /><path d="M79 115 V124 M74 120 H84" stroke="var(--warm)" strokeWidth="1.5" />
        <motion.g style={{ transformOrigin: "42px 125px" }} animate={reduce ? {} : { rotate: expression === "welcoming" ? [0, -30, 5, 0] : expression === "listening" ? [0, -9, 0] : expression === "handoff" ? [0, -22, 0] : expression === "celebrating" ? [0, -24, 0] : [0, -6, 0], y: expression === "welcoming" ? [0, -13, 0] : expression === "celebrating" ? [0, -8, 0] : 0 }} transition={{ duration: expression === "welcoming" ? 1.5 : expression === "celebrating" ? 1.1 : 2.7, repeat: Infinity }}><ellipse cx="43" cy="128" rx="12" ry="7" fill="var(--avatar)" stroke="var(--primary)" strokeWidth="2" /><path d="M37 129 V132 M43 130 V133" stroke="var(--primary)" strokeWidth="1" /></motion.g>
        <motion.g style={{ transformOrigin: "111px 125px" }} animate={reduce ? {} : { rotate: expression === "responding" ? [0, 24, -8, 0] : expression === "curious" ? [0, 10, 0] : expression === "celebrating" ? [0, 20, 0] : [0, 5, 0], y: expression === "responding" ? [0, -10, 0] : expression === "celebrating" ? [0, -6, 0] : 0 }} transition={{ duration: expression === "responding" ? 1.4 : expression === "celebrating" ? 1.1 : 3, repeat: Infinity }}><ellipse cx="111" cy="128" rx="12" ry="7" fill="var(--avatar)" stroke="var(--primary)" strokeWidth="2" /><path d="M110 130 V133 M116 129 V132" stroke="var(--primary)" strokeWidth="1" /></motion.g>
      </motion.g>
      {sleepy && !reduce && [0, 1].map(n => <motion.text key={`z${n}`} x={118 + n * 9} y={40 - n * 8} fontSize={9 + n * 3} fill="var(--primary)" fontWeight="700" animate={{ opacity: [0, 1, 0], y: [0, -10] }} transition={{ duration: 2.6, delay: n * 0.9, repeat: Infinity }}>z</motion.text>)}
      {(expression === "celebrating" || expression === "excited") && !reduce && [0, 1, 2, 3, 4].map(n => <motion.circle key={n} cx={25 + n * 26} cy={45 + n % 2 * 25} r="2.3" fill={n % 2 ? "var(--teal)" : "var(--coral)"} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 0], scale: [0, 1.6, 0], y: -24 }} transition={{ duration: 1.4, delay: n * 0.11, repeat: Infinity, repeatDelay: 1.2 }} />)}
    </motion.svg>
  );
}
