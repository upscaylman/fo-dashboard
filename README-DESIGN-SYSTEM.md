# Design System - Guide d'utilisation

Ce document décrit le système de design centralisé de l'application FO Métaux Dashboard.

## 🎨 Composants UI réutilisables

### Button

Composant bouton avec plusieurs variantes et tailles.

```tsx
import { Button } from '@/components/ui';

// Utilisation basique
<Button variant="primary" size="md">Cliquer</Button>

// Avec icône
<Button variant="primary" icon={FileText} iconPosition="left">
  Créer
</Button>

// Variantes disponibles
<Button variant="primary">Primaire</Button>
<Button variant="secondary">Secondaire</Button>
<Button variant="dark">Sombre</Button>
<Button variant="outline">Avec bordure</Button>
<Button variant="ghost">Transparent</Button>

// Tailles
<Button size="sm">Petit</Button>
<Button size="md">Moyen</Button>
<Button size="lg">Grand</Button>
```

### Card

Composant carte avec padding et hover optionnels.

```tsx
import { Card } from '@/components/ui';

<Card padding="md" hover>
  <h3>Titre</h3>
  <p>Contenu de la carte</p>
</Card>

// Padding options: 'none' | 'sm' | 'md' | 'lg'
```

### Badge

Composant badge pour afficher des étiquettes.

```tsx
import { Badge } from '@/components/ui';

<Badge variant="success">Succès</Badge>
<Badge variant="error">Erreur</Badge>
<Badge variant="warning">Attention</Badge>
<Badge variant="info">Information</Badge>
<Badge variant="default">Par défaut</Badge>
```

### Tabs

Composant onglets réutilisable.

```tsx
import { Tabs } from '@/components/ui';

const tabs = [
  { id: 'tab1', label: 'Onglet 1', content: <div>Contenu 1</div> },
  { id: 'tab2', label: 'Onglet 2', content: <div>Contenu 2</div> },
];

<Tabs tabs={tabs} defaultTab="tab1" />
```

## 🎨 Classes CSS réutilisables

### Boutons

```html
<button class="btn btn-primary">Primaire</button>
<button class="btn btn-secondary">Secondaire</button>
<button class="btn btn-dark">Sombre</button>
<button class="btn btn-outline">Avec bordure</button>
<button class="btn btn-ghost">Transparent</button>
```

### Cartes

```html
<div class="card card-padding-md">Carte standard</div>
<div class="card-hover card-padding-lg">Carte avec hover</div>
```

### Badges

```html
<span class="badge badge-success">Succès</span>
<span class="badge badge-error">Erreur</span>
<span class="badge badge-warning">Attention</span>
```

### Onglets

```html
<div class="tabs-container">
  <button class="tab-button-active">Actif</button>
  <button class="tab-button-inactive">Inactif</button>
</div>
```

### Containers

```html
<div class="container section">
  <h1 class="heading-1">Titre principal</h1>
  <p class="text-muted">Texte secondaire</p>
</div>
```

## 🎨 Design Tokens

Utilisez les tokens de design pour maintenir la cohérence :

```tsx
import { colors, spacing, borderRadius, shadows } from '@/styles/design-tokens';

// Utilisation dans les styles inline ou composants
const style = {
  backgroundColor: colors.primary[600],
  padding: spacing.md,
  borderRadius: borderRadius.full,
  boxShadow: shadows.md,
};
```

## 📝 Bonnes pratiques

1. **Toujours utiliser les composants UI** au lieu de créer de nouveaux styles
2. **Utiliser les classes CSS réutilisables** pour les cas simples
3. **Respecter les design tokens** pour les couleurs et espacements
4. **Maintenir la cohérence** : tous les boutons doivent avoir `rounded-full`
5. **Documenter** les nouveaux composants dans ce fichier

## 🔄 Migration

Pour migrer un composant existant :

1. Remplacer les styles inline par les composants UI
2. Utiliser les classes CSS réutilisables
3. Vérifier que les couleurs utilisent les design tokens
4. Tester la cohérence visuelle

