# PostgreSQL Connection Details - Where to Find Them

## Step-by-Step Guide to Find Your PostgreSQL Details

### 1. **PGHOST** (Host)
- **Value:** `localhost`
- **Why:** This means PostgreSQL is running on your local computer

### 2. **PGPORT** (Port)
- **Value:** `5432`
- **Why:** This is the default PostgreSQL port
- **To verify in pgAdmin:**
  - Right-click on your server in pgAdmin
  - Select "Properties"
  - Check the "Port" field (should be 5432)

### 3. **PGDATABASE** (Database Name)
- **Value:** `todoapp`
- **Action Required:** You need to CREATE this database
- **How to create in pgAdmin:**
  1. In the left panel, expand "Servers" → your server name
  2. Right-click on "Databases"
  3. Select "Create" → "Database..."
  4. In the "Database" field, type: `todoapp`
  5. Click "Save"

### 4. **PGUSER** (Username)
- **Value:** `postgres`
- **Why:** This is the default superuser account created during PostgreSQL installation
- **To verify in pgAdmin:**
  - Look at the server name in the left panel
  - It's usually "PostgreSQL [version]" or shows the username

### 5. **PGPASSWORD** (Password) ⚠️ **MOST IMPORTANT**
- **This is the password YOU SET when installing PostgreSQL**
- **Where to find it:**
  - **Option 1:** Try to remember the password you entered during PostgreSQL installation
  - **Option 2:** In pgAdmin, when you click on your server, it might prompt for a password - that's the one!
  - **Option 3:** If you can't remember:
    1. Open pgAdmin
    2. Try to connect to your server
    3. If it asks for a password, enter what you think it might be
    4. If you can't remember, you may need to reset the PostgreSQL password

## Creating the .env File

Once you have all the details, create a file named `.env` in the `backend` folder with this content:

```
PGHOST=localhost
PGPORT=5432
PGDATABASE=todoapp
PGUSER=postgres
PGPASSWORD=YOUR_ACTUAL_PASSWORD_HERE
FLASK_SECRET_KEY=dev-secret-change-me
CORS_ORIGINS=http://localhost:5173
```

**Important:** Replace `YOUR_ACTUAL_PASSWORD_HERE` with the actual password you set during PostgreSQL installation!

## Quick Test

After creating the `.env` file, you can test the connection by:
1. Opening pgAdmin
2. Connecting to your PostgreSQL server
3. Verifying you can see the `todoapp` database in the list

