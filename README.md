# Avoltix web store (Next.js + TypeScript + Firebase)

Two modes, chosen automatically:
- No Firebase keys in `.env.local` -> DEMO mode. Sample products, data saved in your browser only. Good for looking around.
- Firebase keys present -> LIVE mode. Real login, Firestore database, image upload, secure order creation.

Storefront: `/`   Admin panel: `/admin` (no link anywhere in the store; type the address).

## A. Quick look (demo mode, 3 minutes)
1. Install Node.js LTS from https://nodejs.org
2. In this folder: `npm install` then `npm run dev`
3. Open http://localhost:3000 and http://localhost:3000/admin

## B. Go live with Firebase (one time)
1. https://console.firebase.google.com -> Add project.
2. Build > Authentication > Get started > enable **Email/Password**.
3. Build > Firestore Database > Create database > Production mode, location **asia-south1 (Mumbai)**.
4. Build > Storage > Get started (same location).
5. Upgrade the project to the **Blaze (pay-as-you-go)** plan. Cloud Functions need it; small usage is typically within free quotas, check pricing yourself.
6. Project settings > Your apps > add a **Web app** > copy the config values.
7. Copy `.env.example` to `.env.local` (Windows: `copy .env.example .env.local`) and paste the values.
8. Install the CLI and log in: `npm install -g firebase-tools` then `firebase login`
9. Link the folder: `firebase use --add` and pick your project.
10. Deploy rules, indexes, storage rules and the order function:
    `firebase deploy --only firestore:rules,firestore:indexes,storage,functions`
    (The first Firestore index can take a few minutes to build.)
11. Service account for the two helper scripts: Project settings > Service accounts > Generate new private key. Save the JSON OUTSIDE this folder. Never commit or share it.
    - Windows PowerShell: `$env:GOOGLE_APPLICATION_CREDENTIALS="C:\keys\avoltix.json"`
    - Mac/Linux: `export GOOGLE_APPLICATION_CREDENTIALS=/path/avoltix.json`
12. Run `npm run dev`, open http://localhost:3000/login and **register** with the email you want as admin.
13. Make that user admin: `node scripts/set-admin.mjs you@example.com`
14. Add starter categories (optional): `node scripts/seed-categories.mjs`
15. Open http://localhost:3000/admin, sign in (sign out and in again if it says not authorised), add categories and products.

## C. Publish the website
Firebase App Hosting: push this folder to GitHub, Firebase Console > App Hosting > connect repo, and put the same `NEXT_PUBLIC_*` values in `apphosting.yaml` (placeholders are there). Add your domain under Authentication > Settings > Authorized domains. This deployment config has not been tested by me.

## What is built
- Storefront: animated logo (AVOLTIX.in), homepage with admin-controlled poster slider and announcement bar, nested categories, product list with search/category/sort/stock filters, product page, cart, wishlist, checkout (UNPAID order request, no payment), orders, **component request page**, policy pages (draft text), mobile bottom nav, PWA manifest, robots, sitemap.
- **Component request** (replaces bulk inquiry): customer signs in, adds any number of components with quantities and notes, enters contact number and details, and the request reaches the admin with Call / WhatsApp / Email buttons. Customers see their requests and status under Account > My orders.
- **Admin (/admin)** (not linked anywhere on the store; Firebase login + admin claim in live mode):
  - Products: add, edit everything (SKU stays fixed), change image, change stock/status, move category, **delete permanently**.
  - Categories: add, edit name/description/parent/order, publish or hide, **delete permanently** (blocked while it still has products or subcategories, so nothing is orphaned).
  - Homepage layout: choose how many category boxes (2-6) and products (2-5) appear per row. Category boxes show the image and name set under Categories (phones always show 2 per row).
  - Poster order: move posters earlier/later or pick an exact position; hide/show without deleting.
  - Homepage: add/edit/delete posters (image, optional click link, order, show/hide); posters auto-slide every 5 seconds and can be swiped. Announcement bar with optional click link. Empty link means not clickable.
  - Orders (status), component requests (status, contact buttons).
- Security: Firestore and Storage rules, order creation only through the `placeOrder` Cloud Function, audit log entries for admin writes.

## Not built yet / known limits
- Rules and the function have NOT been tested in the Firebase emulator or on a real project. Test on a throwaway project first.
- Deleting a product removes it from the catalogue; past orders keep their own copy of the product name and price.
- Product doc ID equals SKU. All published products load at once (fine for hundreds). Search is simple text matching.
- Single admin role, no customer address book, cart kept in the browser, no coupons, returns with video, email notifications, CSV import/export, site settings editor, payment, reviews.
- Shipping rule (free from Rs 999 else Rs 60) is fixed in code, no tax calculation yet. Product pages are client-rendered (limited SEO). Policy pages are drafts needing legal review. No spam protection (App Check) yet.
- Poster images: 3 MB max in live mode, 400 KB in demo mode. Replaced or deleted product images may stay in Storage until removed by hand (banner and product deletes try to remove their image).

## Commands
npm run dev | npm run build | npm run start | npm run typecheck
Reset demo data: browser DevTools > Application > Local Storage > delete `avoltix_v2`.
