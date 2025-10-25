# 📸 Configuration Cloudinary - Stockage d'Images

Cloudinary est un service cloud gratuit pour stocker et gérer vos images (avatars, logos, livrées, etc.).

## 🎁 Plan Gratuit Cloudinary
- ✅ 25 GB de stockage
- ✅ 25 GB de bande passante/mois
- ✅ Transformations d'images automatiques
- ✅ CDN mondial rapide
- ✅ Pas de carte bancaire requise

---

## 🚀 Configuration en 5 minutes

### 1️⃣ Créer un compte Cloudinary

1. Va sur **[cloudinary.com](https://cloudinary.com/users/register/free)**
2. Clique sur **"Sign Up for Free"**
3. Remplis le formulaire :
   - Email
   - Mot de passe
   - Cloud Name (ex: `flynova-prod`)
4. Confirme ton email

### 2️⃣ Récupérer tes credentials

Une fois connecté au Dashboard Cloudinary :

1. Tu verras ton **Dashboard** avec un encadré **"Account Details"**
2. Note ces 3 informations :
   ```
   Cloud Name: your-cloud-name
   API Key: 123456789012345
   API Secret: abcdefghijklmnopqrstuvwxyz
   ```

### 3️⃣ Configurer Railway

Dans **Railway Dashboard** → Ton projet backend → **Variables** :

Ajoute ces 3 nouvelles variables :

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

**⚠️ Important :** Remplace les valeurs par tes vraies credentials !

### 4️⃣ C'est tout ! ✅

Railway va redémarrer automatiquement. Tes images seront maintenant stockées sur Cloudinary !

---

## 📁 Organisation des fichiers

Les images seront automatiquement organisées dans Cloudinary :

```
flynova/
├── avatars/          # Photos de profil
├── logos/            # Logos des VA
├── liveries/         # Livrées des avions
├── events/           # Images d'événements
└── documents/        # Documents PDF, etc.
```

---

## 🎨 Avantages de Cloudinary

### ✅ Transformations automatiques
Les images sont automatiquement redimensionnées et optimisées :
- **Avatars** : 400x400px
- **Logos** : Max 800x800px
- **Livrées** : Max 1920x1080px
- **Events** : Max 1200x630px

### ✅ URLs directes
Cloudinary fournit des URLs CDN rapides :
```
https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/flynova/avatars/abc123.jpg
```

### ✅ Persistant
Contrairement à Railway, les fichiers restent même après redéploiement !

---

## 🔧 Comment ça marche dans ton backend

### Upload d'un avatar (exemple)

**Frontend :**
```javascript
const formData = new FormData();
formData.append('avatar', file);

await fetch(`${API_URL}/profile/avatar`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

**Backend (déjà configuré) :**
```javascript
// server/routes/profile.js
const { uploadAvatarMiddleware } = require('../middleware/upload');

router.post('/avatar', auth, uploadAvatarMiddleware, async (req, res) => {
  // req.file.path contient l'URL Cloudinary
  const avatarUrl = req.file.path;
  
  // Sauvegarder dans la DB
  await db.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, req.user.id]);
  
  res.json({ success: true, avatarUrl });
});
```

---

## 📊 Monitoring

Dashboard Cloudinary te permet de :
- ✅ Voir toutes tes images
- ✅ Surveiller l'utilisation (stockage/bande passante)
- ✅ Gérer les dossiers
- ✅ Supprimer des images

---

## 🆘 Problèmes courants

### Erreur : "Invalid cloud_name"
👉 Vérifie que `CLOUDINARY_CLOUD_NAME` est correct (sans espaces)

### Erreur : "Invalid credentials"
👉 Vérifie `CLOUDINARY_API_KEY` et `CLOUDINARY_API_SECRET`

### Images ne s'affichent pas
👉 Vérifie les logs Railway pour voir l'URL Cloudinary générée

---

## 🔗 Ressources

- **Dashboard** : [cloudinary.com/console](https://cloudinary.com/console)
- **Documentation** : [cloudinary.com/documentation](https://cloudinary.com/documentation)
- **Support** : [support.cloudinary.com](https://support.cloudinary.com)

---

**🎉 Une fois configuré, tes images seront stockées de façon permanente et accessible partout dans le monde via CDN !**
