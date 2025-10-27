# 🏆 Pilot Tours Feature - Backend Documentation

## Database Migration

### Migration File: `006_add_pilot_tours.sql`
**Status**: ✅ Created, committed, pushed | ⚠️ NOT YET EXECUTED

### To Execute Migration:
```bash
# SSH into your server
ssh your-server

# Navigate to backend
cd /path/to/flynova-backend

# Run migration
mysql -u u815934570_flynovavas -p u815934570_flynova_dev < database/migrations/006_add_pilot_tours.sql

# Or use the migration runner (if available)
node server/migrations/run.js 006
```

## Tables Created

### 1. va_tours
Main tour information table.

```sql
CREATE TABLE va_tours (
  id INT PRIMARY KEY AUTO_INCREMENT,
  va_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  banner_image VARCHAR(512),
  award_badge VARCHAR(10),
  award_title VARCHAR(255),
  award_description TEXT,
  status ENUM('draft', 'active', 'completed') DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
- `idx_va_tours_va` on `va_id`
- `idx_va_tours_status` on `status`

### 2. va_tour_legs
Flight segments for each tour.

```sql
CREATE TABLE va_tour_legs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tour_id INT NOT NULL,
  leg_number INT NOT NULL,
  departure_icao VARCHAR(4) NOT NULL,
  departure_name VARCHAR(255),
  arrival_icao VARCHAR(4) NOT NULL,
  arrival_name VARCHAR(255),
  required_aircraft VARCHAR(255),
  min_flight_time INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
- `idx_tour_legs_tour` on `tour_id`
- UNIQUE constraint on `(tour_id, leg_number)`

### 3. va_tour_progress
Tracks pilot enrollment and progress.

```sql
CREATE TABLE va_tour_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tour_id INT NOT NULL,
  user_id INT NOT NULL,
  current_leg INT DEFAULT 1,
  completed_legs JSON,
  status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  award_granted BOOLEAN DEFAULT FALSE
);
```

**Indexes**:
- `idx_tour_progress_tour` on `tour_id`
- `idx_tour_progress_user` on `user_id`
- UNIQUE constraint on `(tour_id, user_id)`

### 4. va_tour_awards
Record of awarded tour badges.

```sql
CREATE TABLE va_tour_awards (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  tour_id INT NOT NULL,
  award_badge VARCHAR(10),
  award_title VARCHAR(255) NOT NULL,
  award_description TEXT,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
- `idx_tour_awards_user` on `user_id`
- `idx_tour_awards_tour` on `tour_id`

## API Routes

### File: `server/routes/tours.js`
**Status**: ✅ Implemented, committed, pushed

### Endpoints

#### Admin Endpoints (VA Owner/Admin)

##### Get All Tours
```
GET /api/tours/:vaId
Authorization: Bearer <token>
Response: { tours: Tour[] }
```

##### Get Tour Details
```
GET /api/tours/:vaId/:tourId
Authorization: Bearer <token>
Response: { tour: Tour }
```

##### Create Tour
```
POST /api/tours/:vaId
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- title (string, required)
- description (string, required)
- award_title (string, required)
- award_description (string, required)
- award_badge (string, optional)
- status (enum: draft/active/completed, required)
- start_date (date, optional)
- end_date (date, optional)
- banner_image (file, optional)
- banner_image_url (string, optional)

Response: { tour: Tour }
```

##### Update Tour
```
PUT /api/tours/:vaId/:tourId
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body: Same as Create Tour

Response: { tour: Tour }
```

##### Delete Tour
```
DELETE /api/tours/:vaId/:tourId
Authorization: Bearer <token>
Response: { message: "Tour deleted successfully" }
```

#### Leg Management Endpoints

##### Get Tour Legs
```
GET /api/tours/:vaId/:tourId/legs
Authorization: Bearer <token>
Response: { legs: TourLeg[] }
```

##### Add Leg
```
POST /api/tours/:vaId/:tourId/legs
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "leg_number": 1,
  "departure_icao": "KJFK",
  "departure_name": "New York JFK",
  "arrival_icao": "EGLL",
  "arrival_name": "London Heathrow",
  "required_aircraft": "Boeing 747",
  "min_flight_time": 420,
  "notes": "Transatlantic crossing"
}

Response: { leg: TourLeg }
```

##### Delete Leg
```
DELETE /api/tours/:vaId/:tourId/legs/:legId
Authorization: Bearer <token>
Response: { message: "Leg deleted successfully" }
```

#### Pilot Endpoints (Public/Authenticated)

##### Join Tour
```
POST /api/tours/:vaId/:tourId/join
Authorization: Bearer <token>
Response: { progress: TourProgress }
```

##### Get My Progress
```
GET /api/tours/my-progress/:vaId
Authorization: Bearer <token>
Response: { progress: TourProgress[] }
```

##### Get My Awards
```
GET /api/tours/my-awards
Authorization: Bearer <token>
Response: { awards: TourAward[] }
```

## File Upload Configuration

### Banner Images
- **Upload Path**: `/public_html/uploads/tours/banners/`
- **Allowed Types**: image/jpeg, image/png, image/webp, image/gif
- **Max Size**: 5MB
- **Middleware**: Uses Hostinger FTP upload
- **URL Format**: `https://api.flynova.com/uploads/tours/banners/banner-{timestamp}.jpg`

### Configuration in `server/config/hostinger-upload.js`:
```javascript
const uploadTourBannerMiddleware = createHostingerUploadMiddleware({
  destinationDir: 'tours/banners',
  filePrefix: 'banner',
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxSize: 5 * 1024 * 1024
});
```

## Authorization Rules

### Admin Actions (Create/Edit/Delete Tours and Legs)
- Must be authenticated
- Must be Owner or Admin of the VA
- Checked via `checkVARole` middleware

### Pilot Actions (Join/View Tours)
- Must be authenticated
- Must be member of the VA (any role)
- Checked via `checkVAMembership` middleware

## Integration Points

### 1. Flight Validation Hook
**Location**: `server/routes/acars.js` (in flight submission handler)

```javascript
// After flight validation and PIREP creation
const checkTourProgress = async (userId, vaId, flight) => {
  // 1. Get user's active tour progress
  const [progress] = await db.query(
    `SELECT tp.*, tl.* FROM va_tour_progress tp
     JOIN va_tour_legs tl ON tl.tour_id = tp.tour_id AND tl.leg_number = tp.current_leg
     WHERE tp.user_id = ? AND tp.status = 'active'`,
    [userId]
  );

  if (!progress.length) return;

  for (const p of progress) {
    // 2. Check if flight matches current leg
    if (
      flight.departure === p.departure_icao &&
      flight.arrival === p.arrival_icao
    ) {
      // 3. Validate requirements
      if (p.required_aircraft && flight.aircraft !== p.required_aircraft) continue;
      if (p.min_flight_time && flight.duration < p.min_flight_time) continue;

      // 4. Update progress
      const completedLegs = JSON.parse(p.completed_legs || '[]');
      completedLegs.push(p.current_leg);

      // 5. Check if tour completed
      const [totalLegs] = await db.query(
        'SELECT COUNT(*) as total FROM va_tour_legs WHERE tour_id = ?',
        [p.tour_id]
      );

      if (completedLegs.length >= totalLegs[0].total) {
        // Tour completed!
        await completeTour(p.id, p.tour_id, userId);
      } else {
        // Move to next leg
        await db.query(
          `UPDATE va_tour_progress 
           SET current_leg = ?, completed_legs = ?
           WHERE id = ?`,
          [p.current_leg + 1, JSON.stringify(completedLegs), p.id]
        );
      }
    }
  }
};

const completeTour = async (progressId, tourId, userId) => {
  // 1. Mark progress as completed
  await db.query(
    `UPDATE va_tour_progress 
     SET status = 'completed', completed_at = NOW(), award_granted = TRUE
     WHERE id = ?`,
    [progressId]
  );

  // 2. Get tour award details
  const [tour] = await db.query(
    'SELECT award_badge, award_title, award_description FROM va_tours WHERE id = ?',
    [tourId]
  );

  // 3. Grant award
  await db.query(
    `INSERT INTO va_tour_awards (user_id, tour_id, award_badge, award_title, award_description)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, tourId, tour[0].award_badge, tour[0].award_title, tour[0].award_description]
  );

  // 4. Update tour completion count
  await db.query(
    'UPDATE va_tours SET completions_count = completions_count + 1 WHERE id = ?',
    [tourId]
  );

  // 5. Send notification (if notification system exists)
  // notifyUser(userId, 'Tour Completed!', `You earned: ${tour[0].award_title}`);
};
```

### 2. User Profile Integration
**Location**: User profile API/component

```javascript
// Fetch user's earned tour awards
const [awards] = await db.query(
  `SELECT ta.*, vt.title as tour_title, va.name as va_name
   FROM va_tour_awards ta
   JOIN va_tours vt ON vt.id = ta.tour_id
   JOIN virtual_airlines va ON va.id = vt.va_id
   WHERE ta.user_id = ?
   ORDER BY ta.granted_at DESC`,
  [userId]
);

// Display awards section in profile
{awards.map(award => (
  <div className="award-badge">
    <span className="emoji">{award.award_badge || '🏆'}</span>
    <div className="award-info">
      <h4>{award.award_title}</h4>
      <p>{award.award_description}</p>
      <small>{award.tour_title} - {award.va_name}</small>
    </div>
  </div>
))}
```

## Testing Checklist

### Database
- [ ] Migration executes successfully
- [ ] All tables created with correct schema
- [ ] Indexes created properly
- [ ] Foreign keys working correctly

### API Endpoints
- [ ] GET /tours/:vaId returns all tours
- [ ] POST /tours/:vaId creates tour with banner upload
- [ ] PUT /tours/:vaId/:tourId updates tour
- [ ] DELETE /tours/:vaId/:tourId deletes tour
- [ ] GET /tours/:vaId/:tourId/legs returns legs
- [ ] POST /tours/:vaId/:tourId/legs adds leg
- [ ] DELETE /tours/:vaId/:tourId/legs/:legId deletes leg

### Authorization
- [ ] Non-members cannot access tours
- [ ] Regular members cannot create/edit tours
- [ ] Admins can manage tours
- [ ] Owners can manage tours

### File Uploads
- [ ] Banner images upload to Hostinger FTP
- [ ] URLs are returned correctly
- [ ] Images are accessible via web

## Monitoring

### Key Metrics to Track
1. **Tours Created** - Count of active tours per VA
2. **Participation Rate** - Users enrolled / Total members
3. **Completion Rate** - Completed / Enrolled
4. **Average Legs** - Average legs per tour
5. **Popular Tours** - Most joined tours

### SQL Queries for Metrics

```sql
-- Active tours by VA
SELECT va_id, COUNT(*) as active_tours
FROM va_tours
WHERE status = 'active'
GROUP BY va_id;

-- Completion rate
SELECT 
  t.id,
  t.title,
  COUNT(DISTINCT tp.user_id) as participants,
  SUM(CASE WHEN tp.status = 'completed' THEN 1 ELSE 0 END) as completions,
  ROUND(SUM(CASE WHEN tp.status = 'completed' THEN 1 ELSE 0 END) / COUNT(DISTINCT tp.user_id) * 100, 2) as completion_rate
FROM va_tours t
LEFT JOIN va_tour_progress tp ON tp.tour_id = t.id
GROUP BY t.id;

-- Most popular tours
SELECT t.*, COUNT(tp.user_id) as participants
FROM va_tours t
LEFT JOIN va_tour_progress tp ON tp.tour_id = t.id
WHERE t.status = 'active'
GROUP BY t.id
ORDER BY participants DESC
LIMIT 10;
```

## Future Enhancements

### Phase 2 Features
1. **Leaderboards** - Rank pilots by tour completions
2. **Time Challenges** - Complete tour within X days
3. **Team Tours** - VA-wide collaborative tours
4. **Seasonal Tours** - Limited-time special events
5. **Tour Categories** - Cargo, passenger, regional, etc.
6. **Difficulty Ratings** - Easy, Medium, Hard tours
7. **Prerequisites** - Require X hours or rank to join
8. **Branching Paths** - Choose-your-own-adventure style tours

### Technical Improvements
1. **Caching** - Cache tour data for faster loading
2. **Real-time Updates** - WebSocket for live progress updates
3. **Analytics Dashboard** - VA-specific tour statistics
4. **Automated Tours** - Generate tours based on real-world routes
5. **Tour Templates** - Pre-made tour configurations

---

**Created**: December 2024
**Last Updated**: December 2024
**Migration Status**: ⚠️ NEEDS EXECUTION ON DATABASE
