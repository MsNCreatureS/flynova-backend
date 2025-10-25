# 🚀 Guide de Déploiement - FlyNova Backend

Ce guide explique comment déployer le backend FlyNova sur un serveur de production.

## 📋 Prérequis Serveur

- Ubuntu/Debian 20.04+ (ou autre distribution Linux)
- Node.js 18+ installé
- MySQL 5.7+ ou MariaDB 10.3+
- Accès SSH root ou sudo
- Nom de domaine pointant vers votre serveur (optionnel mais recommandé)

## 🛠️ Installation sur Serveur

### 1. Préparer le serveur

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Installer MySQL/MariaDB (si pas déjà installé)
sudo apt install -y mysql-server

# Sécuriser MySQL
sudo mysql_secure_installation
```

### 2. Configurer MySQL

```bash
# Se connecter à MySQL
sudo mysql -u root -p

# Créer la base de données et l'utilisateur
CREATE DATABASE flynova CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'flynova_user'@'localhost' IDENTIFIED BY 'VotreMotDePasseSecurise';
GRANT ALL PRIVILEGES ON flynova.* TO 'flynova_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Déployer le code

```bash
# Créer un utilisateur dédié (recommandé)
sudo adduser flynova
sudo usermod -aG sudo flynova
su - flynova

# Cloner le repository
cd ~
git clone <votre-repo-url> flynova-backend
cd flynova-backend

# Installer les dépendances
npm install --production
```

### 4. Configuration

```bash
# Copier et éditer le fichier d'environnement
cp .env.example .env
nano .env
```

Configurer les variables importantes :

```env
NODE_ENV=production
PORT=3001

DB_HOST=localhost
DB_USER=flynova_user
DB_PASSWORD=VotreMotDePasseSecurise
DB_NAME=flynova

FRONTEND_URL=https://votre-frontend-domain.com

JWT_SECRET=GenerezUneCleSecureTresLongueEtAleatoire

SMTP_HOST=smtp.gmail.com
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app
```

### 5. Initialiser la base de données

```bash
# Importer le schéma
mysql -u flynova_user -p flynova < database/schema.sql

# Exécuter les migrations
npm run migrate

# (Optionnel) Importer les données aéroports/avions
npm run import:data
```

### 6. Installer et configurer PM2

```bash
# Installer PM2 globalement
sudo npm install -g pm2

# Créer le dossier logs
mkdir -p logs

# Démarrer l'application
pm2 start ecosystem.config.js --env production

# Configurer PM2 pour démarrer au boot
pm2 startup
# Copier-coller la commande affichée

# Sauvegarder la configuration PM2
pm2 save
```

### 7. Configurer le pare-feu

```bash
# Autoriser le port de l'API (si nécessaire)
sudo ufw allow 3001/tcp

# Autoriser SSH
sudo ufw allow 22/tcp

# Activer le pare-feu
sudo ufw enable
```

## 🔒 Configuration Nginx (Reverse Proxy recommandé)

Pour plus de sécurité et de performance, utilisez Nginx comme reverse proxy :

### Installer Nginx

```bash
sudo apt install -y nginx
```

### Configurer le virtual host

```bash
sudo nano /etc/nginx/sites-available/flynova-api
```

Contenu du fichier :

```nginx
server {
    listen 80;
    server_name api.votre-domaine.com;

    # Logs
    access_log /var/log/nginx/flynova-api-access.log;
    error_log /var/log/nginx/flynova-api-error.log;

    # Limite de taille des uploads
    client_max_body_size 10M;

    # Proxy vers Node.js
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Servir les fichiers statiques directement
    location /uploads/ {
        alias /home/flynova/flynova-backend/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Activer le site et redémarrer Nginx

```bash
sudo ln -s /etc/nginx/sites-available/flynova-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Configurer SSL avec Let's Encrypt

```bash
# Installer certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir un certificat SSL
sudo certbot --nginx -d api.votre-domaine.com

# Le renouvellement automatique est configuré par défaut
```

## 📊 Commandes utiles PM2

```bash
# Voir le statut
pm2 status

# Voir les logs
pm2 logs flynova-api

# Logs en temps réel
pm2 logs --lines 100

# Redémarrer l'application
pm2 restart flynova-api

# Arrêter l'application
pm2 stop flynova-api

# Supprimer l'application de PM2
pm2 delete flynova-api

# Monitoring
pm2 monit
```

## 🔄 Mise à jour du code

```bash
cd ~/flynova-backend

# Récupérer les dernières modifications
git pull origin main

# Installer les nouvelles dépendances
npm install --production

# Exécuter les migrations si nécessaire
npm run migrate

# Redémarrer l'application
pm2 restart flynova-api
```

## 🐛 Dépannage

### L'API ne démarre pas

```bash
# Vérifier les logs
pm2 logs flynova-api --lines 50

# Vérifier la configuration
cat .env

# Tester la connexion à la base de données
mysql -u flynova_user -p -h localhost flynova
```

### Problèmes de CORS

Vérifier que `FRONTEND_URL` dans `.env` correspond exactement à l'URL de votre frontend :

```env
FRONTEND_URL=https://app.votredomaine.com
```

Pour plusieurs domaines :

```env
FRONTEND_URL=https://app.votredomaine.com,https://admin.votredomaine.com
```

### Les uploads ne fonctionnent pas

```bash
# Vérifier les permissions
ls -la public/uploads/
chmod -R 755 public/uploads/
chown -R flynova:flynova public/uploads/
```

### Port déjà utilisé

```bash
# Trouver le processus utilisant le port
sudo lsof -i :3001

# Tuer le processus si nécessaire
sudo kill -9 <PID>
```

## 📈 Monitoring et Logs

### Logs applicatifs

```bash
# Voir les logs de l'application
pm2 logs flynova-api

# Logs d'erreurs uniquement
pm2 logs flynova-api --err

# Logs de sortie uniquement
pm2 logs flynova-api --out
```

### Logs Nginx

```bash
# Logs d'accès
sudo tail -f /var/log/nginx/flynova-api-access.log

# Logs d'erreurs
sudo tail -f /var/log/nginx/flynova-api-error.log
```

### Monitoring système

```bash
# Installer htop
sudo apt install htop

# Surveiller les ressources
htop

# Surveiller PM2
pm2 monit
```

## 🔐 Sécurité

### Bonnes pratiques

1. **Utilisez toujours HTTPS** en production (Let's Encrypt)
2. **JWT_SECRET** : Générez une clé longue et aléatoire
3. **Mots de passe base de données** : Utilisez des mots de passe forts
4. **Mettez à jour régulièrement** : `npm update`, `apt update`
5. **Sauvegardez la base de données** régulièrement
6. **Limitez les accès SSH** : Utilisez des clés SSH, désactivez le login root
7. **Pare-feu** : N'ouvrez que les ports nécessaires

### Sauvegardes automatiques de la base de données

Créer un script de backup :

```bash
nano ~/backup-db.sh
```

Contenu :

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/flynova/backups"
mkdir -p $BACKUP_DIR
mysqldump -u flynova_user -p'VotreMotDePasse' flynova | gzip > $BACKUP_DIR/flynova_$DATE.sql.gz
# Garder seulement les 7 derniers backups
find $BACKUP_DIR -name "flynova_*.sql.gz" -type f -mtime +7 -delete
```

Rendre exécutable et ajouter au crontab :

```bash
chmod +x ~/backup-db.sh
crontab -e

# Ajouter cette ligne pour un backup quotidien à 2h du matin
0 2 * * * /home/flynova/backup-db.sh
```

## 🌐 Configuration DNS

Pointer votre domaine vers le serveur :

```
Type: A
Nom: api (ou @)
Valeur: <IP_de_votre_serveur>
TTL: 3600
```

## ✅ Checklist de déploiement

- [ ] Serveur configuré et à jour
- [ ] Node.js 18+ installé
- [ ] MySQL/MariaDB installé et sécurisé
- [ ] Base de données créée et initialisée
- [ ] Code déployé et dépendances installées
- [ ] Fichier `.env` configuré
- [ ] PM2 installé et configuré
- [ ] Application démarrée avec PM2
- [ ] PM2 configuré pour démarrer au boot
- [ ] Nginx installé et configuré (optionnel mais recommandé)
- [ ] SSL/HTTPS configuré (Let's Encrypt)
- [ ] Pare-feu configuré
- [ ] DNS configuré
- [ ] Tests de l'API effectués
- [ ] Backups automatiques configurés

## 📞 Support

Pour toute question, consulter la documentation ou créer une issue sur GitHub.

---

Bon déploiement ! ✈️
