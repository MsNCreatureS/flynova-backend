# 🚀 Configuration Hostinger - Base de données + Stockage d'images

Guide complet pour utiliser Hostinger comme backend MySQL + stockage d'images.

## ✅ Avantages Hostinger

- ✅ **Déjà inclus** dans ton abonnement Premium
- ✅ **MySQL + Stockage** au même endroit
- ✅ **Bande passante illimitée** (selon ton plan)
- ✅ **Accès FTP/SSH** pour gérer les fichiers
- ✅ **Pas de configuration cloud externe**

---

## 📋 Étape 1 : Créer la base de données MySQL

### 1. Connexion à Hostinger

1. Va sur [hostinger.com](https://hostinger.com)
2. Connecte-toi à **hPanel**

### 2. Créer la base MySQL

1. **Bases de données** → **Gestionnaire MySQL**
2. Cliquer sur **"Créer une nouvelle base de données"**
3. Remplir :
   - **Nom de la base** : `flynova` (ou `u123456_flynova`)
   - **Nom d'utilisateur** : `flynova_user`
   - **Mot de passe** : Générer un mot de passe fort
4. **Privilèges** : Tous les privilèges
5. Cliquer sur **"Créer"**

### 3. Noter les informations

Tu auras besoin de :
```
Hôte : mysqlXXX.hostinger.com (ou ton domaine)
Utilisateur : u123456_flynova
Mot de passe : ****************
Base de données : u123456_flynova
Port : 3306
```

### 4. Importer le schéma

1. **phpMyAdmin** → Sélectionner ta base
2. **Importer** → Choisir `database/schema.sql`
3. Cliquer sur **"Exécuter"**

---

## 📁 Étape 2 : Configurer le stockage des images

### Option A : Utiliser un sous-domaine (Recommandé)

1. **Domaines** → **Sous-domaines**
2. Créer : `cdn.tondomaine.com` ou `uploads.tondomaine.com`
3. Pointer vers `/public_html/uploads/`

### Option B : Utiliser le domaine principal

Dans `/public_html/`, créer la structure :

```
public_html/
├── uploads/
│   ├── avatars/
│   ├── logos/
│   ├── liveries/
│   ├── events/
│   └── documents/
└── .htaccess (pour sécuriser)
```

### Créer les dossiers via FTP

**Via Gestionnaire de fichiers Hostinger :**
1. **Fichiers** → **Gestionnaire de fichiers**
2. Naviguer vers `public_html/`
3. Créer le dossier `uploads/`
4. Dans `uploads/`, créer : `avatars/`, `logos/`, `liveries/`, `events/`, `documents/`

**Via FTP (FileZilla, etc.) :**
1. Connecte-toi avec tes credentials FTP
2. Va dans `/public_html/`
3. Crée les dossiers

### Permissions

Assure-toi que les dossiers ont les bonnes permissions :
- `uploads/` : `755`
- Sous-dossiers : `755`

---

## 🔐 Étape 3 : Récupérer les credentials FTP

1. **Fichiers** → **Comptes FTP**
2. Utiliser le compte FTP principal ou créer un nouveau
3. Noter :
   ```
   Hôte FTP : ftp.tondomaine.com
   Utilisateur : toncompte@tondomaine.com
   Mot de passe : ****************
   Port : 21
   ```

---

## 🚂 Étape 4 : Configurer Railway

**Railway Dashboard → Ton projet → Variables**

### Variables Base de données :
```env
DB_HOST=mysqlXXX.hostinger.com
DB_USER=u123456_flynova
DB_PASSWORD=ton-mot-de-passe-mysql
DB_NAME=u123456_flynova
DB_PORT=3306
```

### Variables FTP :
```env
FTP_HOST=ftp.tondomaine.com
FTP_USER=toncompte@tondomaine.com
FTP_PASSWORD=ton-mot-de-passe-ftp
FTP_PORT=21
FTP_REMOTE_ROOT=/public_html/uploads/
UPLOADS_BASE_URL=https://tondomaine.com/uploads
```

### Variables existantes (garder) :
```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://flynova-frontend.vercel.app
JWT_SECRET=ton-secret-jwt
```

---

## 🔧 Étape 5 : Test de connexion

### Tester MySQL

Depuis Railway, lance cette commande :
```bash
railway run node -e "const mysql = require('mysql2/promise'); mysql.createConnection({host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME}).then(() => console.log('✅ MySQL connected')).catch(err => console.error('❌ Error:', err));"
```

### Tester FTP

Via FileZilla ou autre client FTP :
1. Connecte-toi avec les credentials
2. Upload un fichier test dans `/public_html/uploads/avatars/`
3. Accède à `https://tondomaine.com/uploads/avatars/fichier-test.jpg`
4. Si ça fonctionne → ✅

---

## 📝 Comment ça marche

### Upload d'images

1. **Utilisateur upload** une image via le frontend
2. **Railway backend** reçoit le fichier
3. **Stockage temporaire** sur Railway (dans `public/uploads/`)
4. **Upload automatique** vers Hostinger via FTP
5. **URL retournée** : `https://tondomaine.com/uploads/avatars/xxx.jpg`
6. **Fichier local supprimé** (Railway garde juste le temps de l'upload)

### Avantages

- ✅ Images accessibles depuis `https://tondomaine.com/uploads/...`
- ✅ Stockage permanent sur Hostinger
- ✅ Pas de perte lors des redéploiements Railway
- ✅ Bande passante Hostinger (généralement illimitée)

---

## 🔒 Sécurité (optionnel)

### Créer un `.htaccess` dans `/public_html/uploads/`

```apache
# Empêcher l'exécution de scripts
<FilesMatch "\.(php|phtml|php3|php4|php5|pl|py|jsp|asp|html|htm|shtml|sh|cgi)$">
    deny from all
</FilesMatch>

# Autoriser uniquement les images et documents
<FilesMatch "\.(jpg|jpeg|png|gif|svg|webp|pdf|doc|docx)$">
    allow from all
</FilesMatch>

# Headers de sécurité
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "DENY"
```

---

## 🆘 Dépannage

### Erreur : "Connection refused" (MySQL)

- ✅ Vérifie que l'IP de Railway est autorisée (Hostinger → MySQL → Accès distant)
- ✅ Vérifie `DB_HOST`, `DB_USER`, `DB_PASSWORD`

### Erreur : "FTP connection failed"

- ✅ Vérifie les credentials FTP
- ✅ Essaye avec `FTP_PORT=21` ou `FTP_PORT=22` (SFTP)
- ✅ Vérifie que le pare-feu autorise Railway

### Images ne s'affichent pas

- ✅ Vérifie `UPLOADS_BASE_URL` (doit être ton vrai domaine)
- ✅ Vérifie que les dossiers ont les bonnes permissions (755)
- ✅ Teste l'URL directement dans le navigateur

---

## 📊 Comparaison : Hostinger vs Cloudinary

| Critère | Hostinger | Cloudinary |
|---------|-----------|------------|
| **Coût** | Inclus dans ton plan | Gratuit (25GB) |
| **Bande passante** | Illimitée* | 25GB/mois gratuit |
| **Stockage** | Selon ton plan (50GB+) | 25GB gratuit |
| **Setup** | Plus simple (tout au même endroit) | Configuration externe |
| **CDN** | Cloudflare (selon plan) | CDN mondial intégré |
| **Optimisation images** | Manuelle | Automatique |

**Recommandation** : Hostinger est parfait pour toi car déjà inclus ! 🎉

---

## ✅ Checklist de configuration

- [ ] Base MySQL créée sur Hostinger
- [ ] Schéma importé (database/schema.sql)
- [ ] Dossiers uploads créés (/public_html/uploads/...)
- [ ] Credentials FTP récupérés
- [ ] Variables configurées sur Railway (DB_* et FTP_*)
- [ ] Test connexion MySQL
- [ ] Test upload FTP
- [ ] Images accessibles via https://tondomaine.com/uploads/...

---

**🎉 Une fois configuré, ton backend utilisera Hostinger pour tout : base de données ET stockage d'images !**
