# Design Document

## Overview

Ovaj design dokument opisuje sistematski pristup rešavanju deployment problema u DevOverFlow aplikaciji. Fokus je na rešavanju ESLint grešaka, TypeScript problema, Tailwind CSS warnings-a, i optimizaciji deployment konfiguracije.

## Architecture

### Problem Categories

1. **ESLint Configuration Issues**

   - Test fajlovi nemaju pristup Jest globals
   - Neiskorišćene varijable
   - HTML entity escaping problemi

2. **TypeScript Issues**

   - Neiskorišćene varijable i importi
   - Sintaksne greške

3. **Tailwind CSS Warnings**

   - Shorthand klase nisu korišćene
   - Custom klase nisu definisane u theme
   - Deprecated klase

4. **Deployment Configuration**
   - Next.js konfiguracija za production
   - Environment varijable
   - Vercel optimizacije

## Components and Interfaces

### ESLint Configuration Component

**Purpose:** Konfigurisanje ESLint-a za pravilno rukovanje test fajlovima i production kodom

**Implementation:**

- Dodavanje Jest environment-a za test fajlove
- Konfiguracija globals za Jest funkcije
- Dodavanje overrides za različite tipove fajlova

**Files to modify:**

- `.eslintrc.json` - glavna ESLint konfiguracija
- Test fajlovi - dodavanje ESLint disable komentara gde je potrebno

### Code Cleanup Component

**Purpose:** Uklanjanje neiskorišćenih varijabli i ispravka sintaksnih grešaka

**Implementation:**

- Identifikacija i uklanjanje neiskorišćenih varijabli
- Ispravka HTML entity escaping problema
- Dodavanje TypeScript ignore komentara gde je potrebno

**Files to modify:**

- `components/forms/Answers.tsx`
- `components/shared/ErrorBoundary.tsx`
- `components/shared/GlobalErrorProvider.tsx`
- `lib/utils/errorLogger.ts`

### Tailwind CSS Optimization Component

**Purpose:** Optimizacija Tailwind CSS klasa za bolje performance i maintainability

**Implementation:**

- Zamena h-X w-X kombinacija sa size-X shorthand
- Definisanje custom klasa u tailwind.config.ts
- Ažuriranje deprecated klasa

**Files to modify:**

- `tailwind.config.ts` - dodavanje custom theme varijabli
- Komponente sa Tailwind warnings-ima

### Deployment Configuration Component

**Purpose:** Optimizacija konfiguracije za production deployment

**Implementation:**

- Ažuriranje Next.js konfiguracije
- Optimizacija Vercel konfiguracije
- Provera environment varijabli

**Files to modify:**

- `next.config.js`
- `vercel.json`
- `.env.local` (template)

## Data Models

### ESLint Configuration Model

```json
{
  "extends": ["next/core-web-vitals", "prettier", "standard"],
  "plugins": ["tailwindcss"],
  "env": {
    "browser": true,
    "node": true,
    "es6": true
  },
  "overrides": [
    {
      "files": ["**/__tests__/**/*", "**/*.test.*"],
      "env": {
        "jest": true
      }
    }
  ]
}
```

### Tailwind Theme Extension Model

```typescript
{
  theme: {
    extend: {
      colors: {
        primary: "hsl(var(--primary))",
        secondary: "hsl(var(--secondary))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))"
      }
    }
  }
}
```

## Error Handling

### Build Error Recovery

- Postupno rešavanje grešaka po prioritetu
- Testiranje build-a nakon svake izmene
- Rollback strategija ako se jave novi problemi

### ESLint Error Handling

- Korišćenje ESLint disable komentara samo kada je neophodno
- Dokumentovanje razloga za disable komentare
- Periodična revizija disable komentara

### TypeScript Error Handling

- Korišćenje @ts-ignore samo u krajnjim slučajevima
- Preferiranje type assertions i proper typing
- Dokumentovanje kompleksnih type workaround-ova

## Testing Strategy

### Build Testing

1. **Local Build Test** - `npm run build` lokalno
2. **Lint Test** - `npm run lint` bez grešaka
3. **Type Check** - TypeScript kompajliranje bez grešaka

### Deployment Testing

1. **Vercel Preview Deploy** - test na preview branch-u
2. **Production Deploy** - finalni deployment test
3. **Runtime Testing** - funkcionalno testiranje nakon deployment-a

### Regression Testing

- Testiranje ključnih funkcionalnosti nakon izmena
- Provera da li su svi deployment problemi rešeni
- Validacija da nove izmene ne uvode nove probleme

## Implementation Phases

### Phase 1: ESLint Configuration

- Ažuriranje .eslintrc.json
- Dodavanje Jest environment za test fajlove
- Testiranje lint komande

### Phase 2: Code Cleanup

- Uklanjanje neiskorišćenih varijabli
- Ispravka HTML entity problema
- Rešavanje TypeScript grešaka

### Phase 3: Tailwind Optimization

- Implementacija shorthand klasa
- Dodavanje custom theme varijabli
- Ažuriranje deprecated klasa

### Phase 4: Deployment Configuration

- Optimizacija Next.js config
- Ažuriranje Vercel config
- Finalno testiranje build-a

### Phase 5: Validation

- Kompletan build test
- Deployment na Vercel
- Funkcionalno testiranje
