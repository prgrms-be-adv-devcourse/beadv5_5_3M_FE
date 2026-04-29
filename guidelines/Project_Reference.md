# Project Reference (AI Internal)

This document provides architectural and technical context for AI assistance. Refer to this when creating new components, pages, or modifying existing logic.

## 🚀 Technology Stack

- **Framework**: React 18.3.1
- **Build Tool**: Vite 6.3.5
- **Routing**: React Router 7 (using `createBrowserRouter`)
- **Styling**: 
  - Tailwind CSS v4 (with `@tailwindcss/vite` plugin)
  - Emotion (@emotion/styled, @emotion/react)
  - MUI (Material UI v7)
- **UI Components**: Radix UI Primitives, Lucide React (Icons), Shadcn-like component structure in `src/app/components/ui`.
- **Theme Management**: `next-themes` (Default: `dark`).
- **State/Tools**: `agentation` (AI monitoring), `recharts` (Charts), `lucide-react`.

## 📂 Directory Structure

- `src/app/`: Core application logic.
  - `pages/`: Page components (e.g., `MainPage.tsx`, `MovieDetailPage.tsx`).
  - `components/ui/`: Low-level, reusable UI atoms (Button, Card, Dialog, etc.).
  - `components/figma/`: Layout and compound components, often mirroring design intent.
  - `routes.tsx`: Router configuration.
- `src/styles/`: Style definitions.
  - `theme.css`: Main design tokens (Colors, OKLCH, Variables).
  - `tailwind.css`: Tailwind directives.
- `guidelines/`: AI and project guidelines.

## 🛠 Coding Conventions

### Components
- Use **Functional Components** with TypeScript.
- Follow the **Shadcn pattern** for UI components:
  - Base components in `src/app/components/ui`.
  - Use `cva` (Class Variance Authority) for variants.
  - Use `cn` utility (from `./utils`) for merging Tailwind classes.
- Use **Radix UI Primitives** for accessible, complex components (Dialog, Popover, etc.).

### Styling
- **Tailwind v4**: Use `@apply` in CSS or utility classes in JSX.
- **Colors**: Reference CSS variables defined in `theme.css` (e.g., `--primary`, `--background`).
- **Theme**: Support both light and dark modes using `.dark` class.

### Routing
- Add new routes in `src/app/routes.tsx`.
- Use `useNavigate` and `useParams` from `react-router`.

## 🎨 Design Tokens (from theme.css)

- **Primary**: `--primary` (#030213 / oklch(0.985 0 0))
- **Foreground**: `--foreground` (oklch(0.145 0 0) / oklch(0.985 0 0))
- **Background**: `--background` (#ffffff / oklch(0.145 0 0))
- **Radius**: `--radius` (0.625rem)
- **OKLCH**: The project uses OKLCH color space for modern, perceptually uniform colors.
