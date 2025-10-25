# Modifications du système de téléchargements - FlyNova

## Résumé des changements

Ce document décrit les modifications apportées au système de téléchargements de FlyNova pour séparer les téléchargements globaux (FlyNova-Acars) des téléchargements spécifiques aux compagnies virtuelles (livrées, documents, etc.).

## Changements effectués

### 1. Page Downloads Principale (`/downloads`)
**Fichier**: `src/app/downloads/page.tsx`

- **Avant**: Affichait tous les téléchargements des VA (livrées, documents, tracker)
- **Après**: Affiche uniquement le tracker **FlyNova-Acars** (Beta)
- Renommé "FlyNova Tracker" en **"FlyNova-Acars"**
- Ajout du badge **BETA** et précision que c'est compatible uniquement avec **MSFS 2020/2024**
- **Windows uniquement** pour le moment (macOS et Linux à venir)
- Suppression des catégories et de la liste des téléchargements VA
- Ajout d'une section d'aide dédiée à FlyNova-Acars

### 2. Page Downloads des VA (`/va/[id]/pilot/downloads`)
**Fichier**: `src/app/va/[id]/pilot/downloads/page.tsx` (NOUVEAU)

- Nouvelle page dédiée aux téléchargements spécifiques à chaque compagnie virtuelle
- Affiche les livrées, documents et autres fichiers de la VA
- Filtrage par type de fichier (Liveries, Documents, Other)
- Accessible via le menu de navigation de la VA

### 3. Base de données
**Fichier**: `database/migrations/001_update_downloads_table.sql`

Modifications de la table `downloads`:
- `file_name` et `file_size` sont maintenant NULLABLE (pour les URLs externes)
- Ajout du champ `is_external_url` (BOOLEAN) pour différencier fichiers locaux et liens externes
- `file_url` peut maintenant contenir une URL externe (ex: Google Drive, Mega, etc.)

**⚠️ IMPORTANT**: Vous devez exécuter cette migration SQL avant d'utiliser les nouvelles fonctionnalités !

```bash
# Depuis MySQL ou phpMyAdmin
mysql -u root -p flynova < database/migrations/001_update_downloads_table.sql
```

### 4. API Downloads
**Fichier**: `server/routes/downloads.js`

Nouvelles fonctionnalités:
- **Nouveau endpoint**: `POST /downloads/:vaId/add` - Permet d'ajouter des liens externes OU des fichiers
- Support des URLs externes pour les livrées (pas besoin d'uploader les fichiers)
- L'ancien endpoint `/upload` est conservé pour rétrocompatibilité
- Modification de la suppression pour ne pas essayer de supprimer les fichiers externes

Exemple d'utilisation:
```json
POST /downloads/:vaId/add
{
  "title": "Boeing 737-800 Livery",
  "description": "Official livery for PMDG 737",
  "fileType": "livery",
  "externalUrl": "https://drive.google.com/file/...",
  "isExternalUrl": true,
  "aircraftId": null
}
```

### 5. Tableau de bord VA - Gestion des Downloads
**Fichier**: `src/app/va/[id]/manage/page.tsx`

Ajouts:
- Nouvel onglet **📥 Downloads** dans le tableau de bord de gestion VA
- Les Owner et Admin peuvent ajouter des liens de téléchargement
- Formulaire pour ajouter:
  - Titre
  - Description
  - Type de fichier (Livery, Document, Other)
  - URL de téléchargement (lien externe)
  - Aircraft associé (optionnel)
- Affichage et gestion des downloads existants
- Possibilité de supprimer les downloads

## Workflow d'utilisation

### Pour les Pilotes:
1. Télécharger le tracker depuis `/downloads`
2. Accéder aux téléchargements VA depuis `/va/[id]/pilot/downloads`
3. Cliquer sur un téléchargement pour ouvrir le lien externe

### Pour les Owner/Admin de VA:
1. Aller dans VA Management (`/va/[id]/manage`)
2. Cliquer sur l'onglet **📥 Downloads**
3. Cliquer sur **+ Add Download Link**
4. Remplir le formulaire avec:
   - Le titre (ex: "Boeing 737-800 Livery")
   - La description
   - Le type (Livery, Document, Other)
   - L'URL de téléchargement (hébergée sur Google Drive, Mega, Dropbox, etc.)
5. Soumettre le formulaire

## Avantages de cette approche

✅ **Pas de stockage de gros fichiers**: Les livrées sont hébergées sur des services externes
✅ **Flexibilité**: Les admins peuvent utiliser n'importe quel service d'hébergement
✅ **Séparation claire**: Tracker global vs. ressources spécifiques VA
✅ **Performance**: Pas de limite de stockage sur le serveur FlyNova
✅ **Simplicité**: Interface simple pour ajouter des liens

## Services d'hébergement recommandés

Pour les livrées et gros fichiers:
- **Google Drive**: Gratuit, 15GB, facile à partager
- **Mega**: Gratuit, 20GB, bon pour gros fichiers
- **Dropbox**: Gratuit, 2GB, interface simple
- **OneDrive**: Gratuit, 5GB
- **GitHub Releases**: Gratuit, illimité, bon pour les packages

## Notes de migration

1. Exécuter la migration SQL AVANT de déployer le code
2. Les téléchargements existants continueront de fonctionner (fichiers locaux)
3. Les nouveaux téléchargements peuvent être des liens externes
4. Penser à mettre à jour la navigation si nécessaire

## Tests à effectuer

- [ ] Télécharger le tracker depuis `/downloads`
- [ ] Accéder à la page downloads d'une VA
- [ ] Ajouter un nouveau download (lien externe) en tant qu'admin
- [ ] Vérifier que le lien s'ouvre correctement
- [ ] Supprimer un download
- [ ] Tester les filtres par type de fichier

## Support

En cas de problème:
1. Vérifier que la migration SQL a été exécutée
2. Vérifier les logs du serveur
3. S'assurer que les URLs externes sont bien formatées (https://)
4. Vérifier les permissions (Owner/Admin uniquement peuvent ajouter)
