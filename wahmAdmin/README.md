# Wahm Admin Panel (wahmAdmin)

Standalone Admin Panel for Wahm e-commerce platform.

## Features
- **Dashboard**: High-level store metrics and quick links.
- **Product Management**: Create, edit, and categorize products with TipTap rich-text description editor.
- **Product Gallery**: Upload, organize, and manage image library assets.
- **Orders**: Manage full orders and track initiated checkouts.
- **Enquiries & Careers**: Review customer contact inquiries and job applicant submissions.
- **Reviews**: Approve and manage customer reviews.
- **Charges & Coupons**: Manage shipping charges, thresholds, and discount coupons.
- **Users**: Manage customer accounts and roles.
- **Mail Templates**: Customize transactional email templates.
- **Promotions & Ribbon**: Configure storefront announcement ribbon banners.
- **Dedicated Admin Authentication**: Secure login portal with role verification.

## Running Locally

1. Navigate to the `wahmAdmin` folder:
   ```bash
   cd wahmAdmin
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Configure Firebase:
   Edit `.env` or set environment variables when ready:
   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_FIREBASE_MEASUREMENT_ID=...
   ```

4. Start development server:
   ```bash
   npm run dev
   ```
   By default, the admin panel runs on `http://localhost:5174/`.

5. Build for production:
   ```bash
   npm run build
   ```
