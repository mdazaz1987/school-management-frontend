# School Management System - Frontend

A modern, responsive React TypeScript application for managing schools, students, teachers, and educational workflows.

## Features

### Role-Based Dashboards
- **Admin Dashboard** - Complete system management, user administration, statistics
- **Teacher Dashboard** - Class management, assignments, grading, attendance
- **Student Dashboard** - View assignments, grades, attendance, timetable
- **Parent Dashboard** - Monitor children's performance, attendance, fees

### Key Features
- JWT Authentication & Authorization
- Role-based access control
- Responsive Bootstrap UI
- Real-time data updates
- Comprehensive statistics and analytics
- Modern, intuitive interface

## Tech Stack

- **Framework:** React 18 with TypeScript
- **UI Library:** React Bootstrap 5
- **Routing:** React Router DOM v6
- **HTTP Client:** Axios
- **Icons:** Bootstrap Icons
- **Build Tool:** Create React App

## Prerequisites

- Node.js 18+ and npm
- Backend API running on http://localhost:8080
- Modern web browser

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env.local` file:

```bash
REACT_APP_API_URL=http://localhost:8080/api
```

### 3. Start Development Server

```bash
npm start
```

Application will open at [http://localhost:3000](http://localhost:3000)

### 4. Login with Demo Accounts

- **Admin:** admin@school.com / Admin@123
- **Teacher:** teacher@school.com / Teacher@123
- **Student:** student@school.com / Student@123
- **Parent:** parent@school.com / Parent@123

## Available Scripts

### `npm start`
Runs the app in development mode at http://localhost:3000

### `npm test`
Launches the test runner in interactive watch mode

### `npm run build`
Builds the app for production to the `build` folder
- Optimized and minified
- Filenames include hashes
- Ready for deployment

### `npm run lint`
Runs ESLint to check code quality

## Docker Deployment

### Build Docker Image

```bash
docker build -t school-management-frontend .
```

### Run with Docker Compose

```bash
docker-compose up -d
```

Access at http://localhost:3000

## Project Structure

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/          # Reusable components
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Button.tsx
│   │   └── Card.tsx
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx
│   ├── pages/              # Page components
│   │   ├── Login.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── TeacherDashboard.tsx
│   │   ├── StudentDashboard.tsx
│   │   └── ParentDashboard.tsx
│   ├── services/           # API services
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── studentService.ts
│   │   └── classService.ts
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   ├── App.tsx
│   └── index.tsx
├── Dockerfile
├── docker-compose.yml
├── Jenkinsfile
├── nginx.conf
└── package.json
```

## Authentication Flow

1. User submits login credentials
2. Frontend sends POST request to `/api/auth/login`
3. Backend validates and returns JWT token
4. Token stored in localStorage
5. Token attached to all subsequent API requests
6. User redirected to role-specific dashboard

## UI Components

### Admin Dashboard
- System statistics cards
- Recent activities feed
- Quick action buttons
- User management
- School-wide analytics

### Teacher Dashboard
- Today's class schedule
- Pending assignments to grade
- Student performance tracking
- Attendance marking
- Quick actions for common tasks

### Student Dashboard
- Attendance rate progress
- Average grade tracking
- Upcoming assignments
- Today's class schedule
- Recent grades

### Parent Dashboard
- Multiple children overview
- Performance comparison
- Recent activities
- Upcoming events
- Fee payment status

## Jenkins CI/CD Pipeline

The `Jenkinsfile` includes:

1. **Checkout** - Pull code from repository
2. **Install Dependencies** - npm install
3. **Lint & Code Quality** - ESLint checks
4. **Run Tests** - Unit tests with coverage
5. **SonarQube Analysis** - Code quality scan
6. **Build Application** - Production build
7. **Build Docker Image** - Containerize app
8. **Deploy** - Environment-specific deployment
9. **Health Check** - Verify deployment

### Pipeline Stages by Branch
- `develop` → Auto-deploy to Development
- `staging` → Manual approval for Staging
- `main` → Manual approval for Production

## API Integration

### Base Configuration
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
```

### Authentication Header
```typescript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Error Handling
- 401 Unauthorized → Redirect to login
- 403 Forbidden → Show access denied
- 500 Server Error → Show error message

## Configuration

### Environment Variables
- `REACT_APP_API_URL` - Backend API base URL

### Nginx Configuration
- SPA routing support
- Gzip compression
- Security headers
- Static asset caching
- API proxy (optional)

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in CI mode
npm test -- --watchAll=false
```

## Responsive Design

- Mobile-first approach
- Bootstrap grid system
- Responsive navigation
- Touch-friendly interface
- Optimized for all screen sizes

## Security Features

- JWT token authentication
- Automatic token refresh
- Protected routes
- Role-based access control
- XSS protection headers
- Secure HTTP-only cookies (recommended)

## Production Deployment

### Build Production Bundle
```bash
npm run build
```

### Serve with Nginx
```bash
docker-compose up -d
```

### Environment Configuration
Update `.env.production`:
```bash
REACT_APP_API_URL=https://api.yourschool.com
```

## Performance Optimization

- Code splitting with React.lazy
- Component memoization
- Optimized bundle size
- Gzip compression
- Browser caching
- CDN for static assets

## Troubleshooting

### CORS Issues
Ensure backend has CORS enabled for frontend URL

### API Connection Failed
Check `REACT_APP_API_URL` in `.env.local`

### Build Fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Support

For issues and questions:
- Check Backend API Documentation
- Review Authentication Guide
- Check Jenkins Pipeline logs

## License

This project is part of the School Management System.

## Contributing

1. Create feature branch
2. Make changes
3. Run tests
4. Submit pull request
