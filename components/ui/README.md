# Composants UI réutilisables

Ce dossier contient tous les composants UI réutilisables de l'application.

## Utilisation

```tsx
import { Button, Card, Badge, Tabs } from '@/components/ui';
```

## Composants disponibles

### Button
Bouton avec variantes et tailles personnalisables.

### Card
Carte avec padding et effets hover optionnels.

### Badge
Badge pour afficher des étiquettes colorées.

### Tabs
Système d'onglets réutilisable.

## Exemple complet

```tsx
import { Button, Card, Badge, Tabs } from '@/components/ui';
import { FileText } from 'lucide-react';

function MyComponent() {
  return (
    <Card padding="md" hover>
      <div className="flex items-center justify-between mb-4">
        <h2 className="heading-2">Titre</h2>
        <Badge variant="success">Nouveau</Badge>
      </div>
      
      <Button 
        variant="primary" 
        size="md"
        icon={FileText}
        iconPosition="left"
      >
        Action
      </Button>
    </Card>
  );
}
```

