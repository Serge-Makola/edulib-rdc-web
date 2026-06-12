# EduLib RDC — Contexte de développement Next.js

## Qui je suis
Je suis Serge Makola, fondateur d'EduLib RDC, juriste diplômé de l'Université de Kinshasa
spécialisé en droit international public. Je travaille uniquement depuis un iPhone 11
via Safari et GitHub mobile. Je n'ai pas accès à un terminal — j'utilise GitHub Codespaces
si besoin.

## Ce qu'est EduLib RDC
La première bibliothèque numérique universitaire de la RDC. Stack actuel :
- Site HTML unique déployé sur Vercel via GitHub (repo : `edulib-rdc-web`)
- Firebase Authentication + Firestore
- Mistral AI via une fonction serverless Vercel (`/api/chat`)
- Site live : `edulib-rdc-web.vercel.app`

## Ce qu'on est en train de faire
Migration du site HTML unique vers **Next.js 14 App Router + TypeScript + Tailwind CSS**.
Le travail se fait sur la branche `nextjs` du repo pour ne pas casser le site actuel.

## Architecture choisie
```
src/
  app/
    page.tsx                    ✅ FAIT — Accueil
    layout.tsx                  ✅ FAIT — Root layout + ThemeProvider + AuthProvider
    globals.css                 ✅ FAIT — Variables CSS design tokens
    catalogue/page.tsx          ✅ FAIT — Catalogue + recherche Fuse.js + PDF viewer
    filieres/page.tsx           ✅ FAIT — Liste des filières
    filieres/[slug]/page.tsx    ✅ FAIT — Page dynamique par filière
    login/page.tsx              ✅ FAIT — Connexion
    register/page.tsx           ✅ FAIT — Inscription
    dashboard/page.tsx          ✅ FAIT — Espace étudiant (3 onglets)
    admin/page.tsx              ✅ FAIT — Espace admin (4 onglets, CRUD complet)
    about/page.tsx              ✅ FAIT — À propos
    contact/page.tsx            ✅ FAIT — Formulaire + infos contact
    reset-password/page.tsx     ✅ FAIT — Réinitialisation mot de passe
    not-found.tsx               ✅ FAIT — Page 404 personnalisée
    loading.tsx                 ✅ FAIT — Loading global
    api/
      chat/route.ts             ✅ FAIT — Mistral AI
      payment/route.ts          ✅ FAIT — Placeholder Maishapay
      admin-verify/route.ts     ✅ FAIT — Vérification UID admin
  components/
    layout/
      Navbar.tsx                ✅ FAIT — Navbar responsive + dark mode + auth
      Footer.tsx                ✅ FAIT — Footer complet
    ui/
      Toast.tsx                 ✅ FAIT — Notifications toast
      PurchaseModal.tsx          ✅ FAIT — Flux achat 3 étapes (confirm/paiement/done)
    ai/
      AiSidebar.tsx             ✅ FAIT — Chat Mistral flottant + suggestions — Chat Mistral flottant
  context/
    AuthContext.tsx             ✅ FAIT — Auth complet (login/register/logout/reset)
  hooks/
    useDocs.ts                  ✅ FAIT — Firestore onSnapshot + Fuse.js
    useStats.ts                 ✅ FAIT — Compteur public temps réel
    useCart.ts                  ✅ FAIT — Panier en mémoire
    usePurchase.ts              ✅ FAIT — Création commande + confirmation paiement
  lib/
    firebase.ts                 ✅ FAIT — Firebase SDK v9 modulaire
  types/
    index.ts                    ✅ FAIT — Doc, User, Order, FILIERES, DOC_TYPES
middleware.ts                   ✅ FAIT — Protection routes /dashboard et /admin — Protection routes privées
public/
  manifest.json                 ✅ FAIT — PWA manifest
  icons/                        ✅ FAIT — icon-192, icon-512, icon-maskable
```

## Ce qui reste à construire (dans l'ordre)

### ✅ TOUT LE CORE EST FAIT — 30 fichiers TypeScript, 0 erreur

### Restant optionnel / améliorations

### 1. middleware.ts (PRIORITÉ HAUTE)
Protéger `/dashboard` et `/admin` côté serveur.
```typescript
// Logique : si non connecté → redirect /login
// Si /admin et non admin → redirect /
```

### 2. AiSidebar (components/ai/AiSidebar.tsx)
- Bouton flottant en bas à droite sur toutes les pages
- Chat avec Mistral via `/api/chat`
- Historique de conversation en mémoire (useState)
- System prompt : assistant académique congolais
- Même logique que dans le HTML original

### 3. contact/page.tsx
- Formulaire : nom, email, sujet, message
- Envoi via EmailJS ou simple lien mailto
- Informations de contact (WhatsApp, email)

### 4. reset-password/page.tsx
- Champ email
- Appel à `resetPassword()` de AuthContext (déjà implémenté)
- Message de confirmation

### 5. not-found.tsx + loading.tsx
- 404 avec lien retour accueil
- Loading spinner global

### 6. Système d'achat complet
- Quand l'étudiant clique "Acheter" → créer une commande dans Firestore
- Statut initial : "En attente de paiement"
- Instructions WhatsApp affichées
- Quand admin confirme paiement → mettre à jour `boughtIds` de l'utilisateur

### 7. Service Worker PWA (offline support)
- Cache les pages déjà visitées
- Affiche un message offline propre

## Dépendances installées
```json
"next": "15.x",
"react": "19.x",
"typescript": "^5",
"tailwindcss": "^4",
"firebase": "^11.x",
"next-themes": "^0.4.x",
"fuse.js": "^7.x"
```

## Variables d'environnement (.env.local)
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=edulib-rdc.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=edulib-rdc
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=edulib-rdc.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_ADMIN_UID=3IulbkeHujhAyWHBI5ETElEnJ303
MISTRAL_API_KEY=
MAISHAPAY_API_KEY=
MAISHAPAY_SECRET=
```

## Firebase — Collections Firestore
- `documents` — { title, filiere, type, professeur, prix, driveLink, annee, description, createdAt, downloads }
- `users` — { name, email, role, filiere, boughtIds[], createdAt, uid }
- `orders` — { userId, userName, userEmail, items[], total, status, createdAt }
- `stats/public` — { userCount: int64 }

## Règles Firestore (déjà publiées)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /documents/{docId} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.uid == '3IulbkeHujhAyWHBI5ETElEnJ303';
    }
    match /users/{userId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
    match /orders/{orderId} {
      allow read, write: if request.auth != null;
    }
    match /stats/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Conventions de code
- Tout en TypeScript strict
- Styles inline avec `React.CSSProperties` — pas de classes Tailwind dans les composants
- Variables CSS (`var(--blue)`, `var(--ink)`, etc.) pour tous les tokens de design
- Dark mode via `.dark` class sur `<html>` (next-themes)
- Composants `'use client'` sauf les routes API
- Pas de bibliothèques UI externes (shadcn, MUI, etc.) — tout custom

## Design tokens (globals.css)
```
--blue: #2563eb          --blue-dark: #1d4ed8     --blue-light: #eff6ff
--gold: #d97706          --gold-light: #fef3c7
--ink: #0f172a           --surface: #ffffff       --surface-2: #f8fafc
--border: #e2e8f0        --text-muted: #64748b    --text-soft: #94a3b8
--red: #ef4444           --red-light: #fef2f2
--green: #22c55e         --green-light: #f0fdf4
```

## Comment continuer
1. Lis ce fichier en entier
2. Commence par `middleware.ts` (protection des routes)
3. Puis `AiSidebar.tsx` (fonctionnalité clé du site)
4. Suis l'ordre de priorité ci-dessus
5. Chaque fichier doit être complet et fonctionnel — pas de TODO dans le code livré
6. Zéro erreur TypeScript (`npx tsc --noEmit` doit passer proprement)
