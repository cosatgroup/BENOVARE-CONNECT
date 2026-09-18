# Benovare Connect

Plateforme qui orchestre, de bout en bout, la rencontre entre besoins et
talents tech. Cinq consoles : Talents, Prestataires, Partenaires,
Gestionnaire de compte, Administrateur — voir `Benovare Connect -
Specifications Fonctionnelles.docx` et la maquette produit pour le détail
fonctionnel.

## Structure du repo

```
apps/
  web/   Next.js (App Router) — déployé sur Vercel
  api/   Express + TypeScript + Prisma/PostgreSQL — déployé sur Render
```

Monorepo géré avec les workspaces npm.

## Développement local

Prérequis : Node 20+, une base PostgreSQL (locale ou Docker).

```bash
npm install

# API
cp apps/api/.env.example apps/api/.env   # renseigner DATABASE_URL et JWT_SECRET
npm run -w apps/api prisma:migrate
npm run dev:api

# Web
cp apps/web/.env.example apps/web/.env
npm run dev:web
```

L'API écoute sur `http://localhost:4000`, le frontend sur `http://localhost:3000`.

## Déploiement

- **Render** (`render.yaml`) : API Express + base PostgreSQL managée.
- **Vercel** (`apps/web/vercel.json`) : frontend Next.js, avec
  `NEXT_PUBLIC_API_URL` pointant vers l'URL Render de l'API.

## État d'avancement

Ordre de construction retenu (parcours critique § 8 des spécifications) :

1. **Fondations** — auth + MFA, schéma de données transverse, layout et
   navigation partagés par les 5 consoles. ✅ en place
2. **Console Partenaires** — publier un besoin, candidatures & sélection,
   missions, abonnement. À construire.
3. **Console Talents** — opportunités, candidature, suivi, pilotage.
4. **Console Gestionnaire de compte** — sourcing, sélection, pilotage,
   gestion des comptes.
5. **Console Prestataires** — même logique que Talents, multi-utilisateurs.
6. **Console Administrateur** — supervision globale.

## Identité visuelle

Assets de marque dans `Logo/` et `SVG/` — vert institutionnel `#0E6B46`,
orange produit Connect `#CC5500`/`#FF9E4D`, police Montserrat. Détail dans
`LISEZMOI.md` et `Identite Benovare Connect.html`.
