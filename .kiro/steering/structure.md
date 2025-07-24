# Project Structure

## Root Directory Organization

### Application Core
- `app/` - Next.js App Router directory
  - `(auth)/` - Authentication routes (grouped route)
  - `(root)/` - Main application routes (grouped route)
  - `api/` - API routes
  - `layout.tsx` - Root layout with providers
  - `globals.css` - Global styles and Tailwind imports

### Components Architecture
- `components/` - Reusable UI components
  - `forms/` - Form components
  - `home/` - Home page specific components
  - `shared/` - Shared/common components
  - `ui/` - Base UI components (likely from shadcn/ui)
  - Individual component files (AnswerCard, QuestionTab, etc.)

### Data Layer
- `database/` - Mongoose models and schemas
  - `*.model.ts` - Database models (question, answer, user, tag, interaction)
- `lib/` - Utility libraries and configurations
  - `actions/` - Server actions
  - `hooks/` - Custom React hooks
  - `utils/` - Utility functions
  - `mongoose.ts` - Database connection
  - `validation.ts` - Zod schemas

### Configuration & Constants
- `constants/` - Application constants and configuration
- `types/` - TypeScript type definitions
- `context/` - React context providers (ThemeProvider)

### Styling
- `styles/` - Additional CSS files
  - `theme.css` - Theme-specific styles
  - `prism.css` - Code syntax highlighting styles
- `public/assets/` - Static assets (images, icons)

## Naming Conventions

### Files & Directories
- Components: PascalCase (e.g., `AnswerCard.tsx`)
- Utilities: camelCase (e.g., `validation.ts`)
- Models: camelCase with `.model.ts` suffix
- Constants: camelCase (e.g., `index.ts`)
- Grouped routes: Parentheses `(auth)`, `(root)`

### Code Conventions
- React components: PascalCase with default exports
- Interfaces: Prefix with `I` (e.g., `IQuestions`)
- Types: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE for config values

## Import Patterns
- Use `@/` path alias for imports from project root
- Relative imports for same-directory files
- Group imports: external libraries, then internal modules

## Component Structure
- Props interface defined above component
- Default export at bottom
- Conditional rendering for authentication states
- Consistent className patterns using Tailwind utilities