# WinkStay - PG Management System

## Overview

WinkStay is a comprehensive PG (Paying Guest) hostel management application designed for hostel owners and tenants. The system provides tools for managing rooms, tenants, payments, complaints, maintenance schedules, and reporting. It features a dual-interface design with separate dashboards for owners and tenants, enabling efficient hostel operations and transparent communication.

The application is built as a full-stack web application with a React-based frontend and Express.js backend, using PostgreSQL for data persistence through Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Technology Stack

**Frontend:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management
- Radix UI components for accessible UI primitives
- Tailwind CSS for utility-first styling with custom theming
- Framer Motion for animations
- Shadcn UI component library (New York style variant)

**Backend:**
- Express.js server with TypeScript
- Session-based authentication using express-session
- RESTful API architecture
- Bcrypt for password hashing

**Database:**
- PostgreSQL as the primary database
- Drizzle ORM for type-safe database queries
- Neon serverless PostgreSQL adapter (@neondatabase/serverless)
- Schema-first design with migrations stored in `/migrations`

### Application Structure

**Monorepo Layout:**
- `/client` - Frontend React application
  - `/src/pages` - Route-based page components
  - `/src/components` - Reusable UI components including layouts
  - `/src/hooks` - Custom React hooks (use-user, use-pg, use-mobile, use-toast)
  - `/src/lib` - Utility functions and query client setup
- `/server` - Backend Express application
  - `routes.ts` - API route definitions
  - `storage.ts` - Database access layer with IStorage interface
  - `db.ts` - Database connection setup
  - `index.ts` - Server entry point
  - `static.ts` - Static file serving
  - `vite.ts` - Vite middleware for development
- `/shared` - Code shared between frontend and backend
  - `schema.ts` - Drizzle schema definitions and Zod validation schemas
- `/script` - Build scripts
- `/attached_assets` - Static assets and generated images

### Authentication & Authorization

**Session Management:**
- Cookie-based sessions with express-session middleware
- Session data includes userId and temporary registration data
- Secure cookies with httpOnly and sameSite protection
- 24-hour session expiration

**User Types:**
- Owner: Full access to PG management features
- Tenant: Limited access to personal information and payments
- Admin: (Defined but not fully implemented)

**Password Reset Flow:**
- First-time tenant login requires password reset
- OTP verification for password recovery
- Email-based password reset requests

### Database Schema

**Core Entities:**

1. **Users Table** - Stores owner, tenant, and admin accounts
   - Authentication credentials (email, password hash, googleId for OAuth)
   - User type differentiation
   - Email/mobile verification status
   - Subscription tier tracking
   - Password reset flags for new accounts

2. **OTP Codes Table** - Temporary verification codes
   - Email and mobile verification
   - Expiration timestamps

3. **PG Master Table** - Multiple PG properties per owner
   - PG name, address, location coordinates
   - Total rooms capacity
   - Owner foreign key

4. **Rooms Table** - Individual room management
   - Room number, floor, sharing capacity
   - Monthly rent
   - Amenities (WiFi, Water, Power)
   - AC and attached bathroom flags
   - Occupancy status (vacant, partially_occupied, fully_occupied)
   - Multiple tenant assignment via tenantIds array

5. **Tenants Table** - Tenant information
   - Personal details (name, email, phone)
   - Room assignment
   - Document storage (compressed tenant images, Aadhar cards using gzip)
   - Owner and PG associations

6. **Emergency Contacts Table** - Tenant emergency contacts
   - Multiple contacts per tenant
   - Relationship tracking

7. **Payments Table** - Financial transactions
   - Amount, payment method, status
   - Transaction dates and due dates
   - Tenant and PG associations

8. **Notifications Table** - System notifications
   - User-specific or broadcast messages
   - Read/unread status

### Multi-PG Support

The system supports owners managing multiple PG properties:
- PG context switching via PGSwitcher component
- Current PG stored in session and accessed via usePG hook
- All queries filtered by current PG context
- PG management interface for CRUD operations

### Data Compression

Large binary data (tenant images, documents) is compressed using pako (gzip) before storage:
- Reduces database storage requirements
- Base64 encoding for database compatibility
- Automatic decompression on retrieval

### Responsive Design

**Mobile-First Approach:**
- Separate mobile and desktop layouts
- MobileLayout component for smaller screens
- DesktopLayout with sidebar for larger screens
- useIsMobile hook for responsive behavior detection
- Breakpoint: 768px (lg: prefix in Tailwind)

**Progressive Enhancement:**
- Mobile PWA manifest for installability
- Optimized for touch interfaces
- Drawer-based mobile navigation

### State Management

**Client State:**
- React Query for server state caching and synchronization
- Custom hooks for user session (useUser) and PG context (usePG)
- Optimistic updates for better UX

**Server State:**
- No caching strategy defined - queries marked with staleTime: Infinity
- Session-based user context
- Query invalidation on mutations

### Build & Deployment

**Development:**
- Vite dev server on port 5000
- Hot module replacement (HMR)
- Runtime error overlay via Replit plugin
- Source maps for debugging

**Production:**
- Vite builds client to `/dist/public`
- ESBuild bundles server to `/dist/index.cjs`
- Selected dependencies bundled to reduce syscalls
- Static file serving from Express

**Environment Variables:**
- DATABASE_URL - PostgreSQL connection string (required)
- NODE_ENV - Development/production mode

### API Design

RESTful endpoints following resource-based routing:
- `/api/auth/*` - Authentication (login, register, logout, password reset)
- `/api/users/*` - User profile management
- `/api/tenants/*` - Tenant CRUD operations
- `/api/rooms/*` - Room management
- `/api/payments/*` - Payment tracking
- `/api/pg/*` - PG property management
- `/api/tenant/*` - Tenant-specific endpoints (dashboard, payments, room details)

All API requests include credentials for session management.

### Error Handling

- Form validation using Zod schemas
- User-friendly error messages
- Toast notifications for feedback (Sonner library)
- Error boundaries for component crashes

## External Dependencies

**Database:**
- Neon Serverless PostgreSQL - Hosted PostgreSQL database
- WebSocket connection for real-time queries

**UI Component Libraries:**
- Radix UI - Accessible headless components (@radix-ui/react-*)
- Lucide React - Icon library
- Shadcn UI - Pre-built component patterns

**Forms & Validation:**
- React Hook Form - Form state management
- Zod - Schema validation
- @hookform/resolvers - Zod integration

**File Handling:**
- pako - Gzip compression/decompression
- Base64 encoding for binary data storage

**Maps & Location:**
- OpenStreetMap Nominatim API - Location search and geocoding (client-side)

**Development Tools:**
- Replit Vite Plugins - Cartographer, dev banner, runtime error modal, meta images

**Utilities:**
- date-fns - Date manipulation
- nanoid - Unique ID generation
- clsx & tailwind-merge - Conditional CSS classes

**Build Tools:**
- TypeScript - Type safety
- ESBuild - Fast JavaScript bundler
- PostCSS with Autoprefixer - CSS processing