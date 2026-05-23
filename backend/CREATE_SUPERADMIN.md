# Create Superadmin User - Documentation

This document explains how to create a superadmin user for the Digital Voting System.

## Overview

The superadmin user is a platform-level administrator with full access to the system. There are several ways to create a superadmin user:

1. **Interactive Mode** - Prompted for credentials
2. **Command-line Arguments** - Provide all details via CLI
3. **Database Migration** - Automatically seeded during initial setup

## Prerequisites

- Python 3.9+ installed
- Virtual environment activated (`venv` or `.venv`)
- Database configured and migrated
- `.env` file with `DATABASE_URL` set

## Method 1: Interactive Mode (Recommended for first-time setup)

This method prompts you for all required information interactively with validation.

### Linux/macOS:
```bash
cd backend
chmod +x create_superadmin.sh
./create_superadmin.sh
```

### Windows (PowerShell):
```powershell
cd backend
.\create_superadmin.bat
```

### Windows (Command Prompt):
```cmd
cd backend
create_superadmin.bat
```

### Direct Python:
```bash
python create_superadmin.py
```

**Example interactive session:**
```
============================================================
Create New Superadmin User
============================================================

Full Name: John Administrator
Email Address: john@example.com
Password (hidden): 
Confirm Password: 

============================================================
Superadmin Details
============================================================
Name:  John Administrator
Email: john@example.com
Role:  superadmin
Status: active
============================================================

Create superadmin with these details? (yes/no): yes

✓ Superadmin user created successfully!
  ID: 1
  Email: john@example.com
  Name: John Administrator
  Status: active
  Created: 2024-05-24 10:30:45.123456
```

## Method 2: Command-line Arguments

Provide all credentials directly via command-line arguments. Useful for automation and scripts.

### Linux/macOS:
```bash
./create_superadmin.sh \
  --name "John Administrator" \
  --email "john@example.com" \
  --password "SecurePass123" \
  --force
```

### Windows:
```cmd
create_superadmin.bat ^
  --name "John Administrator" ^
  --email "john@example.com" ^
  --password "SecurePass123" ^
  --force
```

### Direct Python:
```bash
python create_superadmin.py \
  --name "John Administrator" \
  --email "john@example.com" \
  --password "SecurePass123" \
  --force
```

### Arguments:
- `--name NAME` - Full name of the superadmin (optional in interactive mode)
- `--email EMAIL` - Email address (optional in interactive mode)
- `--password PASSWORD` - Password (if not provided, you'll be prompted securely)
- `--force` - Skip the confirmation prompt (use with caution)

## Method 3: Database Seeding (Automatic)

During the initial database migration, a default superadmin is automatically created:

**Default Credentials:**
- Email: `superadmin@techElect.com`
- Password: `Super@Admin123`

Run migrations:
```bash
cd backend
alembic upgrade head
```

> **⚠️ IMPORTANT:** Change the default superadmin password immediately after the first login!

## Password Requirements

Passwords must meet the following criteria:
- ✓ Minimum 8 characters
- ✓ At least one uppercase letter (A-Z)
- ✓ At least one digit (0-9)

**Invalid examples:**
- `password` - No uppercase or digit
- `Pass123` - Only 7 characters
- `PASSWORD123` - No lowercase

**Valid examples:**
- `Admin@123` ✓
- `SecureP@ss123` ✓
- `MyVoting2024!` ✓

## Email Validation

Emails must be:
- Unique (no duplicates in system)
- Valid format (contains @ and .)

## Superadmin Permissions

A superadmin user has:
- ✓ Access to all tenants
- ✓ User management across all tenants
- ✓ System configuration access
- ✓ Audit log viewing
- ✓ Cannot be assigned to a single tenant (tenant_id = NULL)

## Troubleshooting

### Error: "DATABASE_URL environment variable is not set"
**Solution:** Configure your `.env` file in the backend directory:
```env
DATABASE_URL=mysql+pymysql://user:password@localhost/voting_db
DEBUG=True
SECRET_KEY=your-secret-key-here
```

### Error: "User with email already exists"
**Solution:** The email is already registered in the system. Use a different email address.

### Error: "Password must be at least 8 characters"
**Solution:** Use a stronger password meeting the requirements above.

### Error: Connection refused / Database not found
**Solution:** Ensure your database is running and migrations are up to date:
```bash
alembic upgrade head
```

### Virtual environment not active
**Solution:** Activate your virtual environment first:

**Linux/macOS:**
```bash
source venv/bin/activate
# or
source .venv/bin/activate
```

**Windows:**
```cmd
venv\Scripts\activate
REM or
.venv\Scripts\activate
```

## Security Best Practices

1. **Change Default Password** - Change the default `Super@Admin123` immediately
2. **Use Strong Passwords** - Use passwords with special characters and numbers
3. **Limit Superadmin Accounts** - Create only as many as needed
4. **Audit Access** - Monitor superadmin activity via audit logs
5. **Secure Storage** - Store credentials securely, never in version control
6. **Environment Variables** - Use `.env` files (gitignored) for sensitive data

## Examples

### Create a superadmin with a single command (non-interactive):
```bash
python create_superadmin.py --name "Admin User" --email "admin@company.com" --password "P@ssw0rd2024" --force
```

### Create multiple superadmins interactively:
```bash
./create_superadmin.sh
# ... enter details for first user ...

# Run again for second superadmin
./create_superadmin.sh
# ... enter details for second user ...
```

### Update an existing user to superadmin (SQL):
```sql
UPDATE users SET role = 'superadmin', status = 'active', is_verified = True, tenant_id = NULL 
WHERE email = 'user@example.com';
```

## Database Schema

Superadmin users are stored in the `users` table with these properties:

| Field | Value |
|-------|-------|
| role | `superadmin` |
| status | `active` |
| tenant_id | `NULL` (not tied to any tenant) |
| is_verified | `True` |
| hashed_password | bcrypt hash of the password |

## Next Steps

After creating a superadmin user:

1. ✓ Log in with the superadmin credentials
2. ✓ Verify system access
3. ✓ Create additional admins for tenants as needed
4. ✓ Configure audit logging
5. ✓ Set up backup and disaster recovery

## Support

For issues or questions:
- Check the main [README.md](../../README.md)
- Review the [SRS.md](../../SRS.md) for system requirements
- Check server logs: `backend/logs/`
