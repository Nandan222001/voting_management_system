# Login Troubleshooting Guide

## Issue: "Login Failed - Wrong Credentials"

If you're seeing this error when trying to log in, follow these steps to diagnose and fix the problem.

## Quick Diagnosis

Run this command to check what users are in your database:

```bash
cd backend
python debug_users.py
```

This will show you:
- All users in the database
- Their emails, roles, and status
- Whether they're verified and active

## Test Specific Login Credentials

If you know what credentials you're trying to use, test them directly:

```bash
python debug_users.py --test admin@example.com MyPassword123
```

This will verify:
- ✓ User exists with that email
- ✓ Password is correct
- ✓ Account is active (not pending or blocked)
- ✓ All other checks pass

## Common Issues & Solutions

### 1. "User not found with email"

**Problem:** The debug script shows no user exists with that email.

**Solutions:**
- Create a new superadmin user:
  ```bash
  python create_superadmin.py
  ```
- Or manually create a user through the database

### 2. "Password is incorrect"

**Problem:** User exists but password doesn't match.

**Solutions:**
- Recreate the superadmin with a known password:
  ```bash
  python create_superadmin.py --email admin@example.com --password MyNewPass123 --name "Admin" --force
  ```
- Or reset the password using the database directly (see below)

### 3. "Account is pending"

**Problem:** User exists and password is correct, but account status is "pending"

**Explanation:** New registered users start in pending status and need admin approval.

**Solutions:**
- If this is your first superadmin, it should auto-activate. Check status in database.
- For regular users, an admin needs to approve them.
- Use the debug script to check:
  ```bash
  python debug_users.py
  ```
- Look for the "Status" column - should be "active" for superadmin

### 4. "Account is blocked"

**Problem:** User exists and password is correct, but account is blocked.

**Solution:** An admin must unblock the account. Contact your system administrator or use SQL:
```sql
UPDATE users SET status = 'active' WHERE email = 'your@email.com';
```

### 5. Case Sensitivity Issue (FIXED)

**Previous Issue:** Email was not matching due to case differences.

**Status:** ✓ FIXED in the latest update
- Emails are now normalized to lowercase when:
  - Creating users (register and create_superadmin)
  - Looking up users (get_by_email)
  - Logging in

This means emails are now case-insensitive.

## Database Direct Inspection

If you need to check the database directly:

### Show all users:
```sql
SELECT id, email, full_name, role, status, is_verified FROM users;
```

### Show superadmin users only:
```sql
SELECT * FROM users WHERE role = 'superadmin';
```

### Activate a pending user:
```sql
UPDATE users SET status = 'active' WHERE email = 'user@example.com';
```

### Reset password (requires running create_superadmin script):
```bash
# Best practice: Delete and recreate the user
python create_superadmin.py --email admin@example.com --password NewPassword123 --name "Admin Name" --force
```

## Default Superadmin (from Migration)

If you ran migrations, a default superadmin was created:

- **Email:** `superadmin@techElect.com`
- **Password:** `Super@Admin123`
- **Status:** Active

⚠️ **SECURITY WARNING:** Change this password immediately after first login!

## Step-by-Step Login Fix

1. **Check what users exist:**
   ```bash
   python debug_users.py
   ```

2. **If no superadmin exists, create one:**
   ```bash
   python create_superadmin.py
   ```

3. **Test the credentials you created:**
   ```bash
   python debug_users.py --test your@email.com YourPassword123
   ```

4. **Look for ✓ PASS or ✗ FAIL indicators:**
   - All should be ✓ PASS for successful login

5. **If all checks pass but login still fails:**
   - Clear browser cache: `Ctrl+Shift+Delete`
   - Ensure backend is running: `python main.py`
   - Check browser console for API errors: `F12` → Console tab
   - Check backend logs for server errors

## Backend Server Check

Make sure your backend is running:

```bash
cd backend
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

And in the frontend, the API URL should be configured correctly (check `.env`).

## Frontend Configuration

Check that your frontend is configured to talk to the right backend:

In `frontend/.env` or `frontend/src/services/api.js`:
```
VITE_API_URL=http://localhost:8000
```

Or adjust to match your backend URL.

## Recent Changes (Email Normalization)

In the latest update, I fixed email handling:

1. ✓ User repository now normalizes emails to lowercase when querying
2. ✓ Auth service normalizes emails when registering new users
3. ✓ Create superadmin script normalizes emails

This means email lookups are now case-insensitive, so:
- `Admin@Example.com` and `admin@example.com` are treated as the same user

## Still Having Issues?

1. **Check debug output:**
   ```bash
   python debug_users.py --test your@email.com yourpassword
   ```
   Review the detailed error messages

2. **Check backend logs:**
   Look for error messages in the terminal where `python main.py` is running

3. **Check browser console:**
   Press `F12` and look at the Console and Network tabs for API errors

4. **Verify database connection:**
   Ensure `.env` has correct `DATABASE_URL`

5. **Restart services:**
   ```bash
   # Kill and restart backend
   # (Ctrl+C in backend terminal)
   python main.py
   
   # Refresh frontend in browser
   # (Ctrl+R)
   ```

## Support Resources

- Main README: [../../README.md](../../README.md)
- Create Superadmin Guide: [CREATE_SUPERADMIN.md](CREATE_SUPERADMIN.md)
- System Requirements: [../../SRS.md](../../SRS.md)
