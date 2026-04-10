# TowerTech Society Management System (PHP Version)

This is a simple, college-level conversion of the TowerTech Society Management System from TypeScript/React to PHP.

## Features
- **Login**: Admin and Resident login.
- **Dashboard**: Overview of society stats.
- **Resident Management**: Admin can add/view/delete residents.
- **Complaint Management**: Residents can file complaints; Admins can process them.
- **Amenities Booking**: Residents can book amenities; Admins can approve/reject.
- **Maintenance Management**: Admin can generate bills and track payments.

## Tech Stack
- **Frontend**: HTML5, Tailwind CSS (via CDN).
- **Backend**: PHP 7.4+.
- **Database**: Supabase (PostgreSQL) via REST API.

## Setup Instructions
1. **PHP Server**: Place the `php` folder in your local server directory (e.g., `htdocs` for XAMPP).
2. **Configuration**: Open `php/config.php` and ensure the `$supabaseUrl` and `$supabaseKey` match your Supabase project credentials.
3. **Database**: Ensure your Supabase database has the tables defined in `supabase_setup.sql`.
4. **Run**: Open `http://localhost/php/index.php` in your browser.

## Folder Structure
- `config.php`: Database connection and helper functions.
- `index.php`: Login page.
- `register.php`: Society registration.
- `dashboard.php`: Main dashboard.
- `residents.php`: Resident management (Admin).
- `complaints.php`: Complaint management.
- `amenities.php`: Amenities booking.
- `maintenance.php`: Maintenance management.
- `sidebar.php` & `header.php`: Reusable UI components.
- `logout.php`: Session termination.

## Note
This version uses the Supabase REST API via cURL to interact with the database, making it a perfect example of a modern PHP application for a college project.
