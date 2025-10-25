# 🛫 FlyNova Backend API# 🛫 FlyNova Backend API# FlyNova - Virtual Airline Management Platform



Backend API pour la plateforme de gestion de compagnies aériennes virtuelles FlyNova.



![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)Backend API pour la plateforme de gestion de compagnies aériennes virtuelles FlyNova.![FlyNova Banner](https://img.shields.io/badge/FlyNova-Virtual%20Airline%20Platform-0ea5e9?style=for-the-badge)

![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express)

![MySQL](https://img.shields.io/badge/MySQL-5.7+-4479A1?style=flat-square&logo=mysql&logoColor=white)



## 🚀 Déploiement Rapide## 📋 PrérequisA modern, production-ready virtual airline management platform built with Next.js, Express.js, and MySQL. Designed for flight simulation enthusiasts to create, manage, and participate in virtual airlines.



### Railway (Recommandé - 5 minutes) 🚂



Le moyen le plus rapide de déployer ton backend !- Node.js >= 18.0.0## ✈️ Features



👉 **[Guide Quick Start Railway](./QUICKSTART_RAILWAY.md)**- MySQL 5.7+ ou MariaDB 10.3+



[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)- npm ou yarn### Core Functionality



### Autres options de déploiement- **Virtual Airline Management**: Create and manage your own VA or join existing ones



- **VPS/Serveur dédié** : Voir le [guide de déploiement complet](./DEPLOYMENT.md)## 🚀 Installation- **Fleet Management**: Track aircraft using real-world data from OpenFlights

- **Docker** : `Dockerfile` inclus dans le projet

- **Route Planning**: Create routes between thousands of airports worldwide

## 📋 Prérequis

### 1. Cloner le repository- **Flight Tracking**: Real-time flight tracking with telemetry data

- Node.js >= 18.0.0

- MySQL 5.7+ ou MariaDB 10.3+- **Flight Validation**: Admin approval system for completed flights

- npm ou yarn

```bash- **Points System**: Earn points for validated flights

## 🏃 Installation Locale

git clone <your-repo-url>- **Leaderboards**: Compete with other pilots in your VA

### 1. Cloner le repository

cd flynova-backend- **Events & Challenges**: Create focus airport challenges and special events

```bash

git clone https://github.com/MsNCreatureS/flynova-backend.git```- **Downloads**: Share liveries, tracker software, and resources

cd flynova-backend

```- **Achievements**: Unlock achievements based on flight milestones



### 2. Installer les dépendances### 2. Installer les dépendances



```bash### User Roles

npm install

``````bash- **Pilot**: Join VAs, book flights, track flights, earn points



### 3. Configurationnpm install- **Admin**: Manage fleet, routes, validate flights, manage events



Copier `.env.example` vers `.env` :```- **Owner**: Full VA management + admin privileges



```bash

cp .env.example .env

```### 3. Configuration de l'environnement## 🚀 Tech Stack



Configurer les variables dans `.env` :



```envCopier le fichier `.env.example` vers `.env` et configurer les variables :### Frontend

NODE_ENV=development

PORT=3001- **Next.js 14** - React framework with App Router



DB_HOST=localhost```bash- **TypeScript** - Type-safe development

DB_USER=root

DB_PASSWORD=cp .env.example .env- **Tailwind CSS** - Utility-first styling

DB_NAME=flynova

```- **Framer Motion** - Smooth animations

FRONTEND_URL=http://localhost:3000

- **Recharts** - Data visualization

JWT_SECRET=your-secret-key

```Éditer le fichier `.env` avec vos valeurs :



### 4. Initialiser la base de données### Backend



```bash```env- **Node.js** - Runtime environment

# Créer la base

mysql -u root -p -e "CREATE DATABASE flynova"# Server- **Express.js** - RESTful API server



# Importer le schémaNODE_ENV=production- **MySQL** - Relational database

mysql -u root -p flynova < database/schema.sql

PORT=3001- **JWT** - Authentication

# Exécuter les migrations

npm run migrate- **Bcrypt** - Password hashing

```

# Database- **Multer** - File uploads

### 5. (Optionnel) Importer les données

DB_HOST=localhost

```bash

npm run import:dataDB_USER=your_user## 📋 Prerequisites

```

DB_PASSWORD=your_password

### 6. Démarrer le serveur

DB_NAME=flynova- **Node.js** >= 18.0.0

```bash

# Mode développement- **MySQL** >= 5.7 or MariaDB >= 10.3

npm run dev

# Frontend URL (important pour CORS)- **npm** or **yarn**

# Mode production

npm startFRONTEND_URL=https://your-frontend-domain.com

```

## 🔧 Installation

L'API est accessible sur `http://localhost:3001`

# JWT Secret

## 📁 Structure du projet

JWT_SECRET=your-super-secret-key### 1. Clone the Repository

```

flynova-backend/

├── server/

│   ├── index.js              # Point d'entrée API# Email SMTP```bash

│   ├── config/

│   │   └── database.js       # Configuration MySQLSMTP_HOST=smtp.gmail.comgit clone <your-repo-url>

│   ├── middleware/

│   │   └── auth.js           # Auth JWTSMTP_USER=your-email@gmail.comcd FlyNova

│   ├── routes/               # Routes API

│   │   ├── auth.jsSMTP_PASS=your-password```

│   │   ├── virtualAirlines.js

│   │   ├── fleet.js```

│   │   ├── flights.js

│   │   └── ...### 2. Install Dependencies

│   ├── services/

│   │   └── email.js          # Service email### 4. Initialiser la base de données

│   └── scripts/

│       └── import-openflights.js```bash

├── database/

│   ├── schema.sql            # Schéma BDD```bashnpm install

│   └── migrations/           # Migrations

├── public/# Importer le schéma de base```

│   └── uploads/              # Fichiers uploadés

├── .env.examplemysql -u root -p flynova < database/schema.sql

├── ecosystem.config.js       # Config PM2

├── railway.json              # Config Railway### 3. Configure Environment Variables

├── nixpacks.toml             # Config Nixpacks

└── package.json# Exécuter les migrations

```

npm run migrateCreate a `.env` file in the root directory:

## 🔌 API Endpoints

```

### Authentication

- `POST /api/auth/register` - Inscription```bash

- `POST /api/auth/login` - Connexion

- `POST /api/auth/forgot-password` - Réinitialisation### 5. (Optionnel) Importer les données aéroports/avionscp .env.example .env



### Virtual Airlines```

- `GET /api/virtual-airlines` - Liste des VAs

- `POST /api/virtual-airlines` - Créer une VA```bash

- `GET /api/virtual-airlines/:id` - Détails VA

- `PUT /api/virtual-airlines/:id` - Modifier VAnpm run import:dataEdit `.env` with your configuration:



### Fleet```

- `GET /api/fleet/:vaId` - Flotte d'une VA

- `POST /api/fleet/:vaId` - Ajouter avion```env

- `PUT /api/fleet/:id` - Modifier avion

- `DELETE /api/fleet/:id` - Supprimer avion## 🏃 Démarrage# Application



### Routes & FlightsNODE_ENV=development

- `GET /api/routes/:vaId` - Routes VA

- `POST /api/routes/:vaId` - Créer route### Mode développementPORT=3001

- `GET /api/flights/:vaId` - Vols disponibles

- `POST /api/flights/book` - Réserver volNEXT_PUBLIC_API_URL=http://localhost:3001/api



### Admin```bash

- `GET /api/admin/:vaId/pilots` - Liste pilotes

- `PUT /api/admin/:vaId/pilots/:id` - Modifier pilotenpm run dev# Database

- `GET /api/admin/:vaId/pireps` - PIREPs en attente

- `PUT /api/admin/:vaId/pireps/:id` - Approuver/Rejeter```DB_HOST=localhost



### DataDB_PORT=3306

- `GET /api/airports/search?q=XXX` - Recherche aéroports

- `GET /api/aircraft/search?q=XXX` - Recherche avions### Mode productionDB_USER=root



### Health CheckDB_PASSWORD=your_password

- `GET /api/health` - Status API

```bashDB_NAME=flynova

## 🛠️ Scripts disponibles

npm start

```bash

npm start          # Démarrer en production```# JWT

npm run dev        # Démarrer en développement (auto-reload)

npm run migrate    # Exécuter les migrationsJWT_SECRET=your-super-secret-jwt-key-change-this-in-production

npm run import:data # Importer données OpenFlights

npm run test:api   # Tester l'API## 📁 Structure du projetJWT_EXPIRES_IN=7d

npm run test:email # Tester la configuration email

```



## 🔒 Sécurité```# File Upload



- ✅ CORS configuré (variable `FRONTEND_URL`)flynova-backend/UPLOAD_DIR=./public/uploads

- ✅ JWT pour l'authentification

- ✅ Mots de passe hashés (bcrypt)├── server/MAX_FILE_SIZE=10485760

- ✅ Protection SQL injection (prepared statements)

- ✅ Validation des données│   ├── index.js              # Point d'entrée de l'API



## 📚 Documentation│   ├── config/# OpenFlights Data URLs



- 🚂 [Quick Start Railway](./QUICKSTART_RAILWAY.md) - Déploiement Railway│   │   └── database.js       # Configuration MySQLAIRPORTS_DATA_URL=https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat

- 📖 [Guide de déploiement VPS](./DEPLOYMENT.md) - Déploiement serveur

- 🐳 [Docker](./Dockerfile) - Containerisation│   ├── middleware/AIRCRAFT_DATA_URL=https://raw.githubusercontent.com/jpatokal/openflights/master/data/planes.dat



## 🌐 Variables d'environnement│   │   └── auth.js           # Middleware d'authentification JWT```



| Variable | Description | Exemple |│   ├── routes/               # Routes API

|----------|-------------|---------|

| `NODE_ENV` | Environnement | `production` |│   │   ├── auth.js### 4. Create Database

| `PORT` | Port serveur | `3001` |

| `FRONTEND_URL` | URL frontend (CORS) | `https://app.com` |│   │   ├── virtualAirlines.js

| `DB_HOST` | MySQL host | `localhost` |

| `DB_USER` | MySQL user | `root` |│   │   ├── fleet.js```sql

| `DB_PASSWORD` | MySQL password | `password` |

| `DB_NAME` | Database name | `flynova` |│   │   ├── flights.jsCREATE DATABASE flynova CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

| `JWT_SECRET` | Clé JWT | `random-secret` |

| `SMTP_*` | Config email | Voir `.env.example` |│   │   ├── admin.js```



## 🐛 Troubleshooting│   │   ├── downloads.js



### L'API ne démarre pas│   │   └── ...### 5. Run Migrations

```bash

# Vérifier les variables d'environnement│   ├── services/

cat .env

│   │   └── email.js          # Service d'envoi d'emails```bash

# Vérifier la connexion MySQL

mysql -u root -p flynova│   └── scripts/npm run migrate

```

│       └── import-openflights.js```

### Erreurs CORS

Vérifier que `FRONTEND_URL` dans `.env` correspond exactement à l'URL de ton frontend.├── database/



### Tests│   ├── schema.sql            # Schéma de base de données### 6. Import OpenFlights Data

```bash

# Tester la connexion API│   └── migrations/           # Migrations SQL

npm run test:api

├── public/```bash

# Tester l'email

npm run test:email│   └── uploads/              # Fichiers uploadésnpm run import:data

```

├── .env.example              # Template de configuration```

## 📄 Licence

├── ecosystem.config.js       # Configuration PM2

MIT

└── package.jsonThis will import:

## 🤝 Contribution

```- ~250 aircraft types

Les contributions sont les bienvenues ! N'hésite pas à ouvrir une issue ou une PR.

- ~7,500+ airports worldwide

## 📞 Support

## 🔌 API Endpoints

- 📖 [Documentation](./README.md)

- 🐛 [Issues](https://github.com/MsNCreatureS/flynova-backend/issues)### 7. Create Uploads Directory



---### Authentication



Développé avec ❤️ pour la communauté des simulateurs de vol ✈️- `POST /api/auth/register` - Inscription```bash


- `POST /api/auth/login` - Connexionmkdir -p public/uploads

- `POST /api/auth/forgot-password` - Demande de réinitialisation```

- `POST /api/auth/reset-password` - Réinitialisation mot de passe

## 🏃 Running the Application

### Virtual Airlines

- `GET /api/virtual-airlines` - Liste des VA### Development Mode

- `POST /api/virtual-airlines` - Créer une VA

- `GET /api/virtual-airlines/:id` - Détails d'une VA```bash

- `PUT /api/virtual-airlines/:id` - Mettre à jour une VA# Terminal 1: Start API server

npm run server:dev

### Fleet Management

- `GET /api/fleet/:vaId` - Flotte d'une VA# Terminal 2: Start Next.js frontend

- `POST /api/fleet/:vaId` - Ajouter un avionnpm run dev

- `PUT /api/fleet/:id` - Modifier un avion```

- `DELETE /api/fleet/:id` - Supprimer un avion

Access the application:

### Routes & Flights- **Frontend**: http://localhost:3000

- `GET /api/routes/:vaId` - Routes d'une VA- **API**: http://localhost:3001

- `POST /api/routes/:vaId` - Créer une route

- `GET /api/flights/:vaId` - Vols disponibles### Production Mode

- `POST /api/flights/book` - Réserver un vol

```bash

### Admin# Build frontend

- `GET /api/admin/:vaId/pilots` - Liste des pilotesnpm run build

- `PUT /api/admin/:vaId/pilots/:id` - Modifier un pilote

- `GET /api/admin/:vaId/pireps` - PIREPs en attente# Start both servers

- `PUT /api/admin/:vaId/pireps/:id` - Approuver/Rejeter PIREPnpm run server & npm start

```

### Downloads

- `GET /api/downloads` - Liste globale## 📁 Project Structure

- `GET /api/downloads/:vaId` - Downloads d'une VA

- `POST /api/downloads/:vaId` - Créer un download (admin)```

FlyNova/

### Data├── database/

- `GET /api/airports/search?q=XXX` - Recherche aéroports│   └── schema.sql                 # Database schema

- `GET /api/aircraft/search?q=XXX` - Recherche avions├── public/

│   └── uploads/                   # File uploads directory

### Health Check├── server/

- `GET /api/health` - Vérifier le statut de l'API│   ├── config/

│   │   └── database.js           # Database connection

## 🚢 Déploiement│   ├── middleware/

│   │   └── auth.js               # Authentication middleware

### Avec PM2 (recommandé)│   ├── migrations/

│   │   └── run.js                # Migration runner

```bash│   ├── routes/

# Installer PM2 globalement│   │   ├── admin.js              # Admin endpoints

npm install -g pm2│   │   ├── auth.js               # Authentication

│   │   ├── data.js               # Aircraft/Airport data

# Démarrer l'application│   │   ├── downloads.js          # File downloads

pm2 start ecosystem.config.js│   │   ├── fleet.js              # Fleet management

│   │   ├── flights.js            # Flight operations

# Autres commandes utiles│   │   ├── profile.js            # User profiles

pm2 status          # Voir le statut│   │   ├── routes.js             # Route management

pm2 logs            # Voir les logs│   │   └── virtualAirlines.js    # VA management

pm2 restart all     # Redémarrer│   ├── scripts/

pm2 stop all        # Arrêter│   │   └── import-openflights.js # Data import script

```│   └── index.js                   # Express server

├── src/

### Configuration PM2 pour auto-restart au démarrage│   └── app/

│       ├── auth/

```bash│       │   ├── login/            # Login page

pm2 startup│       │   └── register/         # Registration page

pm2 save│       ├── globals.css           # Global styles

```│       ├── layout.tsx            # Root layout

│       └── page.tsx              # Homepage

### Avec Docker (optionnel)├── .env.example                   # Environment template

├── .gitignore

Créer un `Dockerfile` :├── next.config.js

├── package.json

```dockerfile├── postcss.config.js

FROM node:18-alpine├── tailwind.config.ts

WORKDIR /app└── tsconfig.json

COPY package*.json ./```

RUN npm ci --only=production

COPY . .## 🔐 API Endpoints

EXPOSE 3001

CMD ["npm", "start"]### Authentication

```- `POST /api/auth/register` - Register new user

- `POST /api/auth/login` - Login user

### Variables d'environnement importantes en production- `GET /api/auth/me` - Get current user (protected)



- `NODE_ENV=production`### Virtual Airlines

- `FRONTEND_URL` - URL(s) de votre frontend (séparées par des virgules si plusieurs)- `GET /api/virtual-airlines` - List all VAs

- `DB_HOST`, `DB_USER`, `DB_PASSWORD` - Credentials de la base de données- `POST /api/virtual-airlines` - Create VA (protected)

- `JWT_SECRET` - Clé secrète forte et unique- `GET /api/virtual-airlines/:vaId` - Get VA details

- `SMTP_*` - Configuration email pour les notifications- `POST /api/virtual-airlines/:vaId/join` - Join VA (protected)

- `GET /api/virtual-airlines/:vaId/leaderboard` - Get leaderboard

## 🔒 Sécurité- `PUT /api/virtual-airlines/:vaId` - Update VA (admin)



- ✅ CORS configuré pour accepter uniquement les domaines autorisés### Fleet Management

- ✅ JWT pour l'authentification- `GET /api/fleet/:vaId` - Get VA fleet

- ✅ Mots de passe hashés avec bcrypt- `POST /api/fleet/:vaId` - Add aircraft (admin)

- ✅ Validation des données d'entrée- `PUT /api/fleet/:vaId/:fleetId` - Update aircraft (admin)

- ✅ Protection contre les injections SQL (prepared statements)- `DELETE /api/fleet/:vaId/:fleetId` - Remove aircraft (admin)

- ✅ Headers de sécurité Express

### Routes

## 📝 Notes- `GET /api/routes/:vaId` - Get VA routes

- `POST /api/routes/:vaId` - Create route (admin)

### CORS- `PUT /api/routes/:vaId/:routeId` - Update route (admin)

Le backend accepte les requêtes uniquement depuis les URLs définies dans `FRONTEND_URL`. Pour plusieurs domaines :- `DELETE /api/routes/:vaId/:routeId` - Delete route (admin)



```env### Flights

FRONTEND_URL=https://app.flynova.com,https://admin.flynova.com- `GET /api/flights/my-flights` - Get user flights (protected)

```- `POST /api/flights/reserve` - Reserve flight (protected)

- `POST /api/flights/:flightId/start` - Start flight (protected)

### Uploads- `POST /api/flights/:flightId/report` - Submit flight report (protected)

Les fichiers uploadés (logos VA, documents) sont stockés dans `public/uploads/`. Assurez-vous que ce dossier a les bonnes permissions en production.- `GET /api/flights/active/:vaId` - Get active flights



### Base de données### Admin

Le fichier `flynova.sql` contient un export complet. Pour une nouvelle installation, utilisez plutôt `database/schema.sql` + migrations.- `GET /api/admin/:vaId/pending-reports` - Get pending reports (admin)

- `POST /api/admin/:vaId/validate-report/:reportId` - Validate flight (admin)

## 🐛 Debugging- `GET /api/admin/:vaId/members` - Get VA members (admin)

- `PUT /api/admin/:vaId/members/:memberId` - Update member (owner)

Activer les logs détaillés :- `GET /api/admin/:vaId/events` - Get events

- `POST /api/admin/:vaId/events` - Create event (admin)

```env- `PUT /api/admin/:vaId/events/:eventId` - Update event (admin)

NODE_ENV=development- `DELETE /api/admin/:vaId/events/:eventId` - Delete event (admin)

```- `GET /api/admin/:vaId/statistics` - Get statistics (admin)



Vérifier les logs PM2 :### Downloads

- `GET /api/downloads/:vaId` - Get downloads

```bash- `POST /api/downloads/:vaId/upload` - Upload file (admin)

pm2 logs flynova-api- `DELETE /api/downloads/:vaId/:downloadId` - Delete download (admin)

```- `POST /api/downloads/:vaId/:downloadId/track` - Track download



## 📄 Licence### Data

- `GET /api/data/aircraft` - Get all aircraft

MIT- `GET /api/data/aircraft/search?q=` - Search aircraft

- `GET /api/data/airports` - Get all airports

## 🤝 Support- `GET /api/data/airports/search?q=` - Search airports



Pour toute question ou problème, créer une issue sur le repository.### Profile

- `GET /api/profile/:userId` - Get user profile

---- `PUT /api/profile/me` - Update profile (protected)



Développé avec ❤️ pour la communauté des simulateurs de vol## 🗄️ Database Schema


### Core Tables
- **users** - User accounts
- **virtual_airlines** - Virtual airlines
- **va_members** - VA membership with roles and stats
- **aircraft** - Aircraft types from OpenFlights
- **airports** - Airports from OpenFlights
- **va_fleet** - VA aircraft fleet
- **va_routes** - VA routes
- **flights** - Flight bookings
- **flight_reports** - Flight telemetry and validation
- **events** - VA events and challenges
- **downloads** - File downloads
- **achievements** - Achievement definitions
- **user_achievements** - User-earned achievements

See `database/schema.sql` for complete schema with relationships.

## 🌐 Hostinger Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deployment Checklist

1. ✅ Upload files via FTP/File Manager
2. ✅ Create MySQL database in hPanel
3. ✅ Update `.env` with production values
4. ✅ Run migrations: `node server/migrations/run.js`
5. ✅ Import data: `node server/scripts/import-openflights.js`
6. ✅ Build frontend: `npm run build`
7. ✅ Configure `.htaccess` for routing
8. ✅ Start Node.js application in hPanel
9. ✅ Test all endpoints

## 🔒 Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CORS**: Configured for specific origins
- **File Upload Validation**: Type and size limits
- **Role-Based Access Control**: Granular permissions

## 🎨 Design Philosophy

- **Aviation-Themed**: Blue color palette, clean design
- **Minimalist UI**: No information overload
- **Responsive**: Optimized for all devices
- **Modern**: Inspired by airline booking systems
- **Professional**: Production-ready code quality

## 📱 Tracker Integration

The platform is designed to integrate with a flight tracker (desktop application):

### Flight Tracker Workflow
1. Pilot reserves a flight in FlyNova
2. Launches tracker application
3. Tracker monitors flight simulator
4. On landing, tracker sends data to API
5. Admin validates the flight
6. Pilot earns points

### Tracker API Endpoints
- `POST /api/flights/:flightId/start` - Mark flight as in progress
- `POST /api/flights/:flightId/report` - Submit telemetry data

### Flight Report Data Structure
```json
{
  "actualDepartureTime": "2025-10-22T14:30:00Z",
  "actualArrivalTime": "2025-10-22T16:45:00Z",
  "flightDuration": 135,
  "distanceFlown": 450.5,
  "fuelUsed": 1250.3,
  "landingRate": -120,
  "telemetryData": {
    "maxAltitude": 35000,
    "maxSpeed": 450,
    "route": [...],
    "events": [...]
  }
}
```

## 🛠️ Development

### Adding New Features

1. **Database**: Update `database/schema.sql`
2. **API**: Add routes in `server/routes/`
3. **Frontend**: Create pages in `src/app/`
4. **Types**: Update TypeScript interfaces

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js recommended config
- **Formatting**: Consistent indentation
- **Naming**: camelCase for JS, PascalCase for components

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check MySQL service
mysql -u root -p

# Verify credentials in .env
# Ensure DB_HOST is correct (localhost vs 127.0.0.1)
```

### Port Already in Use
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill process (Windows)
taskkill /PID <PID> /F

# Or change PORT in .env
```

### Migration Errors
```bash
# Drop and recreate database
mysql -u root -p -e "DROP DATABASE IF EXISTS flynova; CREATE DATABASE flynova;"

# Re-run migrations
npm run migrate
```

## 📄 License

This project is open-source and available for personal and commercial use.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📧 Support

For issues and questions:
- Open a GitHub issue
- Check existing documentation
- Review API endpoints

## 🙏 Acknowledgments

- **OpenFlights** - Aircraft and airport data
- **Next.js Team** - Amazing framework
- **Flight Simulation Community** - Inspiration

---

**Built with ❤️ for the virtual aviation community**

🌐 **Website**: [Your Domain]  
📖 **Documentation**: [Docs Link]  
💬 **Community**: [Discord/Forum Link]
