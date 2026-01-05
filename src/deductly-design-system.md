# Deductly Design System

A comprehensive guide to the Deductly visual language. Use this document as context when building any component, page, or feature for the platform.

---

## Brand Essence

Deductly's design communicates **intelligence without intimidation**. We're a sophisticated diagnostic tool that feels approachable, not clinical. The aesthetic is **dark editorial**—think high-end magazine meets data visualization, not SaaS dashboard.

**Core tension we resolve:** Test prep is stressful. Our design should feel calm, confident, and premium—a refuge from anxiety, not a source of it.

---

## Color System

### Backgrounds
```css
--bg-primary: #0a0a0f;        /* Deepest background */
--bg-secondary: #12121a;       /* Card backgrounds, elevated surfaces */
--bg-tertiary: #1a1a24;        /* Hover states, subtle elevation */
--bg-card: linear-gradient(165deg, rgba(30, 30, 40, 0.9) 0%, rgba(20, 20, 28, 0.95) 100%);
```

### Ambient Gradients
Always include subtle color pollution in backgrounds for depth:
```css
--ambient-purple: radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.07) 0%, transparent 40%);
--ambient-pink: radial-gradient(circle at 80% 60%, rgba(236, 72, 153, 0.05) 0%, transparent 40%);
--ambient-green: radial-gradient(circle at 40% 80%, rgba(34, 197, 94, 0.04) 0%, transparent 30%);
```

### Brand Colors
```css
--brand-primary: #6366f1;      /* Indigo - primary actions, highlights */
--brand-secondary: #8b5cf6;    /* Violet - gradients, accents */
--brand-tertiary: #a78bfa;     /* Light violet - projections, secondary data */
```

### Semantic Colors
```css
--success: #22c55e;            /* Green - strengths, improvements, positive */
--success-glow: rgba(34, 197, 94, 0.4);
--warning: #eab308;            /* Yellow - moderate performance */
--danger: #ef4444;             /* Red - weaknesses, areas needing work */
--danger-glow: rgba(239, 68, 68, 0.4);
```

### Text Colors
```css
--text-primary: #ffffff;
--text-secondary: rgba(255, 255, 255, 0.7);
--text-tertiary: rgba(255, 255, 255, 0.5);
--text-muted: rgba(255, 255, 255, 0.4);
--text-faint: rgba(255, 255, 255, 0.3);
```

### Borders & Surfaces
```css
--border-subtle: rgba(255, 255, 255, 0.06);
--border-default: rgba(255, 255, 255, 0.08);
--border-hover: rgba(255, 255, 255, 0.15);
--border-active: rgba(99, 102, 241, 0.3);
```

---

## Typography

### Font Stack
```css
--font-display: 'Instrument Serif', Georgia, serif;
--font-body: 'DM Sans', -apple-system, sans-serif;
```

**Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
```

### Type Scale

| Name | Size | Weight | Font | Use |
|------|------|--------|------|-----|
| Display XL | 72-80px | 400 | Instrument Serif | Hero headlines, large scores |
| Display L | 48-64px | 400 | Instrument Serif | Section titles, featured numbers |
| Display M | 36px | 400 | Instrument Serif | Card titles, skill names |
| Display S | 24-28px | 400 | Instrument Serif | Subsection headers, medium scores |
| Body L | 20px | 400 | DM Sans | Lead paragraphs, subtitles |
| Body M | 15-16px | 400/500 | DM Sans | Default body text |
| Body S | 13-14px | 400/500 | DM Sans | Secondary text, descriptions |
| Caption | 11px | 500 | DM Sans | Labels, uppercase text |

### Typography Rules

1. **Instrument Serif** is reserved for:
   - Headlines and titles
   - Large numerical displays (scores, stats)
   - Emphasis moments (the "wow" content)
   - Use italic sparingly for key highlighted words

2. **DM Sans** is used for:
   - All body text
   - Navigation
   - Buttons
   - Labels and captions
   - Small numerical data

3. **Letter spacing:**
   - Display text: -1px to -2px (tighter)
   - Uppercase labels: +2px tracking
   - Body text: default

4. **Line heights:**
   - Display: 1.05-1.1
   - Body: 1.5-1.6

---

## Spacing System

Base unit: 4px

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
--space-32: 128px;
```

### Spacing Guidelines

- **Card padding:** 32-48px
- **Section padding:** 80-120px vertical
- **Component gaps:** 12-24px
- **Text blocks:** 16-32px between elements
- **Grid gaps:** 32px default

---

## Components

### Cards

```css
.card {
  background: linear-gradient(165deg, rgba(30, 30, 40, 0.9) 0%, rgba(20, 20, 28, 0.95) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 32px;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 25px 80px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.card-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 500;
}
```

**Card variants:**
- Default: As above
- Elevated: Stronger shadow, slight scale on hover
- Interactive: Border highlight on hover, subtle lift
- Featured: Top gradient border accent

### Buttons

**Primary:**
```css
.btn-primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  padding: 16px 32px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 40px rgba(99, 102, 241, 0.4);
}
```

**Secondary:**
```css
.btn-secondary {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  padding: 16px 32px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}
```

**Ghost/Text:**
```css
.btn-ghost {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  padding: 12px 0;
  font-size: 14px;
}

.btn-ghost:hover {
  color: rgba(255, 255, 255, 0.8);
}
```

### Badges & Pills

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 100px;
  font-size: 13px;
  color: #a5b4fc;
}

.badge-success {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.3);
  color: #4ade80;
}

.badge-danger {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}
```

### Scale Bars (LSAT 120-180)

```css
.scale-container {
  /* Container for the full visualization */
}

.scale-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  margin-bottom: 8px;
}

.scale-bar {
  height: 12px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  position: relative;
}

.range-band {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 6px;
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.score-marker {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: left 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
```

### Score helper function:
```javascript
const scoreToPercent = (score, min = 120, max = 180) => {
  return ((score - min) / (max - min)) * 100;
};

const getScoreColor = (score) => {
  if (score >= 170) return '#22c55e';
  if (score >= 160) return '#eab308';
  return '#ef4444';
};
```

---

## Animation

### Easing Functions
```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--ease-out-cubic: cubic-bezier(0.33, 1, 0.68, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
```

### Standard Transitions
```css
--transition-fast: 0.15s ease;
--transition-default: 0.2s ease;
--transition-slow: 0.3s ease;
--transition-dramatic: 0.8s cubic-bezier(0.16, 1, 0.3, 1);
```

### Animation Patterns

**Card entrance:**
```css
@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.card {
  animation: cardEnter 0.5s ease-out;
}
```

**Staggered list items:**
```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.list-item {
  animation: slideIn 0.4s ease-out forwards;
  animation-delay: calc(var(--index) * 60ms);
}
```

**Floating elements:**
```css
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(2deg); }
  50% { transform: translateY(-15px) rotate(0deg); }
}

.floating-card {
  animation: float 6s ease-in-out infinite;
}
```

**Number counting:**
```javascript
const animateNumber = (from, to, duration, onUpdate) => {
  const startTime = Date.now();
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
    onUpdate(Math.round(from + (to - from) * eased));
    if (progress < 1) requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
};
```

---

## Shadows

```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
--shadow-md: 0 8px 24px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 15px 40px rgba(0, 0, 0, 0.4);
--shadow-xl: 0 25px 80px rgba(0, 0, 0, 0.5);

/* Colored glows */
--glow-primary: 0 0 40px rgba(99, 102, 241, 0.4);
--glow-success: 0 0 40px rgba(34, 197, 94, 0.4);
--glow-danger: 0 0 40px rgba(239, 68, 68, 0.4);
```

---

## Layout

### Container Widths
```css
--container-sm: 480px;
--container-md: 720px;
--container-lg: 960px;
--container-xl: 1200px;
--container-2xl: 1400px;
```

### Grid System
Default gap: 32px
Card grid: 3 columns on desktop, 1 on mobile

```css
.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

@media (max-width: 1024px) {
  .grid-3 { grid-template-columns: 1fr; }
}
```

### Breakpoints
```css
--bp-sm: 640px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
--bp-2xl: 1536px;
```

---

## Iconography

Use Lucide icons (lucide-react) with:
- Stroke width: 2
- Size: 16-24px typically
- Color: currentColor (inherits from parent)

For feature icons in cards:
```css
.icon-container {
  width: 48px;
  height: 48px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
}
```

---

## Do's and Don'ts

### Do:
- Use generous whitespace
- Let scores and key data breathe
- Animate entrances and data reveals
- Use the 120-180 LSAT scale consistently
- Show confidence ranges, not false precision
- Use color semantically (green=good, red=needs work)
- Keep card content focused—one idea per card

### Don't:
- Use pure white backgrounds
- Overcrowd cards with data
- Use more than 2-3 colors per component
- Animate everything—save it for key moments
- Use generic sans-serif fonts
- Show raw percentages when LSAT scale is clearer
- Use harsh borders or outlines

---

## Component Checklist

When building any new component, verify:

- [ ] Uses correct font pairing (Instrument Serif for display, DM Sans for body)
- [ ] Card follows gradient + border + shadow pattern
- [ ] Colors match semantic meaning
- [ ] Proper spacing using 4px base
- [ ] Includes subtle hover/transition states
- [ ] Entrance animation if it's a key element
- [ ] Works on dark background
- [ ] Mobile responsive
- [ ] Accessible (contrast, focus states)

---

## File Organization

```
/components
  /ui
    Button.jsx
    Card.jsx
    Badge.jsx
    ScaleBar.jsx
  /diagnostic
    ScoreReveal.jsx
    StrengthCard.jsx
    WeaknessCard.jsx
    SkillBreakdown.jsx
  /layout
    Nav.jsx
    Footer.jsx
    Container.jsx

/styles
  globals.css       # CSS variables, base styles
  animations.css    # Keyframes, transitions

/lib
  constants.js      # Colors, breakpoints as JS
  utils.js          # scoreToPercent, getScoreColor, etc.
```

---

## Sample Globals.css

```css
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

:root {
  /* Paste all CSS variables from above */
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'DM Sans', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

::selection {
  background: rgba(99, 102, 241, 0.3);
}
```

---

This design system should give you everything needed to build consistent, on-brand components across the entire Deductly platform. When in doubt, reference the diagnostic reveal cards—they represent the platonic ideal of the Deductly aesthetic.
