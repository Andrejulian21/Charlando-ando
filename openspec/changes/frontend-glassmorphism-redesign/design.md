# Design: Frontend Glassmorphism Redesign

## Technical Approach

Transform Charlando-ando from flat opaque surfaces to a cohesive glassmorphism aesthetic using **pure CSS** (no new dependencies). The approach layers glass utility classes over a mesh gradient ambient background, replaces all linear transitions with spring-approximation cubic-beziers, and introduces staggered entry animations via CSS custom properties. Composer deduplication happens before glass styling to avoid double work. Each phase is an independent PR, reversible on its own.

## Architecture Decisions

### Decision: Pure CSS springs over framer-motion

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Pure CSS cubic-bezier | Zero bundle cost; GPU-safe; limited to transform/opacity | **Chosen** — covers 95% of needed motion |
| framer-motion | Layout animations, AnimatePresence; +45KB gzipped | Rejected for now; revisit in Phase 4 if panel slide proves insufficient |
| CSS + framer-motion hybrid | Best of both; complexity cost | Deferred until proven necessary |

### Decision: CSS @utility for glass surfaces

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Tailwind @utility classes | Single source of truth; composable; no JS runtime | **Chosen** — `.glass`, `.glass-heavy`, `.double-bezel` |
| React className constants | Type-safe; but duplicated across components | Rejected — CSS utilities are DRYer |
| Tailwind plugin | Reusable; but overkill for 3 utilities | Rejected |

### Decision: Composer deduplication before styling

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Style existing MessageInput + DmComposer separately | Faster; but doubles glass work and maintenance | Rejected |
| Extract ChatComposer first, then style | One component, one glass treatment; slightly more upfront work | **Chosen** |

### Decision: Mesh gradient as React component

| Option | Tradeoff | Decision |
|--------|----------|----------|
| CSS-only gradient on body | Simple; but no JS control for future blob animation | Rejected |
| React `<MeshGradient>` component | Isolated; can add requestAnimationFrame blob drift later | **Chosen** |

### Decision: Toast via Zustand store (not context)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| React Context + Provider | Standard; but adds provider wrapping in Inertia layout | Rejected |
| Zustand `useToastStore` | Consistent with existing store pattern; no provider needed | **Chosen** |

## Data Flow

```
MeshGradient (fixed bg) ──→ renders behind all pages
                              │
app.css @theme tokens ──→ .glass / .glass-heavy / .double-bezel utilities
                              │
                              ├──→ Button, Modal, Input, Textarea, Skeleton (Phase 2)
                              ├──→ ServerSidebar, ChannelList, DmList, UserFloatingBar (Phase 3)
                              ├──→ ChatComposer, MessageRow (Phase 4)
                              └──→ Welcome cards, Auth cards, Settings panels (Phase 5)

useToastStore ──→ <ToastContainer /> mounted in AppLayout
                     │
                     └──→ any component calls toast.success/error/info()

useUiStore ──→ panel open/close state ──→ ChatLayout spring slide (Phase 3)
```

## CSS Token Map (@theme additions)

```css
/* Glass surface tokens */
--glass-bg: rgba(18, 18, 28, 0.6);
--glass-bg-heavy: rgba(18, 18, 28, 0.75);
--glass-blur: 16px;
--glass-blur-heavy: 24px;
--glass-border: rgba(255, 255, 255, 0.06);
--glass-glow: inset 0 1px 0 rgba(255, 255, 255, 0.04);

/* Spring motion tokens */
--spring-overshoot: cubic-bezier(0.34, 1.56, 0.64, 1);
--spring-gentle: cubic-bezier(0.22, 1.2, 0.36, 1);
--spring-standard: cubic-bezier(0.16, 1, 0.3, 1);

/* Glass utility classes */
@utility glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-glow);
}
@utility glass-heavy {
  background: var(--glass-bg-heavy);
  backdrop-filter: blur(var(--glass-blur-heavy));
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-glow);
}
@utility double-bezel {
  padding: 6px;
  border-radius: 2rem;
  ring: 1px solid rgba(255, 255, 255, 0.1);
}

/* Keyframes */
@keyframes spring-in {
  0%   { opacity: 0; transform: scale(0.9); }
  70%  { opacity: 1; transform: scale(1.03); }
  100% { transform: scale(1); }
}
@keyframes slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position: 200% 0; }
}
@keyframes pulse-dot {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.3); }
}
```

## Component Design Specs

### Button (Phase 2)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger' \| 'glass'` | `'primary'` | Add glass variant |
| `glass` | `boolean` | `false` | Shortcut to apply `.glass` bg + spring press |

Changes: Add `active:scale-[0.97]` + `hover:-translate-y-px` + `transition-transform duration-200 [transition-timing-function:var(--spring-standard)]` to base class. New `glass` variant applies `.glass` utility + inner glow.

### Modal (Phase 2)

| Change | Detail |
|--------|--------|
| Entry animation | `animate-[spring-in_350ms_var(--spring-overshoot)]` replacing current `animate-in fade-in zoom-in-95` |
| Exit animation | CSS `@starting-style` + `opacity-0 scale-95` transition (or conditional class removal with transition) |
| Body surface | `.glass-heavy` + inner `shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]` |
| Overlay | `bg-black/70 backdrop-blur-md` (upgrade from `backdrop-blur-sm`) |

Note: For exit animation without framer-motion, use CSS `transition` on opacity+transform with a `data-closing` state managed by a local `useState` that delays unmount by 200ms.

### Input / Textarea (Phase 2)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `glass` | `boolean` | `false` | Applies `.glass` surface + `focus:ring-1 ring-white/10` |

Changes: When `glass=true`, replace `bg-surface border-border` with glass utility classes.

### Skeleton (Phase 2)

| Change | Detail |
|--------|--------|
| Animation | Replace `animate-pulse` with shimmer: `bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.04)_50%,transparent_100%)] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]` |

### Toast (Phase 2 — new)

**Component**: `resources/js/components/ui/Toast.jsx`
**Store**: `resources/js/stores/useToastStore.js`

```jsx
// useToastStore.js
create((set, get) => ({
  toasts: [],
  add: (toast) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, ...toast }] }));
    setTimeout(() => get().dismiss(id), toast.duration ?? 4000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Exported helpers
export const toast = {
  success: (msg) => useToastStore.getState().add({ type: 'success', message: msg }),
  error: (msg) => useToastStore.getState().add({ type: 'error', message: msg }),
  info: (msg) => useToastStore.getState().add({ type: 'info', message: msg }),
};
```

Toast component: glass pill, `fixed top-4 right-4 z-[60]`, `animate-[spring-in_300ms_var(--spring-overshoot)]`, auto-dismiss with progress bar. `<ToastContainer />` mounted in `AppLayout.jsx`.

### ChatComposer (Phase 4 — new, replaces MessageInput + DmComposer)

**File**: `resources/js/components/Chat/ChatComposer.jsx`

```jsx
// API
<ChatComposer
  actionUrl="/api/servers/1/messages"  // or "/api/dms/5/messages"
  room="server:1"                       // for store addMessage
  placeholder="Mensaje"
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `actionUrl` | `string` | POST endpoint |
| `room` | `string` | Room key for `addMessage` |
| `placeholder` | `string` | Textarea placeholder |

Surface: `.glass-heavy rounded-[2rem] w-full max-w-3xl mx-auto mb-3` floating bar. On focus: `max-w-4xl` transition over 300ms spring. Send button: nested circular wrapper (`w-8 h-8 rounded-full bg-primary/20`) with arrow icon (button-in-button pattern).

### ServerSidebar (Phase 3)

| Change | Detail |
|--------|--------|
| Container | `m-4 rounded-2xl .glass` (floating glass rail, detached from edges) |
| Remove `border-r` | Glass border replaces structural border |
| Icon morph | `transition-all duration-300 [transition-timing-function:var(--spring-standard)]` on `rounded-2xl → rounded-xl` |

### ChannelList / DmList (Phase 3)

| Change | Detail |
|--------|--------|
| Container | `.glass` surface replacing `bg-surface border-r border-border` |
| Stagger | Each item gets `style={{ '--index': i }}` + `animate-[slide-up_300ms_var(--spring-gentle)_calc(var(--index)*50ms)_both]` |

### ChatLayout Panel Animation (Phase 3)

Panels use CSS transitions on `transform` + `opacity`, controlled by `useUiStore` state:

```
ChannelList open:  translateX(0) opacity-1     (slide from left)
ChannelList closed: translateX(-20px) opacity-0  (hidden, not display:none)
MemberList open:   translateX(0) opacity-1      (slide from right)
MemberList closed:  translateX(20px) opacity-0
```

Implementation: Wrap panel content in a div with `transition: transform 300ms var(--spring-gentle), opacity 200ms ease`. Use `visibility: hidden` + `pointer-events: none` when closed (not conditional rendering) to allow CSS transition.

### MeshGradient Component (Phase 1 — new)

**File**: `resources/js/components/ui/MeshGradient.jsx`

```jsx
export default function MeshGradient({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 ${className}`}
      style={{
        background: `
          radial-gradient(ellipse 600px 400px at 20% 30%, rgba(108,93,211,0.15) 0%, transparent 70%),
          radial-gradient(ellipse 500px 350px at 80% 70%, rgba(52,211,153,0.08) 0%, transparent 70%),
          #050505
        `,
      }}
    />
  );
}
```

Mounted once in `AppLayout.jsx` behind all content. Future enhancement: `requestAnimationFrame` blob drift.

### Page Transitions (Phase 5)

Use Inertia `router.on('navigate', ...)` to set a global `navigating` state in `useUiStore`. The `<AppLayout>` wraps `{children}` in a div with:

```css
transition: opacity 200ms var(--spring-standard);
/* opacity: 0.4 when navigating, 1 when idle */
```

This creates a subtle crossfade on every Inertia navigation without framer-motion.

## Store Changes

### useUiStore additions

```js
// New state for page transitions
navigating: false,
setNavigating: (val) => set({ navigating: val }),

// New state for panel animation (replaces boolean show/hide)
panelTransitioning: null, // 'channelList' | 'memberList' | null
```

### useToastStore (new — Phase 2)

As described in Toast section above.

## Phase-by-Phase Implementation Plan

### Phase 1: CSS Foundation (1 file, ~150 lines)

| File | Action | Changes |
|------|--------|---------|
| `resources/css/app.css` | Modify | Add glass tokens, spring tokens, @utility glass/glass-heavy/double-bezel, @keyframes spring-in/slide-up/shimmer/pulse-dot, expand reduced-motion block |

### Phase 2: Core Components (7 files, ~500 lines)

| File | Action | Changes |
|------|--------|---------|
| `resources/js/components/ui/Button.jsx` | Modify | Add spring press, hover lift, glass variant |
| `resources/js/components/ui/Modal.jsx` | Modify | Spring entry/exit, glass-heavy body, overlay upgrade |
| `resources/js/components/ui/Input.jsx` | Modify | Add `glass` prop |
| `resources/js/components/ui/Textarea.jsx` | Modify | Add `glass` prop |
| `resources/js/components/ui/Skeleton.jsx` | Modify | Replace pulse with shimmer |
| `resources/js/components/ui/Toast.jsx` | Create | Glass pill toast component |
| `resources/js/stores/useToastStore.js` | Create | Toast state + helpers |
| `resources/js/components/Layout/AppLayout.jsx` | Modify | Mount `<ToastContainer />` + `<MeshGradient />` |
| `resources/js/components/ui/MeshGradient.jsx` | Create | Ambient gradient background |

### Phase 3: Layout & Navigation (5 files, ~600 lines)

| File | Action | Changes |
|------|--------|---------|
| `resources/js/components/Chat/ServerSidebar.jsx` | Modify | Floating glass rail, icon spring morph |
| `resources/js/components/Chat/ChannelList.jsx` | Modify | Glass surface, staggered entry |
| `resources/js/components/Dm/DmList.jsx` | Modify | Glass surface, staggered entry |
| `resources/js/components/Layout/ChatLayout.jsx` | Modify | Panel spring slide (CSS transitions, visibility-based) |
| `resources/js/components/Layout/UserFloatingBar.jsx` | Modify | Upgrade to `.glass` surface |
| `resources/js/stores/useUiStore.js` | Modify | Add `navigating`, panel transition state |

### Phase 4: Chat Surface (6 files, ~500 lines)

| File | Action | Changes |
|------|--------|---------|
| `resources/js/components/Chat/ChatComposer.jsx` | Create | Merged composer, floating glass bar, button-in-button send |
| `resources/js/components/Chat/MessageInput.jsx` | Delete | Replaced by ChatComposer |
| `resources/js/components/Dm/DmChat.jsx` | Modify | Remove inline DmComposer, import ChatComposer |
| `resources/js/components/Chat/MessageList.jsx` | Modify | Staggered entry on new messages, glass hover on MessageRow |
| `resources/js/pages/Chat/Show.jsx` | Modify | Use ChatComposer instead of MessageInput |
| `resources/js/pages/Dms/Show.jsx` | Modify | Use ChatComposer instead of inline DmComposer |

### Phase 5: Pages (10 files, ~400 lines)

| File | Action | Changes |
|------|--------|---------|
| `resources/js/pages/Welcome.jsx` | Modify | Double-bezel cards, staggered entry, mesh gradient bg, hover spring lift |
| `resources/js/pages/Auth/Login.jsx` | Modify | Double-bezel + glass card, spring-in entry |
| `resources/js/pages/Auth/Register.jsx` | Modify | Same as Login |
| `resources/js/pages/Settings/Index.jsx` | Modify | Glass sidebar, glass content panels |
| `resources/js/components/Settings/UserSettings.jsx` | Modify | Glass cards |
| `resources/js/components/Settings/ServerSettings.jsx` | Modify | Glass cards |
| `resources/js/components/Layout/AppLayout.jsx` | Modify | Page transition wrapper via Inertia onNavigate |
| `resources/js/pages/Chat/Index.jsx` | Modify | Mesh gradient bg |
| `resources/js/pages/Dms/Index.jsx` | Modify | Mesh gradient bg |
| `resources/js/components/Chat/MemberList.jsx` | Modify | Glass surface, staggered entry |

### Phase 6: Polish (7 files, ~300 lines)

| File | Action | Changes |
|------|--------|---------|
| `resources/js/components/Settings/UserSettings.jsx` | Modify | Replace all `deep-space-*` with `surface-*` |
| `resources/js/components/Settings/ServerSettings.jsx` | Modify | Replace all `deep-space-*` with `surface-*` |
| `resources/js/pages/Settings/Index.jsx` | Modify | Replace all `deep-space-*` with `surface-*` |
| `resources/js/components/Chat/ServerSidebar.jsx` | Modify | Spring morph on icon hover |
| `resources/js/components/Presence/PresenceBadge.jsx` | Modify | Pulse animation on status change |
| `resources/css/app.css` | Modify | Expanded reduced-motion audit, mobile blur reduction |
| All remaining files with `deep-space-*` | Modify | Final sweep |

## Responsive Design

| Breakpoint | Glass | Motion | Layout |
|------------|-------|--------|--------|
| `>= 1024px` | Full blur (16px/24px), double-bezel `2rem` radius | Full spring stagger | All panels visible |
| `768–1023px` | Full blur, double-bezel `1.5rem` radius | Full stagger | MemberList hidden by default |
| `< 768px` | Full blur, double-bezel `1.5rem` | Stagger delays halved | ServerSidebar collapses to icon grid; Composer edge-to-edge |
| `< 640px` | Blur reduced to 8px (heavy 12px) for GPU | Delays halved again | Single column; panels become overlays |

## Accessibility

| Concern | Approach |
|---------|----------|
| `prefers-reduced-motion: reduce` | Expand existing media query to: disable all `animation` (set `none`), collapse all `transition-duration` to `0s`, set stagger `animation-delay` to `0ms` |
| Focus indicators | Glass inputs retain `focus:ring-2 ring-primary/50 ring-offset-0` — visible on translucent bg |
| Contrast | Glass surfaces (`rgba(18,18,28,0.6)`) over `#050505` base yield ~#0E0E16 effective bg — text `#E5E7EB` maintains >7:1 ratio (WCAG AAA) |
| Toast | `role="alert"` + `aria-live="polite"` for non-blocking; `aria-live="assertive"` for error type |

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Toast store add/dismiss/auto-dismiss | Vitest + fake timers |
| Unit | ChatComposer send/keydown/auto-grow | Vitest + @testing-library/react |
| Unit | MeshGradient renders with aria-hidden | Vitest |
| Integration | Modal spring entry/exit cycle | @testing-library + user-event |
| Visual | Glass utility renders correctly | Playwright screenshot comparison (optional) |
| A11y | Reduced-motion disables animations | Playwright with `prefers-reduced-motion` emulated |

## Migration / Rollout

No data migration. Each phase is a chained PR. Rollback = revert the PR. Token cleanup (Phase 6) keeps `deep-space-*` aliases in @theme for backward compat during transition; aliases removed only after full sweep verified.

## Open Questions

- [ ] Phase 4: If CSS panel slide feels janky on mobile, install `framer-motion` for `AnimatePresence` + layout animations? Decision deferred until Phase 3 is tested on device.
- [ ] MeshGradient: Add `requestAnimationFrame` blob drift in Phase 1 or defer to a follow-up? Recommendation: defer — static gradient is sufficient for v1.
- [ ] Toast: Should error toasts persist longer (6s) or require manual dismiss? Spec says 4s auto; can override per-call via `toast.error(msg, { duration: 6000 })`.
