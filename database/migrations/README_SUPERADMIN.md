# Migration: Add Super Admin Role

This migration adds the `is_super_admin` field to the users table.

## Instructions

Run this SQL migration on your database:

```sql
ALTER TABLE users 
ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE AFTER status;

CREATE INDEX idx_super_admin ON users(is_super_admin);
```

## Setting a Super Admin

After running the migration, use the provided script to set a user as super admin:

```bash
node set-super-admin.js <email>
```

Example:
```bash
node set-super-admin.js admin@flynova.com
```

## Features

The Super Admin has access to:

- Dashboard at `/superadmin` with full platform overview
- View and manage all Virtual Airlines
- View and manage all users
- Suspend or delete VAs
- Suspend or ban users
- View recent platform activities
- Platform statistics

## Security

- Only users with `is_super_admin = TRUE` can access the super admin dashboard
- Super admins cannot suspend or delete themselves
- Users who own VAs cannot be deleted (ownership must be transferred first)
