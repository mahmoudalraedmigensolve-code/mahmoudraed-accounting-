# Accounting App - Development Guidelines

## Project Overview
This is a comprehensive accounting application for sales, purchases, and financial management built with Next.js, Firebase, and modern web technologies.

---

## Architecture

### Feature-Based Architecture
We follow a **strict feature-based architecture** where each feature is self-contained with its own:
- Components
- Services
- Store (Zustand)
- Types
- Hooks
- Utils

### Project Structure
```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Auth routes group
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/             # Dashboard routes group
│   │   ├── page.tsx
│   │   ├── sales/
│   │   ├── purchases/
│   │   ├── customers/
│   │   ├── suppliers/
│   │   ├── products/
│   │   ├── inventory/
│   │   └── reports/
│   ├── layout.tsx
│   └── globals.css
│
├── features/                     # Feature-based modules
│   ├── auth/
│   │   ├── components/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   └── hooks/
│   ├── sales/
│   │   ├── components/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   └── hooks/
│   ├── purchases/
│   ├── customers/
│   ├── suppliers/
│   ├── products/
│   ├── inventory/
│   └── reports/
│
├── components/                   # Shared components
│   ├── ui/                      # shadcn/ui components
│   ├── layout/
│   └── common/
│
├── lib/                         # External library configurations
│   ├── firebase/
│   │   ├── config.ts
│   │   ├── auth.ts
│   │   └── firestore.ts
│   └── utils.ts
│
├── store/                       # Global Zustand stores
│   ├── auth-store.ts
│   └── app-store.ts
│
├── services/                    # Shared services
│   └── api/
│
├── hooks/                       # Shared custom hooks
│
├── types/                       # Shared TypeScript types
│   ├── index.ts
│   └── global.d.ts
│
└── utils/                       # Utility functions
    ├── formatters.ts
    ├── validators.ts
    └── helpers.ts
```

---

## State Management

### Zustand
We use **Zustand** exclusively for state management across the entire application.

#### Store Guidelines:
1. **Each feature has its own store** in `features/[feature-name]/store/`
2. **Global stores** go in `src/store/`
3. **TypeScript first** - all stores must be fully typed
4. **Persist important data** using zustand/middleware for persistence

#### Store Example:
```typescript
// features/sales/store/sales-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Sale {
  id: string;
  // ... other fields
}

interface SalesStore {
  sales: Sale[];
  isLoading: boolean;
  addSale: (sale: Sale) => void;
  fetchSales: () => Promise<void>;
}

export const useSalesStore = create<SalesStore>()(
  persist(
    (set, get) => ({
      sales: [],
      isLoading: false,
      addSale: (sale) => set((state) => ({
        sales: [...state.sales, sale]
      })),
      fetchSales: async () => {
        // Implementation
      },
    }),
    {
      name: 'sales-store',
    }
  )
);
```

---

## Backend & Database

### Firebase Authentication
- **Provider**: Firebase Authentication
- **Configuration**: `src/lib/firebase/auth.ts`
- **Supported Methods**: Email/Password, Google (extensible)
- **Session Management**: Firebase handles tokens automatically

#### Auth Flow:
1. User logs in via Firebase Auth
2. Store user data in Zustand auth store
3. Protect routes using middleware or route guards
4. Use Firebase Auth state listener for persistence

### Firebase Firestore
- **Database**: Cloud Firestore
- **Configuration**: `src/lib/firebase/firestore.ts`
- **Data Access**: Through feature services only

#### Firestore Structure:
```
collections/
├── users/
│   └── {userId}/
│       ├── profile
│       └── settings
├── sales/
│   └── {saleId}/
├── purchases/
│   └── {purchaseId}/
├── customers/
│   └── {customerId}/
├── suppliers/
│   └── {supplierId}/
├── products/
│   └── {productId}/
└── inventory/
    └── {itemId}/
```

#### Service Layer Pattern:
```typescript
// features/sales/services/sales-service.ts
import { db } from '@/lib/firebase/firestore';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export const salesService = {
  async createSale(saleData: Sale) {
    const docRef = await addDoc(collection(db, 'sales'), saleData);
    return docRef.id;
  },

  async fetchSales() {
    const querySnapshot = await getDocs(collection(db, 'sales'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },
};
```

---

## UI Components

### Component Libraries
We use **two complementary component libraries**:

1. **shadcn/ui** - Primary component library
   - Installation: Components copied to `src/components/ui/`
   - Customizable and accessible
   - Built on Radix UI primitives
   - Styled with Tailwind CSS

2. **Origin UI** - Additional specialized components
   - For advanced UI patterns
   - Complements shadcn/ui
   - Modern and production-ready

### Styling
- **Framework**: Tailwind CSS 4
- **Theme**: Configured in `globals.css`
- **Custom Classes**: Use Tailwind @apply when needed
- **Responsive**: Mobile-first approach

### Component Guidelines:
1. **Use shadcn/ui first** for standard components (Button, Input, Dialog, etc.)
2. **Use Origin UI** for specialized patterns not in shadcn
3. **Build custom components** only when necessary
4. **Co-locate feature components** in `features/[name]/components/`
5. **Shared components** go in `src/components/`

---

## Best Practices

### TypeScript
- **Strict Mode**: Always enabled
- **Type Everything**: No `any` types unless absolutely necessary
- **Interfaces over Types**: Prefer interfaces for object shapes
- **Export Types**: Share types through `types/index.ts`

### Naming Conventions
- **Files**: kebab-case (`user-profile.tsx`, `sales-service.ts`)
- **Components**: PascalCase (`UserProfile`, `SalesForm`)
- **Functions**: camelCase (`fetchSales`, `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (`API_URL`, `MAX_ITEMS`)
- **Stores**: use[Feature]Store (`useSalesStore`, `useAuthStore`)

### File Organization
- **One component per file** (except small sub-components)
- **Index files** for clean exports
- **Group related files** in feature folders
- **Separate concerns**: components, services, hooks, utils

### Import Structure
Use path aliases for clean imports:
```typescript
// ✅ Good
import { Button } from '@/components/ui/button';
import { useSalesStore } from '@/features/sales/store/sales-store';

// ❌ Bad
import { Button } from '../../../components/ui/button';
```

Order imports:
1. React/Next.js imports
2. External libraries
3. Internal aliases (@/)
4. Relative imports
5. Types

### Code Quality
- **DRY Principle**: Don't repeat yourself
- **Single Responsibility**: Each function/component does one thing
- **Error Handling**: Always handle errors gracefully
- **Loading States**: Show loading indicators for async operations
- **Validation**: Validate all user inputs

### Firebase Rules
- **Never trust client**: Implement security rules in Firestore
- **Validate server-side**: Double-check data integrity
- **Use timestamps**: Track created/updated times
- **Soft deletes**: Mark as deleted instead of removing

---

## Development Workflow

### Feature Development
1. Create feature folder structure
2. Define TypeScript types
3. Create Zustand store
4. Build Firebase service layer
5. Create UI components
6. Integrate and test

### Commit Guidelines
- Use clear, descriptive commit messages
- Follow conventional commits format
- Test before committing

### Code Review Checklist
- [ ] TypeScript types defined
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Responsive design verified
- [ ] Firebase security considered
- [ ] No console.logs left behind

---

## Performance Considerations

### Next.js Optimization
- Use Server Components by default
- Client Components only when needed (interactivity, hooks)
- Implement proper code splitting
- Optimize images with next/image

### Firebase Optimization
- Use pagination for large datasets
- Implement proper indexing
- Cache frequently accessed data
- Minimize real-time listeners

### Zustand Optimization
- Split large stores into smaller ones
- Use selectors to prevent unnecessary re-renders
- Persist only essential data

---

## Security Guidelines

### Authentication
- Never expose Firebase config secrets
- Use environment variables for sensitive data
- Implement proper route protection
- Handle token expiration

### Data Access
- Validate all inputs
- Sanitize user data
- Implement Firestore security rules
- Use TypeScript for type safety

---

## Environment Variables

Create `.env.local` file:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## Dependencies

### Core Dependencies
- `next` - Next.js framework
- `react` - React library
- `typescript` - TypeScript
- `tailwindcss` - Styling
- `zustand` - State management
- `firebase` - Backend services

### UI Libraries
- `shadcn/ui` - Primary components
- `origin-ui` - Additional components
- `lucide-react` - Icons

### Utilities
- `date-fns` - Date formatting
- `zod` - Schema validation
- `react-hook-form` - Form handling

---

## Quick Reference

### Adding a New Feature
1. Create folder: `src/features/[feature-name]/`
2. Add subdirectories: `components/`, `services/`, `store/`, `types/`, `hooks/`
3. Create store in `store/[feature-name]-store.ts`
4. Create service in `services/[feature-name]-service.ts`
5. Build components in `components/`
6. Add route in `src/app/(dashboard)/[feature-name]/`

### Adding shadcn/ui Component
```bash
npx shadcn@latest add [component-name]
```

### Creating a Store
```typescript
import { create } from 'zustand';

interface MyStore {
  // state and actions
}

export const useMyStore = create<MyStore>()((set) => ({
  // implementation
}));
```

### Firebase Service Pattern
```typescript
import { db } from '@/lib/firebase/firestore';

export const myService = {
  async create(data) { /* ... */ },
  async read(id) { /* ... */ },
  async update(id, data) { /* ... */ },
  async delete(id) { /* ... */ },
};
```

---

**Last Updated**: November 2025
**Framework Version**: Next.js 16.0.3
**React Version**: 19.2.0
