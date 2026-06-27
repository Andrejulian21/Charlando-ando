# Proposal: Frontend Glassmorphism Redesign

## 1. Executive Summary

Redesign Charlando-ando's UI from flat opaque surfaces to a cohesive **glassmorphism** aesthetic. All panels become frosted glass with `backdrop-blur`, backed by animated mesh gradients. Spring physics replace linear transitions. Double-bezel card architecture and staggered entry animations create haptic depth. The change touches ~34 files and ~2,550 lines, delivered in 6 sequential phases.

## 2. Scope

### In Scope
- Glass tokens + motion utilities in `app.css`
- Glass variants for Button, Modal, Input, Textarea, Skeleton
- Frosted panels: ServerSidebar, ChannelList, DmList, MemberList, UserFloatingBar
- Floating glass composer (MessageInput / DmComposer deduplicated)
- Mesh gradient ambient backgrounds
- Spring physics on all transitions
- Staggered entry animations for lists, messages, feature cards
- Micro-interactions: scale on press, magnetic hover, spring return
- Toast/notification system
- Page transition wrapper via Inertia `onNavigate`
- Token cleanup: migrate raw `deep-space-*` to semantic `surface-*`

### Out of Scope
- New features or API changes
- Light mode (dark-only)
- Icon library swap (keep Lucide)
- Backend changes
- Framework migration

## 3. Aesthetic Direction

| Element | Spec |
|---------|------|
| Glass surface | `bg-[rgba(18,18,28,0.6)] backdrop-blur-[16px] border border-white/[0.06]` |
| Inner edge highlight | `shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]` |
| Double-bezel | Outer shell `p-1.5 rounded-[2rem] ring-1 ring-white/10` + inner core `rounded-[calc(2rem-0.375rem)]` |
| Spring curves | `cubic-bezier(0.34,1.56,0.64,1)` (overshoot), `cubic-bezier(0.22,1.2,0.36,1)` (gentle) |
| Ambient bg | Multi-layer radial mesh gradients (purple/emerald orbs on `#050505`) |
| Server sidebar | Fluid Island: floating 72px glass rail, detached from edges |

## 4. Phased Approach

| Phase | Focus | Est. Lines | Files |
|-------|-------|------------|-------|
| 1 | Design tokens + utilities (`app.css`) | 150 | 1 |
| 2 | Core primitives (Button, Modal, Input, Skeleton, Toast) | 500 | 7 |
| 3 | Layout + navigation (sidebar, panels, ChatLayout) | 600 | 3 |
| 4 | Chat surface (composer, message entry, hover) | 500 | 6 |
| 5 | Pages (Welcome, Auth, Settings, transitions) | 400 | 10 |
| 6 | Polish (token cleanup, reduced-motion audit) | 300 | 7 |

## 5. Design Principles

1. **Glass first**: Every panel, modal, and input gets a glass treatment or sits on a mesh gradient.
2. **Spring everything**: No `ease-in-out`. All transitions use custom cubic-bezier spring approximations.
3. **Stagger on mount**: Lists, grids, and messages cascade in with `animation-delay` per item.
4. **Micro-interactions**: `active:scale-[0.97]` on buttons; hover lift + glow on cards.
5. **Respect motion**: All animations gated behind `prefers-reduced-motion`.

## 6. Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Pure CSS spring (no animation library yet) | Avoids new dependency for Phase 1–3; evaluate `framer-motion` in Phase 4 if layout animations prove insufficient. |
| Deduplicate MessageInput/DmComposer first | Prevents doubling glass styling work; extract shared `Composer` component. |
| Semantic token migration before glass | Raw `deep-space-*` tokens break glass opacity math; must migrate to `surface-*` first. |
| Mesh gradient as React component | Keeps CSS clean; allows JS-driven blob animation later. |
| Island-style ServerSidebar | Detached glass rail creates spatial hierarchy and references macOS Dock. |

## 7. Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| GPU pressure from blur | Medium | Use `will-change: transform` sparingly; limit `backdrop-blur` to fixed/sticky elements only. |
| Accessibility (motion) | Medium | Expand `prefers-reduced-motion` to disable springs and stagger; provide instant fallback. |
| CSS spring limitations | Medium | If cubic-bezier proves insufficient for layout shifts, install `framer-motion` in Phase 4. |
| Token migration breaks settings | Low | Migrate `deep-space-*` → `surface-*` in Phase 6 after glass is proven; keep both during transition. |
| 2,550-line review burden | High | Deliver as chained PRs per phase (6 PRs), each under 400 lines. |

## 8. Estimated Size

- **Files touched**: 34
- **Lines changed**: ~2,550
- **Review strategy**: Chained PRs (6 phases → 6 PRs)

## 9. Dependencies

| Prerequisite | Blocks |
|--------------|--------|
| Phase 1 complete (tokens) | Phases 2–6 |
| MessageInput/DmComposer dedup | Phase 4 |
| `framer-motion` decision (Phase 4) | Complex layout animations if CSS spring fails |
| Reduced-motion audit (Phase 6) | Ship gate |

## Rollback Plan

Each phase is self-contained. Revert any phase by reverting its PR. Token migration (Phase 6) is last and easily reversible. If glass causes performance issues, fall back to opaque surfaces by removing `backdrop-blur` classes while keeping spring curves.

## Success Criteria

- [ ] All panels render with glassmorphism (`backdrop-blur` + inner glow visible)
- [ ] Zero `linear` or `ease-in-out` transitions remain in UI components
- [ ] `prefers-reduced-motion` disables all springs and stagger
- [ ] No raw `deep-space-*` tokens in Settings components
- [ ] Composer component deduplicated and styled
- [ ] Each phase PR passes `npx vitest run` and `npm run build`
