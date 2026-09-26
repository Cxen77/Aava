# SAATHI — Prototype Porting Guide: Web to Expo (React Native)

> This guide documents the exact translation of prototype components located in `src/components/` and `src/data/` into production React Native equivalents using **Expo SDK, NativeWind, react-native-svg, and react-native-reanimated**.

---

## 1. Design Token Translation (OKLCH to Hex for NativeWind)

The prototype defines its design system in [`src/styles.css`](file:///c:/Users/Dev/Desktop/cb0de929-c262-47c0-a8e1-7dfd728e8e8c/src/styles.css) using CSS variables and modern OKLCH color spaces. For NativeWind / React Native styling, these are converted into hex color codes for `tailwind.config.js`:

```javascript
// apps/mobile/tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f5f4fd",       // Light lilac/gray backdrop
        foreground: "#16192b",       // Dark slate/indigo text
        card: "#ffffff",
        primary: {
          DEFAULT: "#4b3ea6",        // Signature SAATHI Indigo
          soft: "#e8e6ff",           // Soft lavender card background
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#e4e1fb",
          foreground: "#36267d",
        },
        muted: {
          DEFAULT: "#edecf8",
          foreground: "#63687e",
        },
        ink: {
          DEFAULT: "#322b70",        // Deep night indigo for Journey card
          foreground: "#fbfbfe",
        },
        coral: {
          DEFAULT: "#dd6b5d",        // Warmth streak and "Good" mood glow
        },
        teal: {
          DEFAULT: "#007759",        // Progress, unlocked badges, milestone checkmarks
          soft: "#cff6e7",
        },
        warm: {
          DEFAULT: "#ffe7d9",
          foreground: "#743513",
        },
        destructive: {
          DEFAULT: "#cc3d3d",
          soft: "#faeaea",
        },
        border: "#e7e5f3",
      },
      borderRadius: {
        "xl": "16px",
        "2xl": "20px",
        "3xl": "26px",
      },
    },
  },
  plugins: [],
};
```

---

## 2. Porting `SaathiCompanion.tsx` (14 Expressions)

### 2.1 Overview & Architecture
The SAATHI mascot is an articulated SVG cat whose public API must maintain the **14 canonical expression names**:
`"idle" | "happy" | "thinking" | "listening" | "supportive" | "grounding" | "celebrating" | "curious" | "welcoming" | "responding" | "voice" | "handoff" | "excited" | "sleepy"`

> [!IMPORTANT]
> **Companion Rule:** The chat cat reacts strictly to explicit UI interaction events (`composing`, `sent`, `thinking`, `responding`, `voice`, `handoff`), **never** to inferred clinical message sentiment.

### 2.2 React Native Implementation Structure
In React Native, SVG elements cannot be directly styled with CSS classes. Use `react-native-svg` and wrap animated groups with `Animated.createAnimatedComponent(G)`:

```tsx
// apps/mobile/src/components/SaathiCompanion.tsx
import React, { useEffect } from "react";
import Svg, { Path, Circle, G, Defs, RadialGradient, Stop } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";

export type CompanionExpression =
  | "idle"
  | "happy"
  | "thinking"
  | "listening"
  | "supportive"
  | "grounding"
  | "celebrating"
  | "curious"
  | "welcoming"
  | "responding"
  | "voice"
  | "handoff"
  | "excited"
  | "sleepy";

interface SaathiCompanionProps {
  expression?: CompanionExpression;
  size?: number;
}

const AnimatedG = Animated.createAnimatedComponent(G);

export const SaathiCompanion: React.FC<SaathiCompanionProps> = ({
  expression = "idle",
  size = 120,
}) => {
  const reducedMotion = useReducedMotion();
  const bodyY = useSharedValue(0);
  const tailRotate = useSharedValue(0);
  const earRotate = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      bodyY.value = 0;
      tailRotate.value = 0;
      earRotate.value = 0;
      return;
    }

    // Example: Celebrating / Excited loop
    if (expression === "celebrating" || expression === "happy") {
      bodyY.value = withRepeat(
        withSequence(
          withTiming(-12, { duration: 600, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 500, easing: Easing.in(Easing.quad) })
        ),
        -1,
        true
      );
      tailRotate.value = withRepeat(
        withSequence(
          withTiming(30, { duration: 400 }),
          withTiming(-20, { duration: 400 })
        ),
        -1,
        true
      );
    } else {
      // Gentle breathing idle
      bodyY.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    }
  }, [expression, reducedMotion]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bodyY.value }],
  }));

  const tailStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${tailRotate.value}deg` }],
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      {/* Soft Ground Shadow */}
      <Circle cx="80" cy="148" r="36" fill="#4b3ea6" opacity={0.12} />
      
      {/* Animated Body Group */}
      <AnimatedG style={bodyStyle}>
        {/* Animated Tail */}
        <AnimatedG style={tailStyle} origin="120, 120">
          <Path
            d="M110 115 C130 110, 145 90, 135 75 C125 60, 115 70, 120 85"
            stroke="#4b3ea6"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
        </AnimatedG>
        {/* Cat Body & Head SVGs from prototype... */}
      </AnimatedG>
    </Svg>
  );
};
```

---

## 3. Porting `BadgeArtwork.tsx`

The badge silhouettes and motifs are defined in [`src/components/BadgeArtwork.tsx`](file:///c:/Users/Dev/Desktop/cb0de929-c262-47c0-a8e1-7dfd728e8e8c/src/components/BadgeArtwork.tsx):
- **Motifs:** `sunrise`, `leaf`, `path`, `bubbles`, `people`, `home`, `hands`, `stars`.
- **Silhouettes:** Scalloped geometric SVG paths (`First Step`, `Reached Out`, `Connected`, `Found Your Space`, `Staying Connected`, `Shared Support`).

### Translation Strategy:
- Replace `motion.span` with `Animated.View` from Reanimated.
- Render SVG using `react-native-svg` (`Path`, `Circle`, `G`).
- Locked state displays `#edecf8` background, `#e7e5f3` stroke, and an overlay lock icon from `lucide-react-native` (`LockKeyhole`).
- Unlocked state renders with theme tint (`#dd6b5d` for Self-care, `#4b3ea6` for Connection, `#007759` for Community).

---

## 4. Porting `CheckinCalendar.tsx`

The calendar screen renders:
1. **Month Navigator:** Previous/Next month controls.
2. **Calendar Grid:** 7 columns (Mon–Sun). Each cell displays date number, mini companion glyph (`MoodGlyph`), and activity indicator dots (`saathi`, `listener`, `community`, `support`).
3. **Cubic Trend Curve:** SVG path built from monthly mood values:
   ```typescript
   // Cubic Bézier calculation ported from prototype
   const path = pts.map((p, i) => {
     if (i === 0) return `M${p.x},${p.y}`;
     const prev = pts[i - 1];
     const cx = (prev.x + p.x) / 2;
     return `C${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`;
   }).join(" ");
   ```
4. **Day Detail Bottom Sheet:** Tapping any day opens a native bottom sheet modal showing the logged note and activity breakdown.

---

## 5. Porting `JourneyExperience.tsx`

1. **Curved Milestone Path:**
   - 8 milestones connected by a serpentine dotted SVG curve.
   - Offsets array: `[0, 26, 5, 32, 8, 28, 2, 22]`.
   - Completed milestones fill with solid `#4b3ea6` stroke; upcoming milestones remain dotted `#e7e5f3`.
2. **Badge Collection Grid:**
   - 2-column grid with filter tabs (`All`, `Earned`, `Locked`) and theme dropdown (`Self-care`, `Connection`, `Community`).
   - Tapping any badge opens the detail dialog with requirement and progress bar.

---

## 6. Porting `SaathiNotification.tsx`

- Maps 8 notification types to companion expressions:
  - `checkin` → `calm`
  - `supportive` → `supportive`
  - `listener` → `listening`
  - `group` → `happy`
  - `milestone` → `excited`
  - `badge` → `celebrating`
  - `streak` → `celebrating`
  - `evening` → `sleepy`
- Rendered on mobile as an animated slide-down in-app banner with haptic feedback (`expo-haptics`).
