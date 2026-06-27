# Design: UI/UX Redesign — Charlando-ando

## 1. Estructura de directorios propuesta

```
resources/
├── css/
│   └── app.css                          # Rediseño completo de tokens
├── js/
│   ├── components/
│   │   ├── ui/                          # NUEVO — primitivas atómicas
│   │   │   ├── Button.jsx               # variant/size/loading/disabled
│   │   │   ├── Input.jsx                # label/error/hint/icon prefix
│   │   │   ├── Textarea.jsx             # auto-grow, char counter
│   │   │   ├── Icon.jsx                 # Lucide wrapper
│   │   │   ├── Avatar.jsx               # Reemplaza Presence/UserAvatar
│   │   │   ├── Modal.jsx                # focus trap + backdrop + Escape
│   │   │   ├── EmptyState.jsx           # title/description/icon/action
│   │   │   ├── Skeleton.jsx             # pulse/wave animation
│   │   │   ├── Spinner.jsx              # loading indicator
│   │   │   ├── Badge.jsx                # status/count badges
│   │   │   └── index.js                 # barrel export
│   │   ├── Chat/
│   │   │   ├── ServerSidebar.jsx        # Refactor: Icon, Avatar, tokens
│   │   │   ├── ChannelList.jsx          # Refactor: Icon, tokens, responsive
│   │   │   ├── ChatHeader.jsx           # Refactor: Icon, tokens
│   │   │   ├── MemberList.jsx           # Refactor: Icon, Avatar, tokens
│   │   │   ├── MessageList.jsx          # Refactor: tokens, hover states
│   │   │   ├── MessageInput.jsx         # Refactor: Textarea, tokens
│   │   │   ├── UserSearchModal.jsx      # Refactor: Modal, Input, Icon
│   │   │   ├── ServerCreateModal.jsx    # Refactor: Modal, Input, Button
│   │   │   └── __tests__/
│   │   ├── Layout/
│   │   │   ├── AppLayout.jsx            # Refactor: ChatLayout shell
│   │   │   ├── ChatLayout.jsx           # NUEVO — responsive shell
│   │   │   ├── SettingsSidebar.jsx      # NUEVO — deduplicado de Settings
│   │   │   └── UserFloatingBar.jsx      # Refactor: Icon, Avatar, tokens
│   │   ├── Presence/
│   │   │   ├── UserAvatar.jsx           # DEPRECATED → re-export de ui/Avatar
│   │   │   ├── PresenceBadge.jsx        # Refactor: tokens
│   │   │   └── LastSeen.jsx             # Sin cambios de token
│   │   ├── Settings/
│   │   │   ├── UserSettings.jsx         # Refactor: Input, Button, tokens
│   │   │   └── ServerSettings.jsx       # Refactor: Input, Button, Badge, tokens
│   │   └── Dm/
│   │       ├── DmChat.jsx               # Refactor: tokens, Textarea
│   │       └── DmList.jsx               # Refactor: Avatar, tokens
│   └── pages/
│       ├── Chat/
│       │   ├── Show.jsx                 # Refactor: ChatLayout, tokens
│       │   └── Index.jsx                # Refactor: ChatLayout, EmptyState, Button
│       ├── Settings/
│       │   ├── Index.jsx                # Refactor: SettingsSidebar, tokens
│       │   └── ServerShow.jsx           # Refactor: SettingsSidebar, tokens
│       └── Dms/
│           ├── Index.jsx                # Refactor: ChatLayout, EmptyState, tokens
│           └── Show.jsx                 # Refactor: ChatLayout, tokens
```

## 2. Decisiones de arquitectura (ADRs)

### ADR-1: Token system — semantic naming sobre raw palette

**Contexto**: Los tokens actuales usan `deep-space-{500-900}` (raw palette) mezclados con tokens semánticos (`fg`, `fg-muted`, `primary`). Esto genera confusión: `bg-deep-space-900` y `bg-deep-space-800` aparecen 40+ veces sin indicar su rol.

**Decisión**: Reemplazar `deep-space-*` con tokens 100% semánticos. La palette raw (zinc-900, zinc-800, etc.) solo existe como valores de las custom properties, nunca como utility class.

```
deep-space-900 → --color-surface-base      (#09090B = zinc-950)
deep-space-800 → --color-surface           (#18181B = zinc-900)
deep-space-700 → --color-surface-elevated  (#27272A = zinc-800)
deep-space-600 → --color-border            (#3F3F46 = zinc-700)
deep-space-500 → --color-border-subtle     (#52525B = zinc-600)
```

**Alternativa rechazada**: Mantener `deep-space-*` y agregar aliases. Rechazada porque duplica tokens y no resuelve el problema de legibilidad.

**Consecuencias**:
- Cada `bg-deep-space-*`, `border-deep-space-*`, `text-deep-space-*` debe migrarse
- Los componentes nuevos NUNCA usan raw palette
- Breaking change visual leve (zinc vs deep-space tienen matices distintos)

### ADR-2: Icon strategy — Lucide React

**Contexto**: Hay 15+ SVGs inline duplicados (el SVG de "close/X" aparece 4 veces idéntico en UserSearchModal, ServerCreateModal, MemberList, ServerSettings). Los SVGs de channel type (# y mic) están hardcodeados en ChannelList.

**Decisión**: Instalar `lucide-react` (~$ npm install lucide-react`). Crear wrapper `components/ui/Icon.jsx` que acepta `name` prop y mapea a Lucide icons.

**Mapeo de SVGs existentes a Lucide**:

| SVG actual (inline) | Lucide name | Aparece en |
|---|---|---|
| Chat bubble (DM button) | `MessageCircle` | ServerSidebar |
| Plus (create server) | `Plus` | ServerSidebar, ServerCreateModal |
| X (close modal) | `X` | UserSearchModal, ServerCreateModal |
| Chevron down (channel group) | `ChevronDown` | ChannelList |
| Chevron left (collapse member) | `ChevronLeft` | MemberList |
| Chevron right (expand member) | `ChevronRight` | MemberList |
| Hash # (text channel) | `Hash` | ChannelList |
| Mic (voice channel) | `Mic` | ChannelList |
| Settings gear | `Settings` | Settings/Index, Settings/ServerShow |
| Logout door | `LogOut` | UserFloatingBar |
| Search (user search modal) | `Search` | UserSearchModal (nuevo) |
| Send (message submit) | `Send` | MessageInput (nuevo) |

**Alternativa rechazada**: Seguir con SVGs inline. Rechazada por la duplicación masiva y la dificultad de mantener consistencia.

**Consecuencias**:
- Dependencia nueva: `lucide-react` (~150KB tree-shakeable)
- Cada SVG inline se reemplaza por `<Icon name="X" size={16} />`
- Tree-shaking elimina icons no usados

### ADR-3: Layout responsivo — mobile-first con collapsible panels

**Contexto**: El layout actual es desktop-only. Los anchos fijos (`w-[72px]`, `w-60`, `w-64`, `w-72`) colapsan en mobile. No hay breakpoints ni hamburger menu.

**Decisión**: Layout de 3 columnas con comportamiento responsive:

```
Breakpoint   ServerSidebar   ChannelList/DM    Main chat    MemberList
< 640px      hidden→drawer   hidden→drawer     full-width   hidden→drawer
640-1024px   72px            hidden→overlay    full-width   hidden→toggle
> 1024px     72px            240px             flex-1       240px (toggle)
```

Implementación: `ChatLayout.jsx` nuevo que envuelve el shell. Los paneles laterales se controlan con Zustand UI state (`useUiStore`):

```js
// stores/useUiStore.js
create((set) => ({
    leftPanelOpen: false,   // mobile: drawer state
    rightPanelOpen: false,  // member list toggle
    closeAll: () => set({ leftPanelOpen: false, rightPanelOpen: false }),
}))
```

**Alternativa rechazada**: CSS-only con `hidden lg:flex`. Rechazada porque los paneles necesitan animation de slide-in y backdrop en mobile.

**Consecuencias**:
- Nuevo store: `useUiStore.js`
- Nuevo componente: `ChatLayout.jsx`
- Botones hamburger en mobile header
- Backdrop overlay con click-to-close

### ADR-4: Focus trap — hook custom + aria-hidden

**Contexto**: UserSearchModal y ServerCreateModal manejan Escape manualmente pero NO tienen focus trap. El tab key puede salir del modal hacia el contenido detrás.

**Decisión**: Hook custom `useFocusTrap(ref)` implementado en `components/ui/Modal.jsx`. Sin dependencias externas (el patrón es ~30 líneas).

```js
function useFocusTrap(ref) {
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const focusable = el.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        function handleKey(e) {
            if (e.key !== 'Tab') return;
            if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus(); }
            } else {
                if (document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        }

        first?.focus();
        el.addEventListener('keydown', handleKey);
        return () => el.removeEventListener('keydown', handleKey);
    }, [ref]);
}
```

Adicional: `aria-hidden="true"` en el `#app` root cuando un modal está abierto.

**Alternativa rechazada**: `@radix-ui/react-dialog`. Rechazada porque agrega una dependencia pesada para un patrón simple.

**Consecuencias**:
- Modal.jsx incluye focus trap built-in
- UserSearchModal y ServerCreateModal migran a Modal.jsx
- `document.body` gets `overflow: hidden` cuando modal abierto

### ADR-5: Migración progresiva — PRs con coexistencia de tokens

**Contexto**: 4 PRs. Cada PR debe ser mergeable sin romper el PR anterior. Los tokens no pueden cambiarse todos de una vez sin riesgo visual.

**Decisión**: Fase de coexistencia controlada.

- **PR1**: Agrega tokens semánticos nuevos en `app.css` junto a los `deep-space-*` existentes. Los nuevos componentes UI usan solo tokens nuevos. Las páginas existentes NO cambian en PR1.
- **PR2**: Reemplaza tokens en componentes Chat (ServerSidebar, ChannelList, MessageList, MessageInput, ChatHeader) + instala lucide-react. Piloto con 2-3 componentes usando `<Button>`.
- **PR3**: Modal primitivo + focus trap. Refactor de UserSearchModal y ServerCreateModal. EmptyState + Skeleton.
- **PR4**: Chat polish (hover states, deduplicación Settings sidebar, SVGs restantes). Elimina tokens `deep-space-*` residuales de `app.css`.

**Consecuencias**:
- PR1 y PR2 pueden coexistir con ambos sets de tokens
- Al final de PR4, `deep-space-*` se elimina de `app.css`
- Cada PR es visualmente verificable

## 3. Diseño de componentes

### Button (`components/ui/Button.jsx`)

```jsx
// Props:
//   variant: 'primary' | 'secondary' | 'ghost' | 'danger' (default: 'secondary')
//   size: 'sm' | 'md' | 'lg' (default: 'md')
//   loading: boolean
//   disabled: boolean
//   icon: ReactNode (optional, left icon slot)
//   iconRight: ReactNode (optional)
//   children: ReactNode
//   className: string (escape hatch for composition)
//   type: 'button' | 'submit' | 'reset' (default: 'button')
//   onClick: function
//   asChild: boolean (render as Link via Slot pattern)

// Variant mapping:
//   primary:   bg-primary text-white hover:bg-primary/90 shadow-sm shadow-primary/25
//   secondary: bg-surface-elevated text-fg border border-border hover:bg-surface-hover
//   ghost:     bg-transparent text-fg-muted hover:bg-surface-elevated hover:text-fg
//   danger:    bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20

// Size mapping:
//   sm: h-8 px-3 text-xs gap-1.5 rounded-md
//   md: h-10 px-4 text-sm gap-2 rounded-lg
//   lg: h-12 px-6 text-base gap-2 rounded-lg

// Loading: muestra Spinner a la izquierda, disabled=true, cursor=wait
```

**Uso en código existente**: Reemplaza ~20 botones inline en:
- `ServerCreateModal.jsx` lines 218-224 (submit), 126-149 (toggle buttons), 200-209 (add channel)
- `UserSettings.jsx` line 169-175 (save button)
- `ServerSettings.jsx` lines 129-135, 202-208, 210-216, 267-273
- `Chat/Index.jsx` line 100-103 (join button)
- `UserFloatingBar.jsx` line 66 (login button)

### Input (`components/ui/Input.jsx`)

```jsx
// Props:
//   label: string (optional, renders <label> above)
//   error: string (optional, renders error message below)
//   hint: string (optional, renders hint below)
//   iconLeft: ReactNode (optional, icon inside input left)
//   iconRight: ReactNode (optional)
//   className: string
//   ...rest: spread to <input>

// Styling:
//   wrapper: flex flex-col gap-1.5
//   input: w-full rounded-lg border bg-surface-elevated px-3 py-2 text-sm
//          border-border focus:border-primary focus:ring-1 focus:ring-primary/30
//          placeholder:text-fg-subtle disabled:opacity-50
//   error state: border-danger focus:border-danger focus:ring-danger/30
//   label: text-xs font-semibold uppercase tracking-wider text-fg-muted
```

**Reemplaza**: Los inputs inline en `UserSettings.jsx` (lines 98-105, 112-119), `ServerCreateModal.jsx` (lines 109-118, 165-172), `ServerSettings.jsx` (lines 89-95, 99-105), `UserSearchModal.jsx` (lines 102-108).

### Textarea (`components/ui/Textarea.jsx`)

```jsx
// Props: como Input + maxLength + autoGrow (default: true) + showCounter (default: false)
// Auto-grow: usa el patrón existente de MessageInput.jsx lines 21-26
// Counter: muestra "{value.length} / {maxLength}" abajo-derecha
```

**Reemplaza**: `MessageInput.jsx` lines 71-81 y `DmChat.jsx` DmComposer lines 135-149 (ambos tienen auto-grow idéntico).

### Icon (`components/ui/Icon.jsx`)

```jsx
// Props:
//   name: string (Lucide icon name, PascalCase)
//   size: number (default: 20)
//   className: string
//   ariaLabel: string (optional, si ausente → aria-hidden="true")

// Implementation:
import * as icons from 'lucide-react';
export default function Icon({ name, size = 20, className = '', ariaLabel }) {
    const LucideIcon = icons[name];
    if (!LucideIcon) return null; // fail silently, log in dev
    return <LucideIcon size={size} aria-label={ariaLabel} aria-hidden={!ariaLabel} className={className} />;
}
```

### Avatar (`components/ui/Avatar.jsx`)

```jsx
// Migración de Presence/UserAvatar.jsx con tokens nuevos.
// Props: iguales a UserAvatar + fallback prop (optional ReactNode)
// Diferencia: usa bg-surface-elevated en vez de bg-deep-space-600
// Mismo hashToHue para initials background
// SIZE_CLASSES actualizado:
//   xs: h-6 w-6 text-[10px]
//   sm: h-8 w-8 text-xs
//   md: h-10 w-10 text-sm
//   lg: h-12 w-12 text-base
//   xl: h-16 w-16 text-lg
// (Idéntico al actual — solo cambian los tokens de fondo)
```

### Modal (`components/ui/Modal.jsx`)

```jsx
// Props:
//   open: boolean
//   onClose: function
//   title: string
//   children: ReactNode
//   size: 'sm' | 'md' | 'lg' (default: 'md')
//   closeOnBackdrop: boolean (default: true)

// Comportamiento:
//   - Backdrop: fixed inset-0 z-50 bg-black/60 backdrop-blur-sm
//   - Panel: rounded-xl border border-border bg-surface shadow-2xl
//   - Focus trap (useFocusTrap hook)
//   - Escape → onClose
//   - Backdrop click → onClose (si closeOnBackdrop)
//   - body overflow: hidden cuando open
//   - Animación: scale + opacity con prefers-reduced-motion check

// Size mapping:
//   sm: max-w-sm
//   md: max-w-md
//   lg: max-w-lg
```

**Reemplaza**: El overlay pattern en `UserSearchModal.jsx` lines 72-80 y `ServerCreateModal.jsx` lines 74-82.

### EmptyState (`components/ui/EmptyState.jsx`)

```jsx
// Props:
//   icon: string (Lucide name)
//   title: string
//   description: string
//   action: { label: string, onClick: function, href?: string }

// Reemplaza el EmptyState inline en Chat/Index.jsx lines 118-124
// y el empty state en Dms/Index.jsx lines 22-29
```

### Skeleton (`components/ui/Skeleton.jsx`)

```jsx
// Props:
//   variant: 'text' | 'circle' | 'rect' (default: 'text')
//   width: string (default: '100%')
//   height: string (default: '1em' for text, '100%' for rect)
//   className: string

// Styling: bg-surface-elevated animate-pulse rounded-md
// reduced-motion: usa opacity blink en vez de pulse si prefers-reduced-motion
```

### ChatLayout (`components/Layout/ChatLayout.jsx`)

```jsx
// Shell responsive que reemplaza el patrón repetido:
//   <div className="flex h-screen w-screen overflow-hidden bg-deep-space-900 text-fg">
//
// Props:
//   children: ReactNode
//   serverSidebar: ReactNode
//   sidePanel: ReactNode (ChannelList or DmList)
//   header: ReactNode (optional top bar for mobile)
//
// Breakpoints:
//   Mobile (<640px): serverSidebar y sidePanel como drawers con backdrop
//   Tablet (640-1024px): serverSidebar visible, sidePanel como overlay
//   Desktop (>1024px): todo visible, memberList toggleable
//
// Usa useUiStore para panel state.
```

## 4. Token System — diseño concreto

### CSS Custom Properties (`resources/css/app.css` @theme block)

```css
@theme {
    /* ── Surface palette (zinc-based) ── */
    --color-surface-base: #09090B;       /* zinc-950 — page background */
    --color-surface: #18181B;            /* zinc-900 — panels, sidebars */
    --color-surface-elevated: #27272A;   /* zinc-800 — cards, inputs, hover */
    --color-surface-hover: #3F3F46;      /* zinc-700 — active rows, selected */
    --color-surface-overlay: #18181B;    /* zinc-900 — modals, popovers */

    /* ── Borders ── */
    --color-border: #3F3F46;             /* zinc-700 — default borders */
    --color-border-subtle: #27272A;      /* zinc-800 — dividers */
    --color-border-strong: #52525B;      /* zinc-600 — focus rings base */

    /* ── Primary (Indigo) ── */
    --color-primary: #6366F1;            /* indigo-500 */
    --color-primary-hover: #818CF8;      /* indigo-400 */
    --color-primary-active: #4F46E5;     /* indigo-600 */
    --color-primary-muted: rgba(99, 102, 241, 0.1);  /* indigo-500/10 */

    /* ── Semantic colors (sin cambio de valor) ── */
    --color-success: #34D399;
    --color-warning: #F59E0B;
    --color-danger: #F43F5E;
    --color-info: #38BDF8;

    /* ── Foreground ── */
    --color-fg: #FAFAFA;                 /* zinc-50 — slightly brighter */
    --color-fg-muted: #A1A1AA;           /* zinc-400 */
    --color-fg-subtle: #71717A;          /* zinc-500 */
    --color-fg-inverted: #09090B;        /* zinc-950 — text on primary bg */

    /* ── Radius ── */
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-full: 9999px;

    /* ── Typography ── */
    --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
    --font-display: 'Inter', ui-sans-serif, system-ui, sans-serif;
    --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

    /* ── Shadows ── */
    --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.25);
    --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.3);
    --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.35);

    /* ── Transitions ── */
    --duration-fast: 100ms;
    --duration-normal: 200ms;
    --duration-slow: 300ms;
    --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Escala tipográfica

| Token | Size | Weight | Line-height | Uso |
|---|---|---|---|---|
| `text-display-lg` | 28px / 1.75rem | 700 | 1.2 | Page titles |
| `text-display` | 20px / 1.25rem | 600 | 1.3 | Section headers |
| `text-body-lg` | 16px / 1rem | 400 | 1.5 | Body text emphasis |
| `text-body` | 14px / 0.875rem | 400 | 1.5 | Default body |
| `text-body-sm` | 13px / 0.8125rem | 400 | 1.4 | Secondary body |
| `text-caption` | 11px / 0.6875rem | 600 | 1.3 | Labels, uppercase |
| `text-micro` | 10px / 0.625rem | 500 | 1.2 | Badges, timestamps |

### Spacing scale

Usar el default de Tailwind (4px base). No agregar custom spacing scale. Los componentes usan `gap-*` y `p-*` estándar.

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

Esto se agrega en el `@layer base` de `app.css`. Afecta: Modal transitions, Skeleton pulse, hover animations en ServerSidebar icons.

## 5. Plan de migración por archivo

| Archivo | Cambio | PR | Depende de |
|---------|--------|----|------------|
| `resources/css/app.css` | Agregar tokens semánticos nuevos (surface-*, border-*, primary indigo, radius-*, shadows, transitions, reduced-motion). Mantener deep-space-* temporalmente. | PR1 | — |
| `resources/js/components/ui/Button.jsx` | Crear. Variant/size/loading/icon props. | PR1 | — |
| `resources/js/components/ui/Input.jsx` | Crear. Label/error/hint/icon props. | PR1 | — |
| `resources/js/components/ui/Textarea.jsx` | Crear. Auto-grow + counter. | PR1 | — |
| `resources/js/components/ui/Icon.jsx` | Crear. Lucide wrapper. | PR1 | — |
| `resources/js/components/ui/Avatar.jsx` | Crear. Migrar de Presence/UserAvatar con tokens nuevos. | PR1 | — |
| `resources/js/components/ui/index.js` | Crear. Barrel export. | PR1 | — |
| `package.json` | `npm install lucide-react` | PR2 | — |
| `resources/js/components/Chat/ServerSidebar.jsx` | Reemplazar `bg-deep-space-*` → `bg-surface*`. Reemplazar 3 SVGs inline → `<Icon>`. Usar tokens nuevos. | PR2 | PR1 |
| `resources/js/components/Chat/ChannelList.jsx` | Reemplazar `deep-space-*` → semánticos. SVGs de channel type → `<Icon name="Hash">` / `<Icon name="Mic">`. | PR2 | PR1 |
| `resources/js/components/Chat/ChatHeader.jsx` | Reemplazar tokens. Emoji `#` → `<Icon name="Hash">`. | PR2 | PR1 |
| `resources/js/components/Chat/MemberList.jsx` | Reemplazar tokens. SVGs de chevron → `<Icon name="ChevronLeft">` / `<Icon name="ChevronRight">`. | PR2 | PR1 |
| `resources/js/components/Chat/MessageList.jsx` | Reemplazar `bg-deep-space-900` → `bg-surface-base`. Hover states: `hover:bg-surface-elevated/60`. | PR2 | PR1 |
| `resources/js/components/Chat/MessageInput.jsx` | Reemplazar textarea inline → `<Textarea>`. Reemplazar tokens. Agregar `<Icon name="Send">` (opcional). | PR2 | PR1 |
| `resources/js/pages/Chat/Show.jsx` | Reemplazar shell div → `<ChatLayout>`. Tokens. | PR2 | PR1 |
| `resources/js/pages/Chat/Index.jsx` | Reemplazar shell → `<ChatLayout>`. EmptyState inline → `<EmptyState>`. Join button → `<Button variant="primary">`. | PR2 | PR1 |
| `resources/js/components/ui/Modal.jsx` | Crear con focus trap + Escape + backdrop + reduced-motion. | PR3 | PR1 |
| `resources/js/components/ui/EmptyState.jsx` | Crear. | PR3 | PR1 |
| `resources/js/components/ui/Skeleton.jsx` | Crear. | PR3 | PR1 |
| `resources/js/components/ui/Spinner.jsx` | Crear. | PR3 | PR1 |
| `resources/js/components/ui/Badge.jsx` | Crear. | PR3 | PR1 |
| `resources/js/components/Chat/UserSearchModal.jsx` | Refactor completo: overlay → `<Modal>`, input → `<Input iconLeft={<Icon name="Search"/>}>`, SVGs → `<Icon>`. | PR3 | PR1, PR2 |
| `resources/js/components/Chat/ServerCreateModal.jsx` | Refactor: overlay → `<Modal>`, inputs → `<Input>`, submit → `<Button>`, toggle buttons → `<Button variant={...}>`. | PR3 | PR1, PR2 |
| `resources/js/components/Dm/DmChat.jsx` | Reemplazar tokens. DmComposer textarea → `<Textarea>`. Header → tokens nuevos. | PR3 | PR1, PR2 |
| `resources/js/components/Dm/DmList.jsx` | Reemplazar tokens. | PR3 | PR1, PR2 |
| `resources/js/pages/Dms/Index.jsx` | Shell → `<ChatLayout>`. Empty state → `<EmptyState>`. | PR3 | PR1, PR2 |
| `resources/js/pages/Dms/Show.jsx` | Shell → `<ChatLayout>`. | PR3 | PR1, PR2 |
| `resources/js/components/Layout/ChatLayout.jsx` | Crear. Responsive shell con useUiStore. | PR3 | PR1 |
| `resources/js/stores/useUiStore.js` | Crear. Panel state management. | PR3 | — |
| `resources/js/components/Layout/SettingsSidebar.jsx` | Crear. Deduplicar sidebar de Settings/Index.jsx y Settings/ServerShow.jsx. | PR4 | PR1, PR2 |
| `resources/js/pages/Settings/Index.jsx` | Reemplazar sidebar inline → `<SettingsSidebar>`. Tokens. | PR4 | PR1, PR2 |
| `resources/js/pages/Settings/ServerShow.jsx` | Reemplazar sidebar inline → `<SettingsSidebar>`. Tokens. Eliminar `SettingsIcon` duplicado. | PR4 | PR1, PR2 |
| `resources/js/components/Settings/UserSettings.jsx` | Inputs → `<Input>`. Submit → `<Button>`. Status radio → `<Button variant={...}>`. Tokens. | PR4 | PR1, PR2 |
| `resources/js/components/Settings/ServerSettings.jsx` | Inputs → `<Input>`/`<Textarea>`. Buttons → `<Button>`. Tabs → tokens. Members/Invites → tokens. | PR4 | PR1, PR2 |
| `resources/js/components/Layout/UserFloatingBar.jsx` | Tokens. SVG logout → `<Icon name="LogOut">`. | PR4 | PR1, PR2 |
| `resources/js/components/Presence/UserAvatar.jsx` | Re-export de `ui/Avatar` para compatibilidad. Deprecar uso directo. | PR4 | PR1 |
| `resources/js/components/Presence/PresenceBadge.jsx` | `ring-deep-space-900` → `ring-surface-base`. | PR4 | PR1 |
| `resources/js/components/Layout/AppLayout.jsx` | Simplificar: solo envuelve con `<UserFloatingBar>`. | PR4 | PR1 |
| `resources/css/app.css` | Eliminar tokens `deep-space-*` residuales. Solo si todos los archivos migraron. | PR4 | Todos los anteriores |

## 6. Consideraciones de testing

### Estrategia

| Layer | Qué testear | Cómo |
|---|---|---|
| Unit (ui/) | Button renders variants, Input shows error, Modal focus trap, Icon maps names | `@testing-library/react` + `vitest`. Assert by role/text/aria, NOT by class. |
| Unit (Chat/) | ServerSidebar renders server icons, ChannelList highlights active | Existing pattern (ver ChatHeader.test.jsx). Mock `window.axios`. |
| Integration | Modal focus trap cycles through focusable elements | `userEvent.tab()` assertions. Verify first→last→first cycle. |
| Integration | ChatLayout responsive behavior | Mock `window.innerWidth`, fire `resize` event. Assert panel visibility. |
| Snapshot | NO snapshots de componentes UI | Las clases Tailwind cambian frecuentemente. Los snapshots generan false positives. |
| E2E | Visual smoke test con Playwright | Screenshot comparison en breakpoints 375/768/1280. |

### Reglas para evitar false positives

1. **NUNCA** testear por clase CSS (`expect(el).toHaveClass('bg-primary')`) — las clases son implementation detail
2. **SIEMPRE** testear por rol ARIA, texto visible, o label (`getByRole('button', { name: 'Crear servidor' })`)
3. Para tokens de color: testear computed style solo si es un requirement explícito (no para cada componente)
4. Para Icon: testear que el SVG se renderiza (`container.querySelector('svg')`), no qué icono específico

### Tests nuevos requeridos

| Componente | Archivo test | Casos |
|---|---|---|
| Button | `components/ui/__tests__/Button.test.jsx` | renders each variant, loading shows spinner, disabled prevents click |
| Input | `components/ui/__tests__/Input.test.jsx` | renders label, shows error, forwards ref |
| Modal | `components/ui/__tests__/Modal.test.jsx` | focus trap works, Escape calls onClose, backdrop click calls onClose |
| Icon | `components/ui/__tests__/Icon.test.jsx` | renders SVG for valid name, returns null for invalid |
| EmptyState | `components/ui/__tests__/EmptyState.test.jsx` | renders title, description, action button |
| Skeleton | `components/ui/__tests__/Skeleton.test.jsx` | renders with correct variant |

## 7. Riesgos técnicos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| `lucide-react` no tree-shakea bien y aumenta bundle >100KB | Media | Med | Verificar con `vite build --report` post-install. Si >100KB, considerar import individual: `import { X } from 'lucide-react'` |
| Tokens semánticos rompen estilos existentes durante PR2-PR3 | Alta | Bajo | Coexistencia controlada: deep-space-* se mantiene hasta PR4. Cada PR verifica visualmente. |
| Focus trap rompe interacción con portales de React (Inertia modals) | Baja | Alto | Testear con Tab/Shift+Tab en UserSearchModal y ServerCreateModal post-migración. |
| `ChatLayout` responsive rompe layout desktop existente | Media | Alto | Desktop (>1024px) debe ser pixel-identical al layout actual. Test con Playwright screenshot comparison. |
| Inter font no carga (CDN/local) y fallback system-ui se ve muy distinto | Baja | Med | Bundlear Inter via `@fontsource/inter` o Google Fonts preconnect. Fallback chain incluye system-ui. |
| Deduplicación de SettingsSidebar cambia comportamiento de navegación | Baja | Med | Mantener misma estructura de Links y `aria-current`. Solo extraer JSX a componente compartido. |
| `useUiStore` Zustand store causa re-renders excesivos en resize | Baja | Bajo | Usar selectors granulares: `useUiStore(s => s.leftPanelOpen)` en vez de destructurar todo el store. |

## 8. Dependencias nuevas

| Paquete | Versión | Razón | Size impact |
|---|---|---|---|
| `lucide-react` | ^0.400+ | Icon system (tree-shakeable) | ~3KB per icon used, ~30KB total estimated |

No se agregan otras dependencias. Focus trap es custom. No se usa Radix, Headless UI, ni component libraries pesadas.

## 9. Open Questions

- [ ] ¿Se bundea Inter con `@fontsource/inter` o se usa Google Fonts CDN? El proyecto actual usa Geist (probablemente via CDN o local).
- [ ] ¿El `ChatLayout` mobile necesita swipe-to-close para los drawers, o click-en-backdrop es suficiente para PR3?
- [ ] ¿Los `Badge` y `Spinner` necesitan variantes adicionales más allá de las listadas?
