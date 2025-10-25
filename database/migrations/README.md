# Database Migrations

This folder contains SQL migration scripts for FlyNova database updates.

## Running Migrations

You can run migrations manually using MySQL command line or phpMyAdmin.

### Using MySQL Command Line

```bash
mysql -u root -p flynova < database/migrations/001_update_downloads_table.sql
```

### Using phpMyAdmin

1. Open phpMyAdmin
2. Select the `flynova` database
3. Go to the SQL tab
4. Copy and paste the migration file content
5. Execute

## Migration Files

- `001_update_downloads_table.sql` - Updates downloads table to support external URLs for liveries and other files

## Important Notes

- Always backup your database before running migrations
- Migrations should be run in order (001, 002, 003, etc.)
- Check for errors after running each migration
