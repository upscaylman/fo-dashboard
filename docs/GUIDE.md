# 🚀 Guide d'intégration Dashboard FO Métaux
## Intégration avec vos projets existants

## 📋 Vue d'ensemble

Vous avez **déjà** deux projets fonctionnels :
1. **n8n-automation** - Formulaire qui génère automatiquement des lettres avec IA
2. **SignEasy** - Application de signature électronique de PDFs

**L'objectif** : Créer un dashboard qui **affiche les statistiques** de ces deux outils **sans modifier leur code**.

---

## 🏗️ Architecture simplifiée

```
┌─────────────────────────────────────────┐
│      DASHBOARD FO MÉTAUX (React)        │
│   Affiche stats + liens vers les apps   │
└─────────────────────────────────────────┘
                    ↓
        ┌───────────┴────────────┐
        ↓                        ↓
┌──────────────┐        ┌──────────────────┐
│  Backend API │        │  Scraping News   │
│  (Node.js)   │        │  fo-metaux.fr    │
└──────────────┘        └──────────────────┘
        ↓
    ┌───┴────┐
    ↓        ↓
┌─────────────┐  ┌──────────────────┐
│ n8n API     │  │ Firebase Admin   │
│ (REST)      │  │ (SignEasy DB)    │
└─────────────┘  └──────────────────┘
```

**Principe** : 
- Le dashboard **ne touche PAS** à vos projets existants
- Il **lit les données** via les APIs
- Vos outils continuent de fonctionner indépendamment

---

## 📁 Structure du projet

```
fo-metaux-integration/
│
├── dashboard/                      # Nouveau dashboard React
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx
│   │   │   └── Stats/
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── hooks/
│   │       └── useStats.ts
│   └── package.json
│
├── backend/                        # API pour récupérer les stats
│   ├── src/
│   │   ├── routes/
│   │   │   ├── stats.routes.ts
│   │   │   └── news.routes.ts
│   │   ├── services/
│   │   │   ├── n8nService.ts      # Lit les données n8n
│   │   │   ├── signEasyService.ts # Lit Firebase
│   │   │   └── newsService.ts     # Scrape fo-metaux.fr
│   │   └── server.ts
│   └── package.json
│
├── n8n-automation/                 # VOTRE PROJET EXISTANT
│   └── (ne pas modifier)           # Continue de fonctionner tel quel
│
├── signeasy/                       # VOTRE PROJET EXISTANT
│   └── (ne pas modifier)           # Continue de fonctionner tel quel
│
└── docker-compose.yml              # Orchestration globale
```

---

## 🔧 Backend API - Récupération des stats

### 1. Installation

```bash
mkdir backend && cd backend
npm init -y
npm install express cors dotenv axios firebase-admin cheerio
npm install -D typescript @types/express @types/node ts-node nodemon
```

### 2. Configuration `.env`

```env
# Backend
PORT=3001
NODE_ENV=development

# n8n (votre installation existante)
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=votre_api_key_n8n

# Firebase (SignEasy existant)
FIREBASE_PROJECT_ID=votre_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...

# Optionnel: PostgreSQL si vous voulez stocker l'historique
DATABASE_URL=postgresql://user:pass@localhost:5432/fo_metaux_stats
```

### 3. Service n8n - Lecture des exécutions (`backend/src/services/n8nService.ts`)

```typescript
import axios from 'axios';

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY;

export class N8nService {
  private client;

  constructor() {
    this.client = axios.create({
      baseURL: N8N_BASE_URL,
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });
  }

  // Récupérer toutes les exécutions récentes
  async getRecentExecutions(limit = 100) {
    try {
      const response = await this.client.get('/api/v1/executions', {
        params: { limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('Erreur n8n:', error.message);
      return [];
    }
  }

  // Statistiques agrégées
  async getStats() {
    try {
      const executions = await this.getRecentExecutions(500);
      
      const now = new Date();
      const thisMonth = executions.filter(e => {
        const date = new Date(e.startedAt);
        return date.getMonth() === now.getMonth();
      });

      const success = thisMonth.filter(e => e.finished && !e.stoppedAt);
      const failed = thisMonth.filter(e => e.stoppedAt);

      return {
        totalExecutions: executions.length,
        thisMonth: thisMonth.length,
        successThisMonth: success.length,
        failedThisMonth: failed.length,
        successRate: thisMonth.length > 0 
          ? (success.length / thisMonth.length * 100).toFixed(1) 
          : 0
      };
    } catch (error) {
      console.error('Erreur stats n8n:', error.message);
      return {
        totalExecutions: 0,
        thisMonth: 0,
        successThisMonth: 0,
        failedThisMonth: 0,
        successRate: 0
      };
    }
  }

  // Stats par workflow
  async getWorkflowStats() {
    try {
      const executions = await this.getRecentExecutions(500);
      
      // Grouper par workflow
      const grouped = executions.reduce((acc, exec) => {
        const wfId = exec.workflowId;
        if (!acc[wfId]) {
          acc[wfId] = {
            workflowId: wfId,
            workflowName: exec.workflowData?.name || 'Sans nom',
            count: 0,
            success: 0,
            failed: 0
          };
        }
        acc[wfId].count++;
        if (exec.finished && !exec.stoppedAt) acc[wfId].success++;
        if (exec.stoppedAt) acc[wfId].failed++;
        return acc;
      }, {});

      return Object.values(grouped);
    } catch (error) {
      console.error('Erreur workflow stats:', error.message);
      return [];
    }
  }
}

export default new N8nService();
```

### 4. Service SignEasy - Lecture Firebase (`backend/src/services/signEasyService.ts`)

```typescript
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialiser Firebase Admin (lecture seule de votre Firestore existant)
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = getFirestore();

export class SignEasyService {
  // Statistiques globales
  async getStats() {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Tous les documents
      const allDocs = await db.collection('documents').get();
      
      // Documents du mois en cours
      const monthDocs = await db
        .collection('documents')
        .where('createdAt', '>=', firstDayOfMonth)
        .get();

      const monthData = monthDocs.docs.map(d => d.data());

      return {
        total: allDocs.size,
        thisMonth: monthDocs.size,
        signed: monthData.filter(d => d.status === 'signed').length,
        pending: monthData.filter(d => d.status === 'pending').length,
        rejected: monthData.filter(d => d.status === 'rejected').length
      };
    } catch (error) {
      console.error('Erreur Firebase:', error.message);
      return {
        total: 0,
        thisMonth: 0,
        signed: 0,
        pending: 0,
        rejected: 0
      };
    }
  }

  // Activité des 7 derniers jours
  async getWeeklyActivity() {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const docs = await db
        .collection('documents')
        .where('createdAt', '>=', weekAgo)
        .get();

      const data = docs.docs.map(d => ({
        ...d.data(),
        createdAt: d.data().createdAt?.toDate()
      }));

      // Grouper par jour
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      const activity = Array(7).fill(null).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          day: days[date.getDay()],
          date: date.toISOString().split('T')[0],
          signed: 0,
          pending: 0
        };
      });

      data.forEach(doc => {
        const dayIndex = activity.findIndex(a => 
          a.date === doc.createdAt.toISOString().split('T')[0]
        );
        if (dayIndex !== -1) {
          if (doc.status === 'signed') activity[dayIndex].signed++;
          else activity[dayIndex].pending++;
        }
      });

      return activity;
    } catch (error) {
      console.error('Erreur weekly activity:', error.message);
      return [];
    }
  }

  // Liste des documents récents
  async getRecentDocuments(limit = 20) {
    try {
      const docs = await db
        .collection('documents')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return docs.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate()
      }));
    } catch (error) {
      console.error('Erreur documents récents:', error.message);
      return [];
    }
  }
}

export default new SignEasyService();
```

### 5. Service News - Scraping fo-metaux.fr (`backend/src/services/newsService.ts`)

```typescript
import axios from 'axios';
import * as cheerio from 'cheerio';

export class NewsService {
  async getLatestNews() {
    try {
      const response = await axios.get('https://www.fo-metaux.fr/');
      const $ = cheerio.load(response.data);
      
      const news = [];
      
      // Adapter le sélecteur selon la structure HTML réelle du site
      $('.article, .post, .news-item').slice(0, 5).each((i, elem) => {
        const title = $(elem).find('h2, h3, .title').text().trim();
        const date = $(elem).find('.date, time').text().trim();
        const link = $(elem).find('a').attr('href');
        const category = $(elem).find('.category, .tag').text().trim();

        if (title) {
          news.push({
            id: i + 1,
            title,
            date: date || 'Date inconnue',
            category: category || 'Actualité',
            url: link?.startsWith('http') ? link : `https://www.fo-metaux.fr${link}`
          });
        }
      });

      return news.length > 0 ? news : this.getFallbackNews();
    } catch (error) {
      console.error('Erreur scraping news:', error.message);
      return this.getFallbackNews();
    }
  }

  // Données de fallback si le scraping échoue
  getFallbackNews() {
    return [
      {
        id: 1,
        title: "Transition automobile : Des choix européens qui s'alignent sur les alertes de la filière",
        date: "05 novembre 2025",
        category: "Industrie",
        url: "https://www.fo-metaux.fr/"
      },
      {
        id: 2,
        title: "AGIR : cap sur la phase 2",
        date: "04 novembre 2025",
        category: "Action syndicale",
        url: "https://www.fo-metaux.fr/"
      },
      {
        id: 3,
        title: "Dénonciation de la suppression de 95 emplois chez GARANKA",
        date: "04 novembre 2025",
        category: "Emploi",
        url: "https://www.fo-metaux.fr/"
      }
    ];
  }
}

export default new NewsService();
```

### 6. Routes principales (`backend/src/routes/stats.routes.ts`)

```typescript
import express from 'express';
import n8nService from '../services/n8nService';
import signEasyService from '../services/signEasyService';
import newsService from '../services/newsService';

const router = express.Router();

// GET /api/stats/global - Toutes les stats en une fois
router.get('/global', async (req, res) => {
  try {
    const [n8nStats, signEasyStats] = await Promise.all([
      n8nService.getStats(),
      signEasyService.getStats()
    ]);

    res.json({
      letters: {
        total: n8nStats.totalExecutions,
        thisMonth: n8nStats.thisMonth,
        successRate: n8nStats.successRate
      },
      signatures: {
        total: signEasyStats.total,
        thisMonth: signEasyStats.thisMonth,
        signed: signEasyStats.signed,
        pending: signEasyStats.pending
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur stats globales:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/stats/n8n - Stats détaillées n8n
router.get('/n8n', async (req, res) => {
  try {
    const [stats, workflows] = await Promise.all([
      n8nService.getStats(),
      n8nService.getWorkflowStats()
    ]);

    res.json({ ...stats, workflows });
  } catch (error) {
    console.error('Erreur stats n8n:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/stats/signeasy - Stats détaillées SignEasy
router.get('/signeasy', async (req, res) => {
  try {
    const [stats, weekly, recent] = await Promise.all([
      signEasyService.getStats(),
      signEasyService.getWeeklyActivity(),
      signEasyService.getRecentDocuments(10)
    ]);

    res.json({ ...stats, weekly, recent });
  } catch (error) {
    console.error('Erreur stats SignEasy:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/news - Actualités fo-metaux.fr
router.get('/news', async (req, res) => {
  try {
    const news = await newsService.getLatestNews();
    res.json(news);
  } catch (error) {
    console.error('Erreur news:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
```

### 7. Serveur (`backend/src/server.ts`)

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import statsRoutes from './routes/stats.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/stats', statsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend API running on http://localhost:${PORT}`);
  console.log(`📊 Stats: http://localhost:${PORT}/api/stats/global`);
});
```

---

## 🎨 Frontend Dashboard

### Hook pour récupérer les stats (`dashboard/src/hooks/useStats.ts`)

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/stats/global`);
      setStats(response.data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error, refetch: fetchStats };
};

export const useNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/stats/news`);
        setNews(response.data);
      } catch (err) {
        console.error('Erreur news:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return { news, loading };
};
```

### Utilisation dans le Dashboard

```typescript
import { useStats, useNews } from './hooks/useStats';

export default function Dashboard() {
  const { stats, loading, error } = useStats();
  const { news } = useNews();

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      {/* Statistiques */}
      <div className="stats">
        <StatCard 
          label="Lettres générées ce mois"
          value={stats.letters.thisMonth}
          icon={FileText}
        />
        <StatCard 
          label="Documents signés ce mois"
          value={stats.signatures.signed}
          icon={Edit3}
        />
      </div>

      {/* Actualités */}
      <div className="news">
        {news.map(item => (
          <NewsCard key={item.id} {...item} />
        ))}
      </div>

      {/* Liens vers vos apps */}
      <div className="apps">
        <AppCard 
          name="Créer une lettre"
          url="http://localhost:3000"
          description="Formulaire n8n-automation"
        />
        <AppCard 
          name="Signer un document"
          url="https://signeasy.netlify.app"
          description="SignEasy"
        />
      </div>
    </div>
  );
}
```

---

## 🐳 Docker Compose simplifié

```yaml
version: '3.8'

services:
  # Backend API (nouveau)
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - N8N_BASE_URL=http://host.docker.internal:5678
      - FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
      - FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}
      - FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
    extra_hosts:
      - "host.docker.internal:host-gateway"

  # Dashboard (nouveau)
  dashboard:
    build: ./dashboard
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3001
    depends_on:
      - backend

  # VOS PROJETS EXISTANTS restent inchangés
  # n8n et SignEasy continuent de tourner normalement
```

---

## 🚀 Démarrage rapide

```bash
# 1. Cloner/créer la structure
mkdir fo-metaux-integration
cd fo-metaux-integration

# 2. Installer le backend
mkdir backend && cd backend
npm init -y
npm install express cors dotenv axios firebase-admin cheerio
# Copier les fichiers du backend ci-dessus

# 3. Configurer le .env
cp .env.example .env
# Éditer avec vos credentials

# 4. Démarrer le backend
npm run dev

# 5. Dans un autre terminal, dashboard
cd ../dashboard
npm install
npm run dev

# 6. Accéder au dashboard
# http://localhost:5173
```

---

## ✅ Points clés

1. **Vos projets ne changent PAS** - n8n-automation et SignEasy continuent de fonctionner normalement
2. **Le backend lit les données** via les APIs n8n et Firebase (lecture seule)
3. **Le dashboard affiche** les stats et fournit des liens vers vos apps
4. **Pas de duplication** de fonctionnalités - on réutilise ce qui existe
