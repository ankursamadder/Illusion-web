# Wahm Workspace

Monorepo containing the Wahm Fashion customer storefront and admin dashboard.

## Directory Structure

```
wahm/
├── wahmFashion/   # Main customer-facing ecommerce storefront (React + Vite)
└── wahmAdmin/     # Standalone store management & operations panel (React + Vite)
```

## Running Applications

### 1. Storefront (`wahmFashion`)
- **Direct**:
  ```bash
  cd wahmFashion
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

### 4. Deploy to Firebase Hosting
- **Deploy Storefront (`thewahmfashion.web.app`)**:
  ```bash
  npm run deploy:web
  ```
- **Deploy Admin Portal (`thewahmfashion-admin.web.app`)**:
  ```bash
  npm run deploy:admin
  ```
- **Deploy Both Sites**:
  ```bash
  npm run deploy:all
  ```
