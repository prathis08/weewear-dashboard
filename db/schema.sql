-- WeeWear full schema
-- Safe to run on both fresh and existing databases.
-- CREATE TABLE IF NOT EXISTS creates tables that don't exist yet.
-- ALTER TABLE ... ADD COLUMN IF NOT EXISTS adds any missing columns to existing tables.
--
-- Storefront Prisma models that reference this schema must use:
--   model Product      { id String @id @default(uuid()) @db.Uuid ... }
--   model ProductImage { id String @id @default(uuid()) @db.Uuid
--                        productId String @map("product_id") @db.Uuid ... }
--   model CartItem     { productId String @map("product_id") @db.Uuid ... }
--   model OrderItem    { productId String? @map("product_id") @db.Uuid ... }
--   model Coupon       { id String @id @default(uuid()) @db.Uuid ... }

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- SESSIONS (managed by connect-pg-simple in the storefront)
-- ================================================================
CREATE TABLE IF NOT EXISTS sessions (
  sid     VARCHAR PRIMARY KEY,
  sess    JSON    NOT NULL,
  expire  TIMESTAMP NOT NULL
);

-- ================================================================
-- USERS
-- ================================================================
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone         VARCHAR(15),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- PRODUCTS
-- ================================================================
CREATE TABLE IF NOT EXISTS products (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(200) NOT NULL,
  description    TEXT,
  price          NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  gender         VARCHAR(20),
  category       VARCHAR(100),
  sizes          TEXT[],
  stock          INTEGER DEFAULT 0,
  sizes_stock    JSONB DEFAULT '{}'::jsonb,
  size_chart_url TEXT,
  image_url      TEXT,
  rating         NUMERIC(2,1) DEFAULT 0,
  review_count   INTEGER DEFAULT 0,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- PRODUCT IMAGES
-- ================================================================
CREATE TABLE IF NOT EXISTS product_images (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  position   INTEGER DEFAULT 0
);

-- ================================================================
-- CATEGORIES
-- ================================================================
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(100) NOT NULL,
  gender     VARCHAR(20),   -- 'Men' | 'Women' | 'Unisex' | NULL = all genders
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, gender)
);

-- ================================================================
-- CART ITEMS
-- ================================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1,
  size       VARCHAR(10),
  added_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id, size)
);

-- ================================================================
-- ORDERS
-- ================================================================
CREATE TABLE IF NOT EXISTS orders (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER REFERENCES users(id),
  razorpay_order_id   VARCHAR(100) UNIQUE,
  razorpay_payment_id VARCHAR(100),
  status              VARCHAR(50) DEFAULT 'pending',
  total               NUMERIC(10,2),
  shipping_address    JSONB,
  coupon_code         VARCHAR(50),
  discount            NUMERIC(10,2) DEFAULT 0,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- ORDER ITEMS
-- ================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity   INTEGER NOT NULL,
  size       VARCHAR(10),
  price      NUMERIC(10,2) NOT NULL
);

-- ================================================================
-- COUPONS
-- ================================================================
CREATE TABLE IF NOT EXISTS coupons (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code           VARCHAR(50) UNIQUE NOT NULL,
  discount_type  VARCHAR(20) NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_value NUMERIC(10,2) DEFAULT 0,
  max_uses       INTEGER,
  used_count     INTEGER DEFAULT 0,
  expires_at     TIMESTAMP,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMP DEFAULT NOW()
);

COMMIT;
