# Footer - Style et HTML Complet

## 📋 Structure HTML/JSX du Footer

```tsx
<footer
  className="relative overflow-hidden"
  style={{ backgroundColor: "rgb(69, 58, 56)" }}
>
  {/* Effet de mesh gradient décoratif animé */}
  <div className="absolute inset-0 opacity-20">
    <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
    <div
      className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-white/5 rounded-full blur-3xl animate-pulse"
      style={{ animationDelay: "1s" }}
    ></div>
  </div>

  <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
      {/* Section Titre et Description */}
      <div className="text-center md:text-left">
        <h3 className="text-lg font-bold text-white">
          SignEase by FO Metaux
        </h3>
        <p className="text-sm text-white/80">
          Votre solution de signature électronique.
        </p>
      </div>

      {/* Navigation - Liens Footer */}
      <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
        {footerLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            className="text-sm text-white/90 underline"
            target={link.href.startsWith("http") ? "_blank" : undefined}
            rel={
              link.href.startsWith("http")
                ? "noopener noreferrer"
                : undefined
            }
          >
            {link.name}
          </a>
        ))}
      </nav>
    </div>

    {/* Séparateur avec gradient */}
    <div className="divider-gradient my-8"></div>

    {/* Section Réseaux Sociaux et Copyright */}
    <div className="flex flex-col items-center gap-4">
      {/* Réseaux sociaux */}
      <div className="flex items-center gap-3">
        {socialLinks.map((social) => {
          const Icon = social.icon;
          return (
            <Tooltip
              key={social.name}
              content={`Suivez-nous sur ${social.name}`}
              position="top"
            >
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 min-h-[40px] min-w-[40px] p-2 rounded-full"
                aria-label={social.name}
              >
                <Icon className="h-5 w-5" />
              </a>
            </Tooltip>
          );
        })}
      </div>

      {/* Copyright */}
      <p className="text-xs text-white/70">
        Site réalisé par FO Métaux © {new Date().getFullYear()} FO Métaux.
        Tous droits réservés.
        <span className="ml-2" style={{ color: "#c72727" }}>
          Version {packageJson.version}
        </span>
      </p>
    </div>
  </div>
</footer>
```

## 📊 Données du Footer

### Liens Footer (footerLinks)

```tsx
const footerLinks = [
  {
    name: "A propos de nous",
    href: "https://www.fo-metaux.org/pages/organisation-fo-metaux",
  },
  { 
    name: "Contact", 
    href: "https://www.fo-metaux.fr/nous-contacter" 
  },
  {
    name: "Mentions Légales",
    href: "https://www.fo-metaux.org/mentions-legales",
  },
  {
    name: "Politique de confidentialité",
    href: "https://www.fo-metaux.org/politique-de-confidentialite",
  },
  { 
    name: "fo-metaux.fr", 
    href: "https://www.fo-metaux.fr/" 
  },
];
```

### Réseaux Sociaux (socialLinks)

```tsx
const socialLinks = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/federationfometaux",
    icon: Facebook,
  },
  { 
    name: "X", 
    href: "https://x.com/fedefometaux", 
    icon: Twitter 
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/f%C3%A9d%C3%A9ration-fo-de-la-m%C3%A9tallurgie/",
    icon: Linkedin,
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/user/fometauxtpe",
    icon: Youtube,
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/fometallurgie/",
    icon: Instagram,
  },
];
```

## 🎨 Styles CSS Utilisés par le Footer

### Style Inline du Footer

```css
/* Couleur de fond du footer */
background-color: rgb(69, 58, 56); /* #453a38 en hexadécimal */
```

### Divider Gradient

```css
.divider-gradient {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--md-sys-color-outline-variant) 50%,
    transparent 100%
  );
  border: none;
}
```

**Variable CSS utilisée :**
```css
--md-sys-color-outline-variant: #d8c2bf;
```

### Container Responsive

Le footer utilise la même classe `container` que le reste de l'application :

```css
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;  /* 16px */
  padding-right: 1rem;  /* 16px */
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

### Animation Pulse

```css
.animate-pulse {
  animation: pulse var(--md-sys-motion-duration-long-4)
    var(--md-sys-motion-easing-standard) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}
```

## 🎯 Classes Tailwind Utilisées

### Structure Principale

- `relative overflow-hidden` - Position relative avec overflow caché
- `absolute inset-0` - Position absolue couvrant tout le parent
- `opacity-20` - Opacité à 20%
- `z-10` - Z-index pour superposer les éléments

### Effets Décoratifs

- `bg-white/10` - Fond blanc avec opacité 10%
- `bg-white/5` - Fond blanc avec opacité 5%
- `rounded-full` - Coins arrondis complets (cercle)
- `blur-3xl` - Flou très important (64px)
- `animate-pulse` - Animation de pulsation

### Layout et Espacement

- `container mx-auto` - Container centré avec largeur maximale responsive
- `px-4 sm:px-6 lg:px-8` - Padding horizontal responsive
  - Mobile : 16px (1rem)
  - sm (≥640px) : 24px (1.5rem)
  - lg (≥1024px) : 32px (2rem)
- `py-8` - Padding vertical de 32px (2rem)
- `flex flex-col md:flex-row` - Flexbox responsive (colonne sur mobile, ligne sur desktop)
- `justify-between` - Espacement entre les éléments
- `items-center` - Alignement vertical centré
- `gap-6` - Espacement de 24px entre les éléments flex
- `gap-x-6 gap-y-2` - Espacement horizontal 24px, vertical 8px
- `gap-3` - Espacement de 12px
- `gap-4` - Espacement de 16px

### Typographie

- `text-lg` - Taille de texte large (18px)
- `font-bold` - Poids de police gras
- `text-white` - Couleur blanche
- `text-white/80` - Blanc avec opacité 80%
- `text-white/90` - Blanc avec opacité 90%
- `text-white/70` - Blanc avec opacité 70%
- `text-sm` - Taille de texte petite (14px)
- `text-xs` - Taille de texte très petite (12px)
- `underline` - Soulignement du texte

### Liens et Interactions

- `min-h-[40px] min-w-[40px]` - Taille minimale pour accessibilité tactile
- `p-2` - Padding de 8px
- `rounded-full` - Coins arrondis complets
- `h-5 w-5` - Taille des icônes (20px)

### Responsive

- `text-center md:text-left` - Texte centré sur mobile, aligné à gauche sur desktop
- `flex-col md:flex-row` - Colonne sur mobile, ligne sur desktop
- `justify-center` - Centrage horizontal

## 📐 Dimensions et Espacements

### Padding du Container

| Breakpoint | Padding Horizontal | Padding Vertical |
|------------|-------------------|------------------|
| Mobile | 16px (px-4) | 32px (py-8) |
| sm (≥640px) | 24px (px-6) | 32px (py-8) |
| lg (≥1024px) | 32px (px-8) | 32px (py-8) |

### Espacements Internes

- **Gap principal** : 24px (gap-6)
- **Gap navigation** : 24px horizontal, 8px vertical (gap-x-6 gap-y-2)
- **Gap réseaux sociaux** : 12px (gap-3)
- **Gap section basse** : 16px (gap-4)
- **Margin séparateur** : 32px vertical (my-8)

### Tailles des Éléments

- **Icônes réseaux sociaux** : 20px × 20px (h-5 w-5)
- **Boutons réseaux sociaux** : Minimum 40px × 40px (min-h-[40px] min-w-[40px])
- **Séparateur** : 1px de hauteur
- **Effets décoratifs** :
  - Cercle haut droite : 50% largeur × 50% hauteur
  - Cercle bas gauche : 33% largeur × 33% hauteur

## 🎨 Couleurs Utilisées

### Couleur de Fond

```css
background-color: rgb(69, 58, 56); /* #453a38 */
```

**Équivalents :**
- Hexadécimal : `#453a38`
- RGB : `rgb(69, 58, 56)`
- HSL : `hsl(15, 9%, 25%)`

### Couleurs de Texte

- **Titre** : `text-white` (100% opacité)
- **Description** : `text-white/80` (80% opacité)
- **Liens** : `text-white/90` (90% opacité)
- **Copyright** : `text-white/70` (70% opacité)
- **Version** : `#c72727` (rouge FO Métaux)

### Effets Décoratifs

- **Cercle haut droite** : `bg-white/10` (blanc 10% opacité)
- **Cercle bas gauche** : `bg-white/5` (blanc 5% opacité)

## 🔄 Animations

### Animation Pulse

Les cercles décoratifs utilisent l'animation `animate-pulse` avec un délai pour le second cercle :

```tsx
<div className="animate-pulse"></div>
<div 
  className="animate-pulse"
  style={{ animationDelay: "1s" }}
></div>
```

**Propriétés :**
- Durée : `var(--md-sys-motion-duration-long-4)` (600ms)
- Easing : `var(--md-sys-motion-easing-standard)` (cubic-bezier(0.2, 0, 0, 1))
- Répétition : `infinite`
- Délai second cercle : `1s`

## 📱 Responsive Design

### Mobile (< 768px)

- Layout en colonne (`flex-col`)
- Texte centré (`text-center`)
- Navigation avec wrap (`flex-wrap`)
- Padding horizontal réduit (16px)

### Desktop (≥ 768px)

- Layout en ligne (`md:flex-row`)
- Texte aligné à gauche (`md:text-left`)
- Navigation sans wrap
- Padding horizontal augmenté (24px → 32px)

## 🔗 Dépendances

### Composants

- **Tooltip** : Composant personnalisé pour les tooltips des réseaux sociaux
- **package.json** : Import pour afficher la version de l'application

### Icônes (Lucide React)

- `Facebook`
- `Twitter` (X)
- `Linkedin`
- `Youtube`
- `Instagram`

### Données Dynamiques

- **Année** : `new Date().getFullYear()` - Année actuelle dynamique
- **Version** : `packageJson.version` - Version depuis package.json (actuellement "1.2.0")

## 🎯 Accessibilité

### Attributs ARIA

```tsx
aria-label={social.name}  // Label pour les liens réseaux sociaux
```

### Liens Externes

Tous les liens externes utilisent :
- `target="_blank"` - Ouvre dans un nouvel onglet
- `rel="noopener noreferrer"` - Sécurité et performance

### Zones Tactiles

- Boutons réseaux sociaux : Minimum 40px × 40px (conforme WCAG)

## 📝 Notes Importantes

1. **Couleur de fond** : Utilise un style inline `rgb(69, 58, 56)` au lieu d'une classe CSS
2. **Effets décoratifs** : Deux cercles flous animés en arrière-plan pour effet visuel
3. **Version dynamique** : La version est récupérée depuis `package.json`
4. **Année dynamique** : L'année du copyright est générée dynamiquement
5. **Responsive** : Le footer s'adapte parfaitement mobile/desktop
6. **Séparateur** : Utilise un gradient pour un effet visuel élégant
7. **Z-index** : Le contenu principal utilise `z-10` pour être au-dessus des effets décoratifs

