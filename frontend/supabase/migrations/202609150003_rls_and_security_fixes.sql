-- ============================================================
-- Migration: RLS and security fixes
-- Date: 2026-09-15
-- ============================================================
--
-- This migration adds missing RLS policies for tables that had
-- row-level security enabled but no policies defined, which
-- effectively blocked all access.
--
-- It also adds an INSERT policy for profiles so that new
-- Supabase Auth users can create a profile row on signup.
-- ============================================================

-- -----------------------------------------------------------
-- 1. Carts – customers own their carts via user_id
-- -----------------------------------------------------------
-- The carts table already has RLS enabled but no policies,
-- meaning all access was denied by default.

-- Allow customers to read their own carts
create policy "Customers can read their own carts"
  on public.carts for select
  using (auth.uid() = user_id);

-- Allow customers to insert their own carts
create policy "Customers can insert their own carts"
  on public.carts for insert
  with check (auth.uid() = user_id);

-- Allow customers to update their own carts
create policy "Customers can update their own carts"
  on public.carts for update
  using (auth.uid() = user_id);

-- -----------------------------------------------------------
-- 2. Cart items – customers own their cart items via cart FK
-- -----------------------------------------------------------
-- cart_items does NOT have RLS enabled in the initial schema.
-- Enable RLS and add a policy so that only cart owners can
-- read/modify their cart items.  Because cart_items is always
-- accessed through the cart FK in the Django API, these
-- policies mainly protect direct Supabase access.

alter table public.cart_items enable row level security;

create policy "Customers can read their own cart items"
  on public.cart_items for select
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_id and c.user_id = auth.uid()
    )
  );

create policy "Customers can insert their own cart items"
  on public.cart_items for insert
  with check (
    exists (
      select 1 from public.carts c
      where c.id = cart_id and c.user_id = auth.uid()
    )
  );

create policy "Customers can update their own cart items"
  on public.cart_items for update
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_id and c.user_id = auth.uid()
    )
  );

create policy "Customers can delete their own cart items"
  on public.cart_items for delete
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_id and c.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------
-- 3. Profiles – add INSERT policy for new user signup
-- -----------------------------------------------------------
-- The initial migration only had SELECT and UPDATE policies.
-- A new user who signs up via Supabase Auth needs to create
-- their profile row.  Without an INSERT policy this would fail.

create policy "Customers can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- -----------------------------------------------------------
-- 4. Stock reservations – staff-only read via service key
-- -----------------------------------------------------------
-- Stock reservations are managed by the Django backend using
-- the service-role connection (which bypasses RLS).  However,
-- we still enable RLS on the table to prevent direct anon
-- access.  No customer-facing policies are added; the
-- Django backend operates with elevated privileges.

alter table public.stock_reservations enable row level security;

-- -----------------------------------------------------------
-- 5. Payment intents – staff-only via service key
-- -----------------------------------------------------------
-- Payment intents contain sensitive gateway references.
-- Enable RLS to block direct anon access.

alter table public.payment_intents enable row level security;

-- -----------------------------------------------------------
-- 6. Payment events – staff-only via service key
-- -----------------------------------------------------------
alter table public.payment_events enable row level security;

-- -----------------------------------------------------------
-- 7. Products & categories – public read access
-- -----------------------------------------------------------
-- Products and categories should be publicly readable so that
-- Supabase-powered features (e.g., instant search) can work.
-- Writes are handled by Django staff/admin only.

alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.product_variants enable row level security;

create policy "Anyone can read active categories"
  on public.categories for select
  using (is_active = true);

create policy "Anyone can read active products"
  on public.products for select
  using (status = 'ACTIVE'::public.product_status);

create policy "Anyone can read active product variants"
  on public.product_variants for select
  using (is_active = true);
