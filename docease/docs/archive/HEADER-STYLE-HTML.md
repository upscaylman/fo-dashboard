# Header - Style et HTML Complet

## 📋 Structure HTML/JSX du Header

```tsx
<header className="glass-effect-strong border-b border-outlineVariant/50 sticky top-0 z-40 animate-slide-down backdrop-blur-xl">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16 sm:h-18">
      {/* Logo et Titre */}
      <Link
        to="/dashboard"
        className="flex items-center space-x-3 cursor-pointer transition-opacity hover:opacity-80"
      >
        <div className="bg-gradient-primary p-2 rounded-lg flex items-center justify-center h-10 w-10 elevation-2 progressive-glow transition-transform hover:scale-110">
          <PenTool className="h-6 w-6 text-onPrimary" />
        </div>
        {/* Desktop: SignEase by FO Metaux */}
        <span className="hidden sm:inline text-xl font-bold whitespace-nowrap">
          <span className="text-gradient-primary">SignEase</span>{" "}
          <span className="text-onSurface">by FO Metaux</span>
        </span>
        {/* Mobile: juste SignEase */}
        <span className="sm:hidden text-xl font-bold whitespace-nowrap">
          <span className="text-gradient-primary">SignEase</span>
        </span>
      </Link>

      {/* Navigation Desktop - avec labels */}
      <nav className="hidden lg:flex items-center space-x-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `
            flex items-center min-h-[44px] px-4 py-2 rounded-full
            text-sm font-medium
            ${isActive ? activeLinkClass : inactiveLinkClass}
          `
              .trim()
              .replace(/\s+/g, " ")
          }
        >
          <LayoutDashboard className="h-5 w-5 mr-2" />
          Tableau de bord
        </NavLink>
        
        <div className="relative">
          <NavLink
            to="/inbox"
            className={({ isActive }) =>
              `
              flex items-center min-h-[44px] px-4 py-2 rounded-full
              text-sm font-medium
              ${
                isActive
                  ? "bg-secondaryContainer text-onSecondaryContainer elevation-1"
                  : "text-onSurfaceVariant state-layer state-layer-primary"
              }
            `
                .trim()
                .replace(/\s+/g, " ")
            }
          >
            <Inbox className="h-5 w-5 mr-2" />
            Boîte de réception
          </NavLink>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-onPrimary text-xs font-bold animate-fade-in-scale elevation-2 badge-pulse">
              {unreadCount}
            </span>
          )}
        </div>
        
        <NavLink
          to="/verify"
          className={({ isActive }) =>
            `
            flex items-center min-h-[44px] px-4 py-2 rounded-full
            text-sm font-medium
            ${isActive ? activeLinkClass : inactiveLinkClass}
          `
              .trim()
              .replace(/\s+/g, " ")
          }
        >
          <ShieldCheck className="h-5 w-5 mr-2" />
          Vérifier le document
        </NavLink>
      </nav>

      {/* Navigation Mobile/Tablette - REMOVED - now in burger menu */}
      <nav className="hidden"></nav>

      <div className="flex items-center gap-2">
        {/* Notification Dropdown - Toujours visible */}
        <NotificationDropdown />

        {/* Burger Menu - Mobile/Tablette uniquement */}
        <div className="lg:hidden">
          <MobileMenu />
        </div>

        {/* Profile Button */}
        <Tooltip content={currentUser?.email || "Profil"} position="bottom">
          <button
            className={`
              min-h-[44px] min-w-[44px] w-10 h-10
              ${profileColor || "bg-primaryContainer"} text-white
              rounded-full flex items-center justify-center
              font-bold text-lg
              state-layer state-layer-primary press-effect
              elevation-0 hover:elevation-1 transition-all
              hover:scale-110
            `}
            aria-label="Profil utilisateur"
          >
            {getInitials()}
          </button>
        </Tooltip>
        
        {/* Logout Button in Desktop Nav - ICON ONLY */}
        <Tooltip content="Déconnexion" position="bottom">
          <button
            onClick={logout}
            className="
              hidden lg:flex items-center justify-center min-h-[44px] min-w-[44px] p-2.5 rounded-full
              text-sm font-medium
              text-onSurfaceVariant state-layer state-layer-primary
              hover:bg-secondaryContainer
              transition-colors
            "
            aria-label="Déconnexion"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </Tooltip>
      </div>
    </div>
  </div>
</header>
```

## 🎨 Styles CSS Utilisés par le Header

### Variables CSS (Material Design 3)

```css
:root {
  /* Couleurs primaires */
  --md-sys-color-primary: #b71c1c;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-primary-container: #ffdad4;
  --md-sys-color-on-primary-container: #410001;

  /* Couleurs secondaires */
  --md-sys-color-secondary: #775651;
  --md-sys-color-on-secondary: #ffffff;
  --md-sys-color-secondary-container: #ffdad4;
  --md-sys-color-on-secondary-container: #2c1512;

  /* Couleurs de surface */
  --md-sys-color-surface: #fffbff;
  --md-sys-color-on-surface: #201a19;
  --md-sys-color-surface-variant: #f5ddda;
  --md-sys-color-on-surface-variant: #3e302f;

  /* Couleurs de contour */
  --md-sys-color-outline: #6f5b58;
  --md-sys-color-outline-variant: #d8c2bf;

  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%);
  --gradient-glass: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.7) 0%,
    rgba(255, 255, 255, 0.3) 100%
  );

  /* Élévations */
  --md-sys-elevation-0: none;
  --md-sys-elevation-1: 0px 1px 2px 0px rgba(0, 0, 0, 0.3),
    0px 1px 3px 1px rgba(0, 0, 0, 0.15);
  --md-sys-elevation-2: 0px 1px 2px 0px rgba(0, 0, 0, 0.3),
    0px 2px 6px 2px rgba(0, 0, 0, 0.15);

  /* Motion */
  --md-sys-motion-duration-short-2: 100ms;
  --md-sys-motion-duration-medium-2: 300ms;
  --md-sys-motion-duration-medium-3: 350ms;
  --md-sys-motion-easing-standard: cubic-bezier(0.2, 0, 0, 1);
  --md-sys-motion-easing-emphasized: cubic-bezier(0.2, 0, 0, 1);
  --md-sys-motion-easing-emphasized-decelerate: cubic-bezier(0.05, 0.7, 0.1, 1);
}
```

### Effet Glassmorphism

```css
.glass-effect-strong {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.15),
    inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}
```

### Gradient Primary

```css
.bg-gradient-primary {
  background: var(--gradient-primary);
}

.text-gradient-primary {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
}
```

### Élévations

```css
.elevation-0 {
  box-shadow: var(--md-sys-elevation-0);
}

.elevation-1 {
  box-shadow: var(--md-sys-elevation-1);
}

.elevation-2 {
  box-shadow: var(--md-sys-elevation-2);
}
```

### State Layers (Material Design 3)

```css
.state-layer {
  position: relative;
  overflow: hidden;
}

.state-layer::before {
  content: "";
  position: absolute;
  inset: 0;
  background-color: currentColor;
  opacity: 0;
  transition: opacity var(--md-sys-motion-duration-short-2)
    var(--md-sys-motion-easing-standard);
  pointer-events: none;
  border-radius: inherit;
}

.state-layer:hover::before {
  opacity: 0.08;
}

.state-layer:focus::before {
  opacity: 0.12;
}

.state-layer:active::before {
  opacity: 0.16;
}

.state-layer-primary::before {
  background-color: var(--md-sys-color-primary);
}
```

### Animations

```css
/* Animation slide down */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-down {
  animation: slideDown var(--md-sys-motion-duration-medium-3)
    var(--md-sys-motion-easing-emphasized);
}

/* Animation fade in scale */
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in-scale {
  animation: fadeInScale var(--md-sys-motion-duration-medium-2)
    var(--md-sys-motion-easing-emphasized);
}

/* Badge pulse */
.badge-pulse {
  animation: badgePulseEnhanced 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes badgePulseEnhanced {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.05);
  }
}
```

### Progressive Glow

```css
.progressive-glow {
  animation: progressiveGlow 3s ease-in-out infinite;
}

@keyframes progressiveGlow {
  0%,
  100% {
    box-shadow: 0 0 10.1889px rgba(183, 28, 28, 0.204),
      0 0 0.503705px rgba(183, 28, 28, 0.004);
  }
  50% {
    box-shadow: 0 0 24.9649px rgba(183, 28, 28, 0.5),
      0 0 39.9065px rgba(183, 28, 28, 0.3);
  }
}
```

### Press Effect

```css
.press-effect {
  transition: transform var(--md-sys-motion-duration-short-2)
    var(--md-sys-motion-easing-emphasized);
}

.press-effect:active {
  transform: scale(0.97);
}
```

### Container Responsive

```css
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 640px) {
  .container {
    max-width: 640px;
  }
}

@media (min-width: 768px) {
  .container {
    max-width: 768px;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
}

@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}

@media (min-width: 1536px) {
  .container {
    max-width: 1536px;
  }
}
```

### Classes Tailwind Utilisées

- `sticky top-0 z-40` - Position sticky en haut avec z-index 40
- `border-b border-outlineVariant/50` - Bordure inférieure avec opacité 50%
- `backdrop-blur-xl` - Flou d'arrière-plan
- `flex items-center justify-between` - Flexbox avec alignement
- `h-16 sm:h-18` - Hauteur responsive (64px desktop, 72px mobile)
- `px-4 sm:px-6 lg:px-8` - Padding horizontal responsive
- `space-x-2` - Espacement horizontal entre éléments
- `rounded-full` - Coins arrondis complets
- `min-h-[44px]` - Hauteur minimale pour accessibilité tactile
- `transition-all`, `transition-opacity`, `transition-transform` - Transitions
- `hover:opacity-80`, `hover:scale-110` - États hover
- `hidden lg:flex` - Masqué sur mobile, visible sur desktop
- `sm:hidden` - Masqué sur desktop, visible sur mobile

## 📱 Responsive Design

### Desktop (lg: 1024px+)
- Navigation complète avec labels textuels
- Bouton de déconnexion visible
- Logo avec texte complet "SignEase by FO Metaux"

### Mobile/Tablette (< 1024px)
- Navigation masquée (dans menu burger)
- Logo simplifié "SignEase" uniquement
- Menu burger visible

## 🎯 Classes Dynamiques

### Liens Actifs/Inactifs

```tsx
const activeLinkClass = "bg-secondaryContainer text-onSecondaryContainer elevation-1";
const inactiveLinkClass = "text-onSurfaceVariant state-layer state-layer-primary";
```

### Badge de Notification

Affiché uniquement si `unreadCount > 0` avec animation pulse.

### Couleur de Profil

Générée aléatoirement au premier login et stockée dans localStorage pour persistance.

## 🔗 Dépendances

- **React Router** : `NavLink`, `Link`, `useLocation`
- **Lucide React** : Icônes (PenTool, LayoutDashboard, Inbox, ShieldCheck, LogOut)
- **Composants personnalisés** : `NotificationDropdown`, `MobileMenu`, `Tooltip`, `UserContext`

---

## 📐 Largeur du Main (Contenu Principal)

### Structure HTML du Main

```tsx
<main className="flex-grow animate-fade-in page-transition">
  <Routes>
    {/* Routes de l'application */}
  </Routes>
</main>
```

### Largeur du Main

Le `main` n'a **pas de largeur fixe** - il prend **100% de la largeur disponible** grâce à `flex-grow`.

**Classes utilisées :**
- `flex-grow` : Prend tout l'espace vertical disponible dans le flex container
- `animate-fade-in` : Animation d'apparition
- `page-transition` : Transition entre les pages

### Container Responsive dans les Pages

Les pages utilisent la classe `container mx-auto` pour limiter la largeur du contenu :

```css
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;  /* 16px */
  padding-right: 1rem;  /* 16px */
}
```

### Largeurs Maximales par Breakpoint

| Breakpoint | Largeur Max | Largeur Réelle (avec padding) |
|------------|-------------|-------------------------------|
| **Mobile** (< 640px) | 100% | 100% - 32px (padding) |
| **sm** (≥ 640px) | 640px | 640px - 32px = **608px** |
| **md** (≥ 768px) | 768px | 768px - 32px = **736px** |
| **lg** (≥ 1024px) | 1024px | 1024px - 32px = **992px** |
| **xl** (≥ 1280px) | 1280px | 1280px - 32px = **1248px** |
| **2xl** (≥ 1536px) | 1536px | 1536px - 32px = **1504px** |

### Code CSS Complet du Container

```css
/* Container responsive */
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 640px) {
  .container {
    max-width: 640px;
  }
}

@media (min-width: 768px) {
  .container {
    max-width: 768px;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
}

@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}

@media (min-width: 1536px) {
  .container {
    max-width: 1536px;
  }
}
```

### Structure Complète de la Page

```tsx
<div className="min-h-screen bg-background text-onBackground flex flex-col">
  <Header /> {/* Largeur: 100% avec container interne */}
  <main className="flex-grow animate-fade-in page-transition">
    {/* Largeur: 100% */}
    <div className="container mx-auto">
      {/* Largeur: max-width selon breakpoint */}
      {/* Contenu de la page */}
    </div>
  </main>
  <Footer />
</div>
```

### Exemple d'Utilisation dans les Pages

```tsx
// DashboardPage.tsx
<div className="container mx-auto mb-8">
  {/* Contenu limité à la largeur du container */}
</div>

// InboxPage.tsx
<div className="container mx-auto">
  {/* Contenu limité à la largeur du container */}
</div>
```

### Notes Importantes

1. **Le main prend 100% de la largeur** - Pas de limitation directe
2. **Les pages utilisent `container mx-auto`** - Pour centrer et limiter le contenu
3. **Padding horizontal** : 16px (1rem) de chaque côté
4. **Largeur réelle du contenu** = max-width - 32px (padding total)
5. **Responsive** : La largeur s'adapte automatiquement selon la taille de l'écran

