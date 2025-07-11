# Kampala Cars - Car Marketplace

A modern, full-stack car marketplace application built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🚗 **Car Listings**: Browse and search cars by make, model, or description
- 🔐 **Authentication**: Secure user registration and login with Supabase Auth
- 📱 **Responsive Design**: Mobile-first design with Tailwind CSS
- 🖼️ **Image Upload**: Upload car images with Supabase Storage
- 👤 **User Dashboard**: Manage your car listings and profile
- 🔍 **Search & Filter**: Advanced search functionality
- 💰 **Pricing**: Display prices in formatted currency
- 📞 **Contact Sellers**: Built-in contact forms for buyer-seller communication

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Icons**: Lucide React
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone the Repository

```bash
git clone <repository-url>
cd kampalacars
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Go to Settings > Database and run the SQL schema from `lib/database.sql`

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Database Setup

Run the SQL commands from `lib/database.sql` in your Supabase SQL editor to set up:
- Tables (cars, profiles)
- Row Level Security (RLS) policies
- Storage buckets
- Triggers and functions

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
├── app/                   # Next.js app directory
│   ├── api/              # API routes
│   │   ├── cars/         # Car CRUD operations
│   │   ├── upload/       # File upload
│   │   ├── profile/      # User profile management
│   │   └── auth/         # Authentication callbacks
│   ├── auth/             # Authentication pages
│   ├── cars/             # Car detail pages
│   ├── dashboard/        # User dashboard
│   ├── upload/           # Car upload page
│   └── page.tsx          # Home page
├── components/           # Reusable components
│   ├── ui/              # UI components (Button, etc.)
│   ├── Header.tsx       # Navigation header
│   ├── Footer.tsx       # Site footer
│   ├── Layout.tsx       # Main layout wrapper
│   └── CarCard.tsx      # Car listing card
├── lib/                  # Utilities and configurations
│   ├── supabase/        # Supabase client configurations
│   ├── auth-context.tsx # Authentication context
│   ├── types.ts         # TypeScript type definitions
│   ├── utils.ts         # Utility functions
│   └── database.sql     # Database schema
├── public/              # Static assets
└── oldCode/             # Previous implementation (for reference)
```

## API Routes

### Cars
- `GET /api/cars` - List all cars with pagination and search
- `POST /api/cars` - Create a new car listing
- `GET /api/cars/[id]` - Get specific car details
- `PUT /api/cars/[id]` - Update car (owner only)
- `DELETE /api/cars/[id]` - Delete car (owner only)

### Upload
- `POST /api/upload` - Upload car images to Supabase Storage

### Profile
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update user profile

### Authentication
- `GET /api/auth/callback` - Handle Supabase auth callbacks

## Database Schema

### Cars Table
```sql
- id (UUID, Primary Key)
- make (TEXT)
- model (TEXT)
- year (INTEGER)
- price (DECIMAL)
- description (TEXT)
- image_url (TEXT)
- seller_id (UUID, Foreign Key)
- seller_email (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Profiles Table
```sql
- id (UUID, Primary Key, references auth.users)
- email (TEXT)
- full_name (TEXT)
- phone (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Security

- Row Level Security (RLS) enabled on all tables
- Users can only edit/delete their own car listings
- Image uploads restricted to authenticated users
- File type and size validation for uploads

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the GitHub issues
- Refer to the [Next.js documentation](https://nextjs.org/docs)
- Check [Supabase documentation](https://supabase.com/docs)
