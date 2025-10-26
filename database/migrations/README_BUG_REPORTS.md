# Bug Reporting System - Migration Guide

## Overview
This migration adds a complete bug reporting system to FlyNova, allowing users to report bugs with screenshots and super admins to manage them.

## Database Migration

### Apply the Migration

**Option 1: Using MySQL CLI**
```bash
mysql -u your_username -p your_database < database/migrations/004_add_bug_reports.sql
```

**Option 2: Using phpMyAdmin**
1. Open phpMyAdmin
2. Select your database (`u815934570_flynovavas`)
3. Go to SQL tab
4. Copy and paste the content of `database/migrations/004_add_bug_reports.sql`
5. Click "Go"

**Option 3: Using Migration Runner**
```bash
cd server/migrations
node run.js
```

### What Gets Created

The migration creates a new table `bug_reports` with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| id | int(11) | Primary key, auto-increment |
| user_id | int(11) | Foreign key to users (nullable for anonymous reports) |
| username | varchar(100) | Username or name of reporter |
| title | varchar(255) | Bug title |
| description | text | Detailed bug description |
| image_url | varchar(500) | Screenshot/image URL (optional) |
| status | enum | pending, in_progress, resolved, closed |
| admin_notes | text | Admin notes (nullable) |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

## Features

### User Features
- **Report Bug Button**: Available in NavBar for all logged-in users
- **Bug Report Form**: Modal with fields for:
  - Username (auto-filled if logged in)
  - Bug Title
  - Description
  - Screenshot upload (optional, max 5MB)
- **Anonymous Reporting**: Users can report bugs even without being logged in

### Super Admin Features
- **Bug Reports Tab**: New tab in Super Admin dashboard
- **View All Reports**: See all submitted bug reports with full details
- **Status Management**: Change status between:
  - Pending (yellow)
  - In Progress (blue)
  - Resolved (green)
  - Closed (gray)
- **Admin Notes**: Add internal notes to bug reports
- **Delete Reports**: Remove spam or invalid reports
- **Filter by Status**: View bugs by their current status
- **Screenshot Preview**: Click to view full-size screenshots

## API Endpoints

### Submit Bug Report
```http
POST /api/bug-reports
Content-Type: multipart/form-data
Authorization: Bearer {token} (optional)

Fields:
- username: string (required)
- title: string (required, max 255 chars)
- description: string (required)
- image: file (optional, max 5MB, image formats only)
```

### Get All Bug Reports (Super Admin)
```http
GET /api/bug-reports?status=pending
Authorization: Bearer {token}
```

### Get Single Bug Report (Super Admin)
```http
GET /api/bug-reports/:id
Authorization: Bearer {token}
```

### Update Bug Report (Super Admin)
```http
PATCH /api/bug-reports/:id
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "status": "in_progress",
  "admin_notes": "Looking into this issue..."
}
```

### Delete Bug Report (Super Admin)
```http
DELETE /api/bug-reports/:id
Authorization: Bearer {token}
```

## File Structure

### Backend Files Added/Modified
```
flynova-backend/
├── database/migrations/
│   └── 004_add_bug_reports.sql          # Migration SQL
├── server/
│   ├── config/
│   │   └── hostinger-upload.js          # Added uploadBugImage
│   ├── middleware/
│   │   └── upload.js                    # Added uploadBugImageMiddleware
│   ├── routes/
│   │   └── bugReports.js                # New routes file
│   └── index.js                         # Registered bug-reports routes
```

### Frontend Files Added/Modified
```
flynova-frontend/
├── src/
│   ├── components/
│   │   ├── NavBar.tsx                   # Added Report Bug button
│   │   └── ReportBugModal.tsx           # New modal component
│   └── app/
│       └── superadmin/
│           └── page.tsx                 # Added Bugs tab
```

## Testing

### Test Bug Reporting
1. Login to the application
2. Click "🐛 Report Bug" button in the navbar
3. Fill in the form:
   - Title: "Test bug report"
   - Description: "This is a test"
   - Upload a screenshot (optional)
4. Submit the form
5. Verify success message appears

### Test Super Admin Dashboard
1. Login as a super admin user
2. Navigate to Super Admin dashboard
3. Click "🐛 Bug Reports" tab
4. Verify the test bug appears
5. Test status changes:
   - Mark as "In Progress"
   - Add admin notes
   - Mark as "Resolved"
   - Mark as "Closed"
6. Test deletion

## Image Upload

Bug report screenshots are uploaded to Hostinger FTP in the `/uploads/bugs/` directory.

Configuration required in `.env`:
```env
FTP_HOST=your-ftp-host
FTP_USER=your-ftp-username
FTP_PASSWORD=your-ftp-password
FTP_REMOTE_ROOT=/public_html/uploads/
UPLOADS_BASE_URL=https://yourdomain.com/uploads
```

## Security

- Bug submission endpoint is public (allows anonymous reporting)
- All management endpoints require super admin authentication
- Image uploads are validated:
  - File type: only images (jpg, jpeg, png, gif, webp)
  - File size: maximum 5MB
- SQL injection protection via parameterized queries
- XSS protection via React's built-in escaping

## Future Enhancements

Potential improvements for future versions:
- Email notifications to admins on new bug reports
- Bug report categories/tags
- Priority levels (low, medium, high, critical)
- Duplicate bug detection
- User notifications when their bug is resolved
- Attach multiple screenshots
- Reply/comment system for bug discussions
- Export bug reports to CSV/PDF

## Rollback

To rollback this migration:
```sql
DROP TABLE IF EXISTS bug_reports;
```

**Warning**: This will permanently delete all bug reports!

## Support

For issues or questions:
- Check the main README.md
- Review the code in `server/routes/bugReports.js`
- Test the endpoints using Postman or similar tools
