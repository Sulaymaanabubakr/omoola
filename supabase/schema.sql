-- Supabase schema for Omoola Supermarket
-- Run this in the Supabase SQL Editor to create all required tables.

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── Products ────────────────────────────────────────────────────────────────

create table if not exists products (
    id uuid primary key default uuid_generate_v4(),
    name text not null default '',
    slug text unique not null default '',
    description text default '',
    price numeric(10,2) not null default 0,
    compare_at_price numeric(10,2),
    category_id text default '',
    category_name text default '',
    tags jsonb default '[]'::jsonb,
    featured boolean default false,
    best_seller boolean default false,
    new_arrival boolean default false,
    images jsonb default '[]'::jsonb,
    stock_qty integer not null default 0,
    sku text default '',
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ─── Categories ──────────────────────────────────────────────────────────────

create table if not exists categories (
    id uuid primary key default uuid_generate_v4(),
    name text not null default '',
    slug text default '',
    description text default '',
    image_url text default '',
    created_at timestamptz default now()
);

-- ─── Orders ──────────────────────────────────────────────────────────────────

create table if not exists orders (
    id uuid primary key default uuid_generate_v4(),
    order_number text unique,
    user_id uuid,
    customer jsonb default '{}'::jsonb,
    items jsonb default '[]'::jsonb,
    subtotal numeric(10,2) default 0,
    delivery_fee numeric(10,2) default 0,
    total numeric(10,2) default 0,
    shipping_address jsonb default '{}'::jsonb,
    payment_provider text default 'whatsapp',
    payment_reference text default '',
    payment_status text default 'pending',
    paid_at timestamptz,
    status text default 'pending',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ─── Order Status Events ─────────────────────────────────────────────────────

create table if not exists order_status_events (
    id uuid primary key default uuid_generate_v4(),
    order_id uuid references orders(id) on delete cascade,
    status text not null,
    note text default '',
    created_at timestamptz default now()
);

-- ─── Settings (single-row store config) ──────────────────────────────────────

create table if not exists settings (
    id text primary key default 'store',
    store_name text default '',
    logo_url text default '',
    store_address text default '',
    phone text default '',
    email text default '',
    whatsapp text default '',
    hero_images jsonb default '[]'::jsonb,
    delivery_fee numeric(10,2) default 2000,
    announcement_enabled boolean default false,
    announcement_text text default '',
    announcement_speed integer default 22,
    updated_at timestamptz default now()
);

-- ─── Users ───────────────────────────────────────────────────────────────────

create table if not exists users (
    id uuid primary key default uuid_generate_v4(),
    name text default '',
    email text unique,
    phone text default '',
    role text default 'customer',
    created_at timestamptz default now()
);

-- ─── Contact Messages ────────────────────────────────────────────────────────

create table if not exists contact_messages (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    email text not null,
    subject text,
    message text not null,
    created_at timestamptz default now()
);

-- ─── Newsletter Subscribers ──────────────────────────────────────────────────

create table if not exists newsletter_subscribers (
    email text primary key,
    updated_at timestamptz default now()
);

-- ─── Row Level Security (RLS) ────────────────────────────────────────────────
-- Enable RLS on all tables. The anon key can read public data.
-- Admin writes are secured by Supabase Auth + policies.

alter table products enable row level security;
alter table categories enable row level security;
alter table orders enable row level security;
alter table order_status_events enable row level security;
alter table settings enable row level security;
alter table users enable row level security;
alter table contact_messages enable row level security;
alter table newsletter_subscribers enable row level security;

-- Public read access for storefront
create policy "Public can read active products" on products for select using (is_active = true);
create policy "Public can read categories" on categories for select using (true);
create policy "Public can read settings" on settings for select using (true);

-- Authenticated (admin) full access
create policy "Admin full access to products" on products for all using (auth.role() = 'authenticated');
create policy "Admin full access to categories" on categories for all using (auth.role() = 'authenticated');
create policy "Admin full access to orders" on orders for all using (auth.role() = 'authenticated');
create policy "Admin full access to order_status_events" on order_status_events for all using (auth.role() = 'authenticated');
create policy "Admin full access to settings" on settings for all using (auth.role() = 'authenticated');
create policy "Admin full access to users" on users for all using (auth.role() = 'authenticated');
create policy "Admin can read contact messages" on contact_messages for select using (auth.role() = 'authenticated');
create policy "Admin can read newsletter subs" on newsletter_subscribers for select using (auth.role() = 'authenticated');

-- Anyone can submit contact forms and subscribe to newsletter
create policy "Anyone can submit contact form" on contact_messages for insert with check (true);
create policy "Anyone can subscribe newsletter" on newsletter_subscribers for insert with check (true);
create policy "Anyone can update newsletter sub" on newsletter_subscribers for update using (true);

-- Seed initial settings row
insert into settings (id, store_name, delivery_fee, announcement_enabled, announcement_text, announcement_speed)
values ('store', 'Omoola Pharmacy & Stores', 2000, true, 'Welcome to Omoola Pharmacy & Stores. Shop quality products with confidence.', 22)
on conflict (id) do nothing;
