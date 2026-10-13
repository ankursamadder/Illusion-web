# Wahm Workspace

Monorepo containing the Wahm Fashion customer storefront and admin dashboard.

## Directory Structure

```
wahm/
├── Wahmfashion/   # Main customer-facing ecommerce storefront (React + Vite)
└── wahmAdmin/     # Standalone store management & operations panel (React + Vite)
```

## Running Applications

### 1. Storefront (`Wahmfashion`)
- **Direct**:
  ```bash
  cd Wahmfashion
  npm run dev
  ```
- **From root**:
  ```bash
  npm run dev:web
  ```
  Runs on `http://localhost:5173`.

### 2. Admin Panel (`wahmAdmin`)
- **Direct**:
  ```bash
  cd wahmAdmin
  npm run dev
  ```
- **From root**:
  ```bash
  npm run dev:admin
  ```
  Runs on `http://localhost:5174`.

### 3. Build for Production
- **Build Storefront**: `npm run build:web`
- **Build Admin Panel**: `npm run build:admin`
- **Build All**: `npm run build:all`
