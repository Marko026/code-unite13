# Technology Stack

## Framework & Runtime
- **Next.js 14.1.0** - React framework with App Router
- **React 18.2.0** - UI library
- **TypeScript 5.3.3** - Type-safe JavaScript
- **Node.js** - Runtime environment

## Database & Authentication
- **MongoDB** - NoSQL database
- **Mongoose 8.1.3** - MongoDB ODM
- **Clerk** - Authentication and user management

## Styling & UI
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Radix UI** - Headless UI components
- **Lucide React** - Icon library
- **TinyMCE** - Rich text editor
- **Prism.js** - Code syntax highlighting

## Development Tools
- **ESLint** - Code linting with Next.js, Prettier, and Tailwind configs
- **Prettier** - Code formatting
- **Jest** - Testing framework with React Testing Library
- **TypeScript** - Static type checking

## Key Libraries
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **date-fns** - Date utilities
- **query-string** - URL query parsing
- **clsx & tailwind-merge** - Conditional CSS classes

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Testing
```bash
npm test             # Run tests once
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## Configuration Notes
- Uses App Router (not Pages Router)
- Configured for MongoDB with Mongoose external package
- Image optimization enabled for all domains
- Custom Webpack config for TinyMCE compatibility
- Path aliases: `@/*` maps to project root