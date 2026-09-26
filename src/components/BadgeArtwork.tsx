import { motion, useReducedMotion } from "motion/react";
import { LockKeyhole } from "lucide-react";
import { journeyBadges, type BadgeDefinition } from "@/data/saathi";

export type BadgeKind = string;
const shapes: Record<string,string> = {
  "First Step":"M50 4 L63 13 L79 12 L86 26 L98 36 L94 51 L98 65 L83 75 L77 91 L60 90 L50 98 L37 89 L21 90 L14 75 L2 65 L6 50 L2 35 L17 26 L23 11 L39 13Z",
  "Reached Out":"M50 3 Q66 7 79 16 L95 19 L94 38 L99 50 L93 64 L95 81 L77 84 L65 95 L50 92 L35 95 L23 84 L5 81 L7 64 L1 50 L7 36 L5 19 L21 16 Q34 7 50 3Z",
  "Connected":"M50 2 L62 12 L78 8 L84 24 L99 28 L93 45 L99 58 L85 69 L85 86 L67 86 L50 99 L33 86 L15 86 L15 69 L1 58 L7 45 L1 28 L16 24 L22 8 L38 12Z",
  "Found Your Space":"M50 3 L90 20 L97 61 L78 90 L50 97 L22 90 L3 61 L10 20Z",
  "Staying Connected":"M50 3 Q72 8 89 20 L97 50 L89 80 Q72 92 50 97 Q28 92 11 80 L3 50 L11 20 Q28 8 50 3Z",
  "Shared Support":"M50 3 L64 13 L81 13 L87 29 L99 40 L93 55 L96 72 L79 80 L68 95 L50 90 L32 95 L21 80 L4 72 L7 55 L1 40 L13 29 L19 13 L36 13Z",
};
const motifs: Record<BadgeDefinition["motif"], React.ReactNode> = {
 sunrise:<><path d="M20 67 H80 M31 60 A19 19 0 0 1 69 60 M50 24 V32 M31 33 L37 39 M69 33 L63 39 M43 73 L50 66 L57 73"/></>,
 leaf:<><path d="M49 76 V53 M49 62 Q31 57 32 39 Q44 38 49 54 M49 57 Q68 56 69 33 Q55 34 49 51 M30 77 Q50 70 70 77"/></>,
 path:<><path d="M26 72 Q38 78 46 64 T69 48 T74 30 M69 31 L76 27 L79 35"/><circle cx="26" cy="71" r="3"/></>,
 bubbles:<><path d="M20 37 Q20 27 31 27 H55 Q65 27 65 38 V47 Q65 55 55 55 H39 L29 63 V54 Q20 53 20 45Z M45 62 H63 L72 69 V61 Q81 59 81 49 V43 Q81 36 71 36 H68"/></>,
 people:<><circle cx="37" cy="37" r="7"/><circle cx="63" cy="37" r="7"/><path d="M22 67 Q23 51 37 51 Q47 51 50 58 Q54 51 63 51 Q77 51 78 67 M45 44 Q50 49 55 44"/></>,
 home:<><path d="M18 49 L50 24 L82 49 M27 46 V75 H73 V46 M43 75 V54 H57 V75 M36 50 Q36 45 41 45"/></>,
 hands:<><path d="M19 57 Q32 48 43 57 L50 64 L57 57 Q68 48 81 57 L63 75 H37Z M27 49 Q25 39 35 36 L48 44 M73 49 Q75 39 65 36 L52 44 M50 25 Q56 20 61 25 Q64 30 50 39 Q36 30 39 25 Q44 20 50 25Z"/></>,
 stars:<><path d="M50 26 L55 42 L72 42 L58 52 L63 69 L50 59 L37 69 L42 52 L28 42 L45 42Z M23 67 L25 72 L30 74 L25 76 L23 81 L21 76 L16 74 L21 72Z M75 24 L77 29 L82 31 L77 33 L75 38 L73 33 L68 31 L73 29Z"/></>,
};

export function BadgeArtwork({ kind, locked = false, className = "size-24", celebrate = false }: { kind: BadgeKind; locked?: boolean; className?: string; celebrate?: boolean }) {
 const reduce=useReducedMotion();
 const definition=journeyBadges.find(b=>b.name===kind);
 const tone = definition?.theme === "Self-care" ? "var(--coral)" : definition?.theme === "Connection" ? "var(--primary)" : "var(--teal)";
 const motif=definition?.motif ?? "stars";
 const detail=motifs[motif];
 const shape=shapes[kind] ?? Object.values(shapes)[journeyBadges.findIndex(b=>b.name===kind)%6] ?? shapes["First Step"] ?? "";
 return <motion.span className={`relative inline-grid shrink-0 place-items-center ${className}`} initial={reduce?false:{scale:.82,opacity:0,rotate:-9,filter:"blur(4px)"}} animate={{scale:1,opacity:1,rotate:0,filter:"blur(0px)"}} transition={{type:"spring",stiffness:240,damping:18}}>
  <svg viewBox="0 0 100 100" className="!size-full overflow-visible" role="img" aria-label={`${kind} ${locked?"locked":"earned"} badge`}>
    <path d={shape} fill={locked?"var(--muted)":tone} opacity=".18" transform="translate(0 3)"/>
    <path d={shape} fill={locked?"var(--muted)":"var(--card)"} stroke={locked?"var(--border)":tone} strokeWidth="3"/>
    <path d={shape} fill="none" stroke={locked?"var(--border)":tone} strokeWidth="1" transform="translate(0 -3)" opacity=".5"/>
   <circle cx="50" cy="50" r="34" fill={locked?"var(--background)":"var(--primary-soft)"} stroke={locked?"var(--border)":tone} strokeWidth="1.5" strokeDasharray="3 3"/>
   <circle cx="50" cy="50" r="29" fill={locked?"var(--muted)":"var(--card)"}/>
   <g fill="none" stroke={locked?"var(--muted-foreground)":tone} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" opacity={locked?".7":"1"}>{detail}</g>
   <circle cx="50" cy="12" r="2.5" fill={locked?"var(--border)":tone}/><circle cx="50" cy="88" r="2.5" fill={locked?"var(--border)":tone}/>
   <path d="M21 22 Q38 7 58 12" fill="none" stroke="var(--card)" strokeWidth="2" opacity=".9"/>
  </svg>
  {locked&&<span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-soft"><LockKeyhole className="size-3"/></span>}
  {celebrate&&!reduce&&[0,1,2,3].map(n=><motion.span key={n} className="absolute size-1 rounded-full bg-coral" initial={{opacity:1,scale:0}} animate={{opacity:0,scale:1.5,x:(n%2?1:-1)*(30+n*5),y:n<2?-40:30}} transition={{duration:.8,delay:n*.06}}/>)}
 </motion.span>;
}
