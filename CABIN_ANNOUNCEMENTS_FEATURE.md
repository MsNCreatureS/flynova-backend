# Cabin Announcements Feature 📢

## Description
Cette fonctionnalité permet aux administrateurs de VA d'uploader des fichiers audio d'annonces cabine personnalisées. Ces fichiers seront ensuite récupérés par le tracker (ACARS) pour être joués pendant les vols.

## Date d'ajout
27 Octobre 2025

## Fonctionnalités

### Pour les Owner/Admin de VA:
- Upload de fichiers audio (MP3, WAV, OGG, M4A)
- Taille maximale: 10MB par fichier
- Types d'annonces supportés:
  - 🚪 Boarding (embarquement)
  - 🦺 Safety (sécurité)
  - 🛫 Takeoff (décollage)
  - ✈️ Cruise (croisière)
  - 📉 Descent (descente)
  - 🛬 Landing (atterrissage)
  - 🏁 Arrival (arrivée)
  - 🎤 Custom (personnalisé)

### Pour le Tracker (ACARS):
- API endpoint pour récupérer toutes les annonces d'une VA
- Fichiers audio hébergés sur Hostinger via FTP
- URLs publiques accessibles directement

## Architecture

### Base de données
**Table**: `va_cabin_announcements`
```sql
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- va_id (INT, FOREIGN KEY vers virtual_airlines)
- title (VARCHAR 255)
- description (TEXT)
- audio_url (VARCHAR 500) - URL publique du fichier
- announcement_type (ENUM)
- duration (INT) - durée en secondes
- file_size (INT) - taille en bytes
- uploaded_by (INT, FOREIGN KEY vers users)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Backend Routes
**Base URL**: `/api/cabin-announcements`

#### GET `/:vaId`
Récupère toutes les annonces cabine d'une VA.

**Auth**: Required (JWT token)
**Response**:
```json
{
  "announcements": [
    {
      "id": 1,
      "va_id": 1,
      "title": "Welcome Announcement",
      "description": "Played during boarding",
      "audio_url": "https://darkblue-baboon-659394.hostingersite.com/uploads/announcements/welcome-1730000000.mp3",
      "announcement_type": "boarding",
      "duration": 30,
      "file_size": 1024000,
      "uploaded_by": 1,
      "uploaded_by_username": "admin",
      "created_at": "2025-10-27T10:00:00.000Z",
      "updated_at": "2025-10-27T10:00:00.000Z"
    }
  ]
}
```

#### POST `/:vaId`
Upload une nouvelle annonce cabine.

**Auth**: Required (Admin/Owner role)
**Content-Type**: `multipart/form-data`
**Body**:
- `title` (string, required)
- `description` (string, optional)
- `announcement_type` (string, required)
- `duration` (number, optional)
- `audio` (file, required) - Fichier audio

**Response**:
```json
{
  "message": "Cabin announcement uploaded successfully",
  "announcement": {
    "id": 1,
    "title": "Welcome Announcement",
    "audio_url": "https://...",
    ...
  }
}
```

#### DELETE `/:vaId/:announcementId`
Supprime une annonce cabine.

**Auth**: Required (Admin/Owner role)
**Response**:
```json
{
  "message": "Cabin announcement deleted successfully"
}
```

### Frontend
**Page**: `/va/[id]/manage` - Onglet "📢 Cabin Announcements"

**Fonctionnalités UI**:
- Liste des annonces avec player audio intégré
- Badge de type d'annonce (coloré par type)
- Affichage durée et taille du fichier
- Bouton de suppression
- Modal d'upload avec formulaire:
  - Titre
  - Description
  - Type d'annonce
  - Durée (optionnel)
  - Sélecteur de fichier audio

### Stockage des fichiers
- **Local temp**: `public/uploads/announcements/` (temporaire pendant l'upload)
- **Hostinger FTP**: `/public_html/uploads/announcements/`
- **URL publique**: `https://darkblue-baboon-659394.hostingersite.com/uploads/announcements/[filename]`

Le fichier local est automatiquement supprimé après l'upload FTP réussi.

## Migration SQL

Le fichier de migration est situé dans:
```
database/migrations/005_add_cabin_announcements.sql
```

Pour exécuter la migration:
```bash
# Option 1: Via le runner de migrations
node server/migrations/run.js

# Option 2: Manuellement via MySQL
mysql -u username -p database_name < database/migrations/005_add_cabin_announcements.sql
```

## Configuration requise

### Variables d'environnement (.env)
Les variables FTP doivent être configurées (déjà en place):
```env
FTP_HOST=ftp.yourdomain.com
FTP_USER=your_ftp_user
FTP_PASSWORD=your_ftp_password
FTP_PORT=21
FTP_REMOTE_ROOT=/public_html/uploads/
UPLOADS_BASE_URL=https://your-domain.com/uploads
```

## Utilisation pour le Tracker (ACARS)

### Étape 1: Récupérer les annonces
```javascript
const response = await fetch(`${API_URL}/cabin-announcements/${vaId}`, {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});

const { announcements } = await response.json();
```

### Étape 2: Filtrer par type
```javascript
const boardingAnnouncement = announcements.find(
  a => a.announcement_type === 'boarding'
);

const takeoffAnnouncement = announcements.find(
  a => a.announcement_type === 'takeoff'
);
```

### Étape 3: Jouer l'audio
```javascript
// Télécharger le fichier
const audioBlob = await fetch(boardingAnnouncement.audio_url).then(r => r.blob());

// Jouer avec un audio player
const audio = new Audio(boardingAnnouncement.audio_url);
audio.play();
```

## Exemple de workflow complet

1. **Admin VA upload une annonce**:
   - Se connecte à `/va/123/manage`
   - Clique sur l'onglet "📢 Cabin Announcements"
   - Clique "+ Add Cabin Announcement"
   - Remplit le formulaire et sélectionne un fichier MP3
   - Upload → fichier envoyé sur Hostinger

2. **Pilote démarre un vol avec le tracker**:
   - Tracker se connecte à l'API
   - Récupère les annonces de la VA
   - Pendant le vol, joue les annonces aux moments appropriés

3. **Bénéfices**:
   - Expérience de vol plus immersive
   - Personnalisation pour chaque VA
   - Audio de haute qualité hébergé de manière fiable

## Tests recommandés

### Test 1: Upload d'un fichier MP3
1. Créer un fichier audio de test (< 10MB)
2. Se connecter en tant qu'admin d'une VA
3. Aller sur `/va/[id]/manage` → Cabin Announcements
4. Cliquer "Add Cabin Announcement"
5. Remplir le formulaire et uploader
6. Vérifier que l'annonce apparaît dans la liste
7. Tester la lecture audio dans le browser

### Test 2: Récupération via API
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/cabin-announcements/1
```

### Test 3: Suppression
1. Cliquer sur le bouton "Delete" d'une annonce
2. Confirmer la suppression
3. Vérifier que l'annonce disparaît

## Limites et considérations

- **Taille max**: 10MB par fichier (modifiable dans `hostinger-upload.js`)
- **Formats supportés**: MP3, WAV, OGG, M4A
- **Stockage**: Les fichiers ne sont PAS stockés dans la base de données, seulement les URLs
- **Bandwidth**: Pas de limite imposée par l'app, mais dépend de l'hébergement Hostinger
- **Sécurité**: Les URLs sont publiques une fois uploadées

## Améliorations futures possibles

- [ ] Compression automatique des fichiers audio
- [ ] Preview/écoute avant upload
- [ ] Durée automatiquement détectée depuis le fichier
- [ ] Support de playlists (multiple announcements par type)
- [ ] Statistiques d'utilisation des annonces
- [ ] Volume/gain adjustment dans l'interface
- [ ] Export/Import d'annonces entre VAs

## Support

Pour toute question ou problème:
- Vérifier les logs serveur: `server/logs/`
- Vérifier les permissions FTP
- S'assurer que la migration SQL a été exécutée
- Vérifier que l'URL de base des uploads est correcte dans `.env`
