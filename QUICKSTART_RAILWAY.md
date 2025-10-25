# 🚀 Quick Start - Déploiement Railway

## ⚡ Déploiement en 5 minutes

### 1️⃣ Push ton code sur GitHub

```bash
git add .
git commit -m "feat: backend ready for Railway deployment"
git push origin main
```

### 2️⃣ Déployer sur Railway

1. Va sur **[railway.app](https://railway.app)**
2. Clique sur **"New Project"**
3. Sélectionne **"Deploy from GitHub repo"**
4. Choisis **`flynova-backend`**
5. ✅ Railway va détecter Node.js et déployer automatiquement !

### 3️⃣ Ajouter MySQL Database

1. Dans ton projet Railway, clique **"+ New"**
2. Sélectionne **"Database"** → **"Add MySQL"**
3. Railway créera automatiquement la base de données

### 4️⃣ Configurer les variables d'environnement

Dans Railway Dashboard → **Variables**, ajoute :

**Variables MySQL** (automatiques) :
```
MYSQLHOST=containers-us-west-xxx.railway.app
MYSQLUSER=root
MYSQLPASSWORD=xxxxx
MYSQLDATABASE=railway
MYSQLPORT=3306
```

**Ajoute manuellement** :
```env
# Copier les valeurs MySQL
DB_HOST=${MYSQLHOST}
DB_USER=${MYSQLUSER}
DB_PASSWORD=${MYSQLPASSWORD}
DB_NAME=${MYSQLDATABASE}
DB_PORT=${MYSQLPORT}

# Configuration
NODE_ENV=production
FRONTEND_URL=https://ton-frontend.vercel.app

# JWT Secret (génère une clé forte !)
JWT_SECRET=ta-cle-super-secrete-aleatoire-tres-longue

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ton-email@gmail.com
SMTP_PASS=ton-mot-de-passe-app
SMTP_FROM=noreply@flynova.com
```

### 5️⃣ Initialiser la base de données

**Option A : Via Railway CLI** (recommandé)

```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Lier au projet
railway link

# Exécuter les migrations
railway run npm run migrate
```

**Option B : Connexion directe MySQL**

Utilise les credentials Railway pour te connecter :

```bash
mysql -h containers-us-west-xxx.railway.app -u root -p'xxxxxx' railway < database/schema.sql
```

### 6️⃣ Vérifier le déploiement

Ton API est accessible à : `https://ton-projet.up.railway.app`

Teste le health check :
```
https://ton-projet.up.railway.app/api/health
```

Tu devrais voir :
```json
{
  "status": "ok",
  "timestamp": "2025-10-25T..."
}
```

## 🎨 Custom Domain (Optionnel)

1. Railway Dashboard → **Settings** → **Domains**
2. Clique **"Custom Domain"**
3. Ajoute ton domaine : `api.tondomaine.com`
4. Ajoute un enregistrement CNAME chez ton registrar :
   ```
   Type: CNAME
   Name: api
   Value: ton-projet.up.railway.app
   ```

## 🔄 Mises à jour automatiques

Railway redéploie automatiquement à chaque push sur `main` :

```bash
# Fais tes changements
git add .
git commit -m "update: amélioration API"
git push origin main

# Railway redéploie automatiquement ! 🎉
```

## 📊 Monitoring

Railway Dashboard te montre :
- ✅ Logs en temps réel
- ✅ Métriques (CPU, RAM, Réseau)
- ✅ Statut des déploiements
- ✅ Variables d'environnement

## 💡 Astuces

### Voir les logs
```bash
railway logs
```

### Exécuter une commande
```bash
railway run npm run migrate
railway run npm run import:data
```

### Variables MySQL automatiques

Railway crée automatiquement ces variables :
- `DATABASE_URL` - URL complète MySQL
- `MYSQL_URL` - Identique
- `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, etc.

Assure-toi de copier ces valeurs vers `DB_HOST`, `DB_USER`, etc.

## ⚠️ Important

1. **FRONTEND_URL** : Doit pointer vers ton frontend (Vercel, Netlify, etc.)
2. **JWT_SECRET** : Utilise une clé TRÈS longue et aléatoire
3. **SMTP** : Configure un service email (Gmail, SendGrid, etc.)

## 💰 Prix

- **Starter** : $5 de crédit gratuit/mois
- **Developer** : $20/mois (inclus $5 de crédit)
- MySQL : ~$5-10/mois selon utilisation

## 📚 Ressources

- [Documentation Railway](https://docs.railway.app)
- [Guide MySQL Railway](https://docs.railway.app/databases/mysql)
- [Railway CLI](https://docs.railway.app/develop/cli)

---

**C'est tout ! Ton backend FlyNova est maintenant en production ! 🎉✈️**
