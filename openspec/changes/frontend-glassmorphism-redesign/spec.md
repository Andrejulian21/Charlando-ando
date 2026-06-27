# Spec: Frontend Glassmorphism Redesign

## Purpose

Replace all flat opaque surfaces in Charlando-ando with glassmorphism (frosted glass + spring physics + staggered entry). Six sequential phases; all phases gated on `prefers-reduced-motion`.

## Global Design Tokens

The system MUST define these CSS custom properties in `app.css` @theme:

| Token | Value | Role |
|-------|-------|------|
| `--glass-bg` | `rgba(18,18,28,0.6)` | Default glass surface |
| `--glass-bg-heavy` | `rgba(18,18,28,0.75)` | Modal/overlay glass |
| `--glass-blur` | `16px` | Default backdrop blur |
| `--glass-blur-heavy` | `24px` | Heavy backdrop blur |
| `--glass-border` | `rgba(255,255,255,0.06)` | Glass edge highlight |
| `--glass-glow` | `inset 0 1px 0 rgba(255,255,255,0.04)` | Inner edge refraction |
| `--spring-overshoot` | `cubic-bezier(0.34,1.56,0.64,1)` | Button/modal entry |
| `--spring-gentle` | `cubic-bezier(0.22,1.2,0.36,1)` | Panel/list entry |
| `--spring-standard` | `cubic-bezier(0.16,1,0.3,1)` | Hover transitions |

MUST also define utility classes: `.glass` (default), `.glass-heavy` (modal/composer), `.double-bezel` (outer p-1.5 + inner core).

### Requirement: Token Availability
The system MUST make all glass tokens and motion tokens resolvable in Tailwind v4 via `@theme`.

#### Scenario: Glass utility renders
- GIVEN the page loads
- WHEN a `<div className="glass">` is rendered
- THEN the element has `backdrop-blur-[16px]`, translucent dark bg, 1px white/6 border, and inner glow shadow

---

## Phase 1: CSS Foundation

### Requirement: Mesh Gradient Background
The system MUST render a multi-layer radial gradient background with purple (#6C5DD3) and emerald (#34D399) orbs on near-black (#050505) base as a React component.

#### Scenario: Background renders
- GIVEN the app loads
- WHEN any page mounts
- THEN two soft radial gradient orbs are visible, one purple-tinted, one emerald-tinted, blending on a deep black base

### Requirement: Spring Keyframes
The system MUST define `@keyframes spring-in` (scale 0.9→1.03→1 with `--spring-overshoot`) and `@keyframes slide-up` (translateY(12px)+opacity 0 → translateY(0)+opacity 1 with `--spring-gentle`).

#### Scenario: Spring animation plays
- GIVEN a newly mounted element with `.animate-spring-in`
- WHEN the element appears
- THEN it scales from 0.9 to 1.03 with overshoot then settles at 1 over 350ms
- AND if `prefers-reduced-motion`, it appears instantly at scale 1

---

## Phase 2: Core Components

### Requirement: Button Spring Press
Buttons MUST apply `active:scale-[0.97] transition-transform duration-150 [transition-timing-function:var(--spring-standard)]` on press and `hover:-translate-y-px` on hover.

### Requirement: Modal Glass Entry/Exit
Modal MUST enter with `scale(0.9)→scale(1.03)→scale(1)` overshoot + backdrop fade, and exit with reverse. Body uses `.glass-heavy` + `.double-bezel`.

### Requirement: Input/Textarea Glass
Input and Textarea MUST gain a glass variant (`.glass` surface, inner glow, `focus:ring-1 ring-white/10` border highlight).

### Requirement: Skeleton Shimmer
Skeleton MUST use a sweeping linear gradient animation (`shimmer` keyframe: translateX(-100%) → translateX(100%)) instead of opacity pulse.

### Requirement: Toast Notifications
The system MUST implement a Toast component: glass pill, fixed top-right, spring-in entry, auto-dismiss 4s, manual dismiss button.

**Acceptance Criteria (Phase 2)**
| # | Test |
|---|------|
| AC2.1 | Button visibly scales to 0.97 on click |
| AC2.2 | Modal enters with overshoot spring, exits with reverse |
| AC2.3 | Input renders translucent bg with blur |
| AC2.4 | Skeleton shows sweeping shimmer, not pulse |
| AC2.5 | Toast appears top-right, auto-dismisses in 4s |

---

## Phase 3: Layout & Navigation

### Requirement: ServerSidebar Fluid Island
ServerSidebar MUST be a 72px-wide floating glass rail, detached from top (`mt-4`) and bottom (`mb-4`), `rounded-2xl`, with `.glass` surface. Server icons MUST morph between `rounded-2xl` and `rounded-xl` using `transition-all duration-300 [timing-function:var(--spring-standard)]`.

### Requirement: ChannelList / DmList Glass Panel
Both panels MUST render as `.glass` surfaces with staggered entry: items delay `calc(var(--index) * 50ms)` for channels, `calc(var(--index) * 40ms)` for members.

### Requirement: Panel Toggle Animation
ChatLayout panel open/close MUST use spring slide + fade (NOT instant show/hide). `ChannelList` and `MemberList` MUST slide from the left/right with `translateX(-20px) opacity-0 → none opacity-100`.

### Requirement: UserFloatingBar Upgrade
UserFloatingBar MUST render with `.glass` surface and `backdrop-blur-[var(--glass-blur)]`, upgrading the existing `backdrop-blur-sm`.

**Acceptance Criteria (Phase 3)**
| # | Test |
|---|------|
| AC3.1 | Sidebar rail floats detached from viewport edges |
| AC3.2 | Channel list items cascade in with 50ms stagger |
| AC3.3 | Panel open shows slide transition, not instant pop |
| AC3.4 | User bar shows frosted glass with visible blur |

---

## Phase 4: Chat Surface

### Requirement: Composer Deduplication
MessageInput and DmComposer MUST be merged into a single `ChatComposer` component BEFORE glass styling is applied.

### Requirement: Floating Glass Composer
ChatComposer MUST render as a fixed-bottom centered glass bar (`.glass-heavy`, `w-full max-w-3xl mx-auto`, `rounded-[2rem]`), with spring expand on focus (`w-full max-w-3xl → w-full max-w-4xl` over 300ms), and a button-in-button send icon (nested circular wrapper with arrow icon).

### Requirement: Message Staggered Entry
New messages MUST enter with `slide-up` animation staggered at 30ms per item via `animation-delay: calc(var(--index) * 30ms)`.

### Requirement: Message Hover Glass
Message rows MUST show a subtle glass highlight on hover (`.glass` background appears, opacity 0→1 transition over 200ms).

**Acceptance Criteria (Phase 4)**
| # | Test |
|---|------|
| AC4.1 | Only one ChatComposer component in codebase |
| AC4.2 | Composer floats as glass bar with expand on focus |
| AC4.3 | New messages slide up with 30ms stagger |
| AC4.4 | Hovered message gets translucent glass highlight |

---

## Phase 5: Pages

### Requirement: Welcome Page Glass Cards
Feature cards on Welcome MUST use `.double-bezel` pattern with staggered entry (100ms per card) and spring lift on hover (`hover:scale-[1.02] translate-y-[-4px]` over 350ms).

### Requirement: Auth Glass Cards
Login/Register cards MUST use `.double-bezel` + `.glass` surface, replacing the existing `p-px` gradient wrapper, with spring-in entry on mount.

### Requirement: Page Transitions
Inertia page navigations MUST apply a 200ms crossfade (`opacity 0 → opacity 1`) via Inertia `onNavigate` event.

### Requirement: Settings Tab Indicator
Settings tab switch MUST animate a sliding underline indicator from the old tab to the new tab over 250ms spring.

**Acceptance Criteria (Phase 5)**
| # | Test |
|---|------|
| AC5.1 | Welcome feature cards enter staggered 100ms apart |
| AC5.2 | Auth card has visible double-bezel with inner glow |
| AC5.3 | Page navigation shows smooth opacity transition |
| AC5.4 | Settings tab indicator slides between tabs |

---

## Phase 6: Polish

### Requirement: Token Migration
All occurrences of raw `deep-space-*` tokens in Settings components MUST be replaced with semantic `surface-*` tokens.

### Requirement: Reduced-Motion Audit
The system MUST pass a `prefers-reduced-motion` audit: zero animations play when the OS preference is set. Springs flatten to instant, stagger delays collapse to 0ms, and all `animation`/`transition` properties are disabled.

#### Scenario: Reduced motion active
- GIVEN OS `prefers-reduced-motion: reduce` is set
- WHEN any page loads or any interaction occurs
- THEN no animation plays
- AND all elements appear at their final state instantly

### Requirement: Server Icon Spring Morph
Server icon `rounded-2xl → rounded-xl` hover transition MUST use `--spring-standard` curve (currently instant).

### Requirement: Presence Change Animation
Presence status dot changes MUST pulse once (`scale 1 → 1.3 → 1` over 300ms) when status changes.

**Acceptance Criteria (Phase 6)**
| # | Test |
|---|------|
| AC6.1 | Zero `deep-space-*` tokens in `Settings/` files |
| AC6.2 | `prefers-reduced-motion` disables all animations |
| AC6.3 | Server icon radius transition uses spring curve |
| AC6.4 | Presence dot pulses on status change |

---

## Responsive Spec (cross-phase)

| Breakpoint | Glass behavior |
|------------|---------------|
| `< 768px` | Panels use full-width glass (`w-full px-4`); ServerSidebar collapses to icon grid; Composer loses centered floating and goes edge-to-edge; double-bezel outer radius reduces to `rounded-[1.5rem]` |
| `< 640px` | Glass blur reduces to 8px (heavy reduced to 12px) to conserve GPU; staggered delays halved to preserve perceived speed |

## Accessibility Spec (cross-phase)

| Concern | Requirement |
|---------|-----------|
| Reduced motion | All animations MUST be disabled per `prefers-reduced-motion: reduce` |
| Focus indicators | Glass inputs MUST retain visible focus ring (`ring-2 ring-primary/50`) |
| Contrast | Glass surfaces backed by mesh gradient MUST maintain minimum contrast ratio of 3:1 for UI elements (WCAG AA non-text) |
