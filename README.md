This is a full-stack Next.js app for user registration, location pins, and configurable admin destinations.

## Features

- User registration and login with hashed passwords
- Map interface for placing and viewing user location pins
- Click pins to see basic user details (email and name)
- Configurable destinations available on the map
- Admin dashboard to add new destinations
- Interactive admin map: click to add destinations, click destination markers to delete
- User profiles with editable name and ride-sharing preference (drive/lift/either)
- First registered user is automatically granted admin access

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Routes

- `/` redirects users to login or the map
- `/login` sign in
- `/register` create a new account with ride-sharing preference
- `/map` view the map and place a location pin
- `/profile` edit user profile (name and ride-sharing preference)
- `/admin` manage destinations (admin only) - includes interactive map

## Database

This app uses SQLite with Prisma.

If you edit the Prisma schema, run:

```bash
npx prisma generate
npx prisma db push
```

## Notes

- The first user who registers becomes the admin.
- After registering, sign in at `/login` to access the map.
- Admins can click anywhere on the map in the admin dashboard to add destinations.
- Admins can click on destination markers in the admin dashboard to delete them.
- Admin users can access `/admin` to add destination pins.
