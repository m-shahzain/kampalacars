# Kampala Cars - Simple Setup Guide (Plain Text Passwords)

## 🎉 Your car marketplace now uses plain text passwords for easy development!

### ✅ What Changed:

1. **🔐 Custom Authentication**: No more Supabase Auth complexity
2. **🗄️ Simple Database**: Plain text passwords in `users` table
3. **🍪 Cookie Sessions**: Simple session management
4. **⚡ Easy Testing**: All users have password `password123`

## 🚀 Setup Steps:

### 1. Create Your Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to Settings > API and copy your project URL and anon key

### 2. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

**Step 1:** Run `lib/database-simple.sql` in your Supabase SQL editor
**Step 2:** Run `sample-data-simple.sql` to add sample data

### 4. Test Your App

```bash
npm run dev
```

## 🧪 Test Credentials:

All sample users have the same password for easy testing:

```
📧 Email: john.mukasa@gmail.com
🔑 Password: password123

📧 Email: sarah.namukwaya@yahoo.com  
🔑 Password: password123

📧 Email: david.ssebunya@gmail.com
🔑 Password: password123

... (and 3 more users, all with password123)
```

## 🔧 How It Works:

### Authentication Flow:
1. **Login**: `/api/auth/login` - Compares plain text passwords
2. **Register**: `/api/auth/register` - Stores plain text passwords
3. **Session**: Creates HTTP-only cookie with user data
4. **Logout**: `/api/auth/logout` - Clears session cookie

### Database Tables:
- **`profiles`**: User profile information
- **`cars`**: Car listings
- **`users`**: Authentication (email + plain text password)

### API Routes:
- ✅ `/api/auth/login` - Custom login
- ✅ `/api/auth/register` - Custom registration  
- ✅ `/api/auth/logout` - Logout
- ✅ `/api/auth/session` - Get current user
- ✅ `/api/cars` - Car CRUD operations
- ✅ `/api/upload` - Image uploads
- ✅ `/api/profile` - Profile management

## 📱 Features Working:

- ✅ **User Registration** with plain text passwords
- ✅ **User Login** with email/password
- ✅ **Car Listings** (create, read, update, delete)
- ✅ **Image Upload** to Supabase Storage
- ✅ **Search & Filtering** cars
- ✅ **User Dashboard** to manage listings
- ✅ **Profile Management**
- ✅ **Responsive Design**

## 🎯 Quick Test:

1. **Register**: Create new account at `/auth/register`
2. **Login**: Use test credentials at `/auth/login`
3. **Upload Car**: Go to `/upload` and list a car
4. **Browse**: See all cars on home page `/`
5. **Dashboard**: Manage your listings at `/dashboard`

## ⚠️ Development Notes:

- **Plain text passwords** are stored in the database
- **Session cookies** handle authentication
- **No password hashing** for simplicity
- **Perfect for development/testing**
- **Add password hashing** before production

## 🚀 Ready to Go!

Your marketplace is now fully functional with:
- Simple authentication system
- 15 sample cars ready to browse
- All CRUD operations working
- Beautiful responsive UI

**Happy testing! 🚗✨** 