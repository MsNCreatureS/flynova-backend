# 🚂 Déploiement sur Railway - FlyNova Backend

Guide rapide pour déployer le backend FlyNova sur Railway.

## 🚀 Déploiement en 3 étapes

### 1. Créer un compte Railway
- Aller sur [railway.app](https://railway.app)
- Se connecter avec GitHub

### 2. Créer un nouveau projet
- Cliquer sur "New Project"
- Sélectionner "Deploy from GitHub repo"
- Choisir `flynova-backend`
- Railway va automatiquement détecter Node.js et déployer

### 3. Configurer les variables d'environnement

Dans Railway Dashboard > Variables, ajouter :

```env
NODE_ENV=production
PORT=3001

# Database (utiliser Railway MySQL ou service externe)
DB_HOST=containers-us-west-xxx.railway.app
DB_PORT=3306
DB_USER=root
DB_PASSWORD=xxx
DB_NAME=railway

# Frontend URL
FRONTEND_URL=https://votre-frontend.vercel.app

# JWT
JWT_SECRET=votre-cle-secrete-super-longue

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app
SMTP_FROM=noreply@flynova.com
```

## 🗄️ Base de données MySQL sur Railway

### Option 1 : Ajouter MySQL Railway (Recommandé)

1. Dans votre projet Railway, cliquer sur "+ New"
2. Sélectionner "Database" > "Add MySQL"
3. Railway va créer la base de données automatiquement
4. Les variables `DATABASE_URL`, `MYSQL_URL`, etc. seront ajoutées automatiquement

5. Convertir les variables Railway en format attendu :
   - Ajouter manuellement : `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`
   - Railway fournit `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT`

### Option 2 : Base de données externe

Utilisez PlanetScale, AWS RDS, ou autre service MySQL externe et configurez les variables `DB_*` correspondantes.

## 📦 Initialiser la base de données

Une fois la base de données créée, vous devez importer le schéma :

### Via Railway CLI

```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Se connecter au projet
railway link

# Exécuter les migrations
railway run npm run migrate
```

### Via connexion directe

```bash
# Récupérer les credentials depuis Railway Dashboard
mysql -h containers-us-west-xxx.railway.app -u root -p railway < database/schema.sql
```

## 🌐 Custom Domain (Optionnel)

1. Dans Railway Dashboard > Settings > Domains
2. Cliquer sur "Generate Domain" (vous obtenez `xxx.up.railway.app`)
3. Ou "Custom Domain" pour utiliser votre propre domaine (ex: `api.flynova.com`)

## ✅ Vérification

Une fois déployé :

1. Vérifier le health check : `https://votre-app.up.railway.app/api/health`
2. Mettre à jour `FRONTEND_URL` dans les variables Railway avec l'URL de votre frontend
3. Mettre à jour CORS dans votre frontend avec l'URL Railway

## 🔧 Configuration automatique

Railway détecte automatiquement :
- ✅ Node.js 18+
- ✅ `npm install` pour les dépendances
- ✅ `npm start` pour démarrer l'app
- ✅ Le port via `process.env.PORT`

## 📝 Variables importantes

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NODE_ENV` | Environnement | `production` |
| `PORT` | Port (fourni par Railway) | `3001` |
| `FRONTEND_URL` | URL du frontend | `https://app.vercel.app` |
| `DB_HOST` | Host MySQL | De Railway MySQL |
| `DB_USER` | User MySQL | De Railway MySQL |
| `DB_PASSWORD` | Password MySQL | De Railway MySQL |
| `DB_NAME` | Nom BDD | `railway` |
| `JWT_SECRET` | Clé JWT | Générer une clé forte |

## 🔄 Redéploiement automatique

Railway redéploie automatiquement à chaque push sur la branche `main` !

```bash
git add .
git commit -m "update: configuration"
git push origin main
```

## 💰 Pricing

- **Starter Plan** : $5/mois de crédit gratuit
- **Developer Plan** : $20/mois
- MySQL : ~$5-10/mois selon l'utilisation

## 🆘 Support

- [Documentation Railway](https://docs.railway.app)
- [Discord Railway](https://discord.gg/railway)

---

C'est tout ! Votre backend est maintenant déployé sur Railway ! 🎉
