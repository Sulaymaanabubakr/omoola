# Omoola Supermarket Stores

A full-stack supermarket e-commerce web application for **Omoola Supermarket Stores** in Owode Yewa, Ogun State, Nigeria.

Built with **React + TypeScript + Vite**, styled with **TailwindCSS**, powered by **Firebase** (Auth, Firestore, Storage), with WhatsApp order integration.

---

## Features

### Public Storefront
- 🏠 Home page with hero, category grid, and featured products
- 🛍️ Products listing with real-time search, category filter, and sort
- 📦 Product detail page with quantity selector and related products
- 🛒 Shopping cart with persistent local storage
- 💳 Checkout flow with order creation and form validation
- 📲 WhatsApp order integration — auto-generates order message
- ✅ Order success page with reference number
- 📬 Contact form — stores messages in Firestore

### Admin Dashboard (`/admin`)
- 🔐 Secure Firebase Authentication login
- 📊 Dashboard overview: total products, categories, orders, messages, revenue
- 📦 **Products** — full CRUD: add, edit, delete with image upload to Firebase Storage
- 🏷️ **Categories** — inline create, edit, delete
- 🛒 **Orders** — expandable order rows, item details, status management (Pending → Processing → Completed → Cancelled), WhatsApp customer link
- 💬 **Messages** — read/unread state, full message view, reply via WhatsApp or email

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Language | TypeScript |
| Styling | TailwindCSS |
| Routing | React Router v6 |
| State | Zustand (cart + auth) |
| Backend | Firebase (Auth, Firestore, Storage) |
| Notifications | react-hot-toast |
| Icons | Lucide React |

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd omoola-supermarket
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (e.g. `omoola-supermarket`)
3. Enable **Authentication** → Email/Password sign-in method
4. Create a **Firestore Database** in production mode
5. Enable **Firebase Storage**
6. Register a **Web App** and copy the config

### 4. Set environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_WHATSAPP_NUMBER=2348000000000
```

> **VITE_WHATSAPP_NUMBER** must be in international format without `+` (e.g. `2348012345678`)

### 5. Apply Firestore security rules

In Firebase Console → Firestore → Rules, paste the contents of `firestore.rules`.

Or using Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy --only firestore:rules,storage
```

### 6. Create the admin user

In Firebase Console:
1. Go to **Authentication** → **Users** → **Add user**
2. Enter admin email and password
3. Save — this account will be used to log in at `/admin/login`

### 7. Run locally

```bash
npm run dev
```

App runs at `http://localhost:5173`

---

## How the Admin Dashboard Works

### Login
Navigate to `/admin/login` and sign in with the Firebase admin email/password you created.

### Products
- Click **Add Product** to open the product form
- Fill in name, description, price, category — upload an image or paste an image URL
- Toggle **Featured** to highlight on the homepage
- Toggle **In Stock** to control availability
- Hover any row to reveal **Edit** and **Delete** actions
- All changes reflect **instantly** via Firestore real-time subscriptions

### Categories
- Type a category name and click **Add**
- Hover any row to **edit inline** or **delete**
- Categories are used to filter products on the storefront

### Orders
- Orders are created automatically when customers checkout
- Click any order row to **expand** and see order items and details
- Use the status buttons to update: **Pending → Processing → Completed → Cancelled**
- Click **WhatsApp Customer** to open a pre-filled WhatsApp chat

### Messages
- Messages sent from the Contact page appear here in real-time
- Click a message to expand and mark it as **read**
- Reply via **WhatsApp** or **email** links

---

## Deployment

### Deploy to Vercel (Recommended)

```bash
npm run build
# Then deploy dist/ to Vercel, or connect your GitHub repo
```

Set all `VITE_*` environment variables in Vercel project settings.

### Deploy to Firebase Hosting

```bash
npm run build
firebase init hosting  # choose dist/ as public directory, SPA: yes
firebase deploy
```

---

## Project Structure

```
src/
├── components/
│   ├── admin/       # ProtectedRoute, AdminSidebar, AdminHeader, ProductForm, ConfirmDialog
│   └── shop/        # Navbar, Footer, ProductCard, ProductGrid
├── hooks/           # useProducts, useCategories, useOrders, useMessages
├── layouts/         # PublicLayout, AdminLayout
├── lib/             # Firebase initialization
├── pages/
│   ├── admin/       # AdminLoginPage, AdminDashboardPage, AdminProductsPage,
│   │                # AdminCategoriesPage, AdminOrdersPage, AdminMessagesPage
│   └── shop/        # HomePage, ProductsPage, ProductDetailPage, CartPage,
│                    # CheckoutPage, OrderSuccessPage, ContactPage
├── services/        # auth.ts, products.ts, categories.ts, orders.ts, messages.ts
├── store/           # cartStore.ts (Zustand), authStore.ts (Zustand)
├── types/           # index.ts — all TypeScript interfaces
└── utils/           # formatPrice, formatDate, generateWhatsAppMessage, cn, etc.
```

---

## Firestore Data Model

```
products/
  {id}: { name, description, price, imageUrl, categoryId, isFeatured, inStock, createdAt }

categories/
  {id}: { name, slug, createdAt }

orders/
  {id}: { customerName, phone, address, notes, status, total, createdAt }

orderItems/
  {id}: { orderId, productId, productName, productImage, quantity, price }

messages/
  {id}: { name, contact, message, isRead, createdAt }
```

---

## Notes

- Cart data persists in **localStorage** via Zustand persist middleware
- Admin routes are protected — unauthenticated users are redirected to `/admin/login`
- All admin data (products, categories, orders, messages) uses **Firestore real-time listeners** for instant updates
- WhatsApp integration generates a pre-filled `wa.me` link with full order details
- Images are uploaded to **Firebase Storage** under `products/` path

---

*Built for Omoola Supermarket Stores — Owode Yewa, Ogun State, Nigeria 🇳🇬*
