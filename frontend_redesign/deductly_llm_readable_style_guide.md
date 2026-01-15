# Deductly Design Style Guide (LLM-Readable)

This document defines **strict, machine-followable rules** for generating new Deductly pages that visually and structurally match the existing landing pages. Treat this as a *contract*: deviations should be intentional and justified.

---

## 1. Design Philosophy (High-Level)

**Aesthetic**: Boutique modernist, analytical, calm confidence
- Minimalist but not sterile
- Dense information, visually breathable
- Academic credibility + startup polish

**Vibe keywords** (do not overuse textually; use to guide decisions):
- Precise
- Measured
- Evidence-driven
- Quietly premium

Avoid:
- Loud gradients
- Over-animated UI
- Marketing hyperbole
- Emojis or playful icons

---

## 2. Global Layout Rules

### Page Structure
All pages follow this vertical rhythm:

1. **Hero / Section Header**
2. **Supporting explanation (1–3 short paragraphs)**
3. **Structured content block** (cards, grid, or list)
4. **Whitespace buffer**

Never place two dense content blocks back-to-back without whitespace.

### Width & Spacing
- Max content width: `max-w-6xl`
- Horizontal padding: `px-6 md:px-10`
- Section vertical spacing: `py-16 md:py-24`

---

## 3. Typography System

### Fonts

**Primary Sans (UI / Headings)**
- Font: `Schibsted Grotesk`
- Use for:
  - Headings
  - Navigation
  - Buttons
  - Labels

**Secondary Serif (Explanatory / Emphasis)**
- Font: `Zilla Slab`
- Use sparingly for:
  - Long-form explanations
  - Philosophical or pedagogical statements

Never mix serif and sans within the same sentence.

---

### Type Scale

| Element | Class Pattern | Notes |
|------|-------------|------|
| H1 | `text-4xl md:text-5xl font-semibold` | Only once per page |
| H2 | `text-3xl font-semibold` | Section anchors |
| H3 | `text-xl font-medium` | Card titles |
| Body | `text-base leading-relaxed` | Default text |
| Caption | `text-sm text-neutral-500` | Meta / disclaimers |

Line length target: **60–80 characters**.

---

## 4. Color System (Strict Tokens)

### Core Colors

```json
{
  "primary": "#5de619",
  "terracotta": "#E07A5F",
  "terracotta-soft": "#F2B5A7",
  "ink": "#0f172a",
  "muted": "#64748b",
  "border": "#e5e7eb",
  "surface": "#ffffff",
  "surface-muted": "#f8fafc"
}
```

### Usage Rules
- `primary`: highlights, bullets, underlines, micro-accents
- `ink`: all primary text
- `muted`: secondary text only
- `terracotta`: warnings, contrasts, emphasis—not CTAs

Never:
- Use gradients
- Use more than **2 accent colors** in a section

---

## 5. Components

### Buttons

**Primary Button**
```html
<button class="rounded-lg bg-primary text-ink px-6 py-3 font-medium">
```

Rules:
- No hover bounce
- Subtle hover darken only
- One primary CTA per section max

---

### Cards

```html
<div class="rounded-xl border border-border bg-surface p-6">
```

Card Rules:
- Flat (no heavy shadows)
- Optional `hover:border-ink/20`
- Content must be scannable in <5 seconds

---

### Grids

- Default: `grid md:grid-cols-2 lg:grid-cols-3 gap-6`
- Never exceed 3 columns
- Mobile is always single column

---

## 6. Iconography

- Icon set: Material Symbols (outlined)
- Size: `text-xl` or `text-2xl`
- Color: `text-muted` by default

Icons are **supportive**, never decorative.

---

## 7. Copywriting Rules (LLM-Critical)

### Tone
- Declarative, not promotional
- Confident but restrained
- Assumes an intelligent reader

### Sentence Rules
- Average sentence length: 12–18 words
- Prefer claims backed by structure or explanation
- Avoid exclamation points

### Banned Phrases
- "Revolutionary"
- "Game-changing"
- "Best-in-class"
- "Unlock your potential"

---

## 8. Page Composition Heuristics

When creating a new page:

1. Identify the **single core idea**
2. Decompose into **3–5 subclaims**
3. Assign each subclaim a card or section
4. Use whitespace to imply hierarchy

If unsure, choose **less UI, more spacing**.

---

## 9. Dark Mode Rules

- Background: `#020617`
- Text: `#e5e7eb`
- Borders: `#1e293b`

Dark mode mirrors light mode exactly—no redesign.

---

## 10. LLM Instruction Summary (Copy-Paste)

> When generating Deductly pages, follow a boutique modernist design system using Schibsted Grotesk and Zilla Slab, restrained color accents, flat bordered cards, generous whitespace, and academically toned copy. Favor clarity over decoration, structure over flourish, and quiet confidence over marketing language.

---

If you want, next we can:
- Convert this into a **JSON rule schema**
- Add **component templates** (Hero, Feature Grid, FAQ)
- Create a **lint checklist** for generated pages

