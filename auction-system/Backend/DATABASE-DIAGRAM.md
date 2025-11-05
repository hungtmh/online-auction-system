# 🗄️ Database Schema - Online Auction System

## 📊 Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ONLINE AUCTION SYSTEM                             │
│                          Database Schema Overview                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   auth.users         │ (Supabase Auth)
│──────────────────────│
│ • id (PK)            │
│ • email              │
│ • encrypted_password │
│ • email_confirmed_at │
│ • user_metadata      │
└──────────┬───────────┘
           │
           │ 1:1 (Trigger auto-create)
           ↓
┌──────────────────────┐         ┌──────────────────────┐
│   profiles           │         │  upgrade_requests    │
│──────────────────────│         │──────────────────────│
│ • id (PK, FK)        │←────────│ • id (PK)            │
│ • email              │       1:N│ • user_id (FK)       │
│ • full_name          │         │ • status             │
│ • role (enum)        │         │ • reviewed_by (FK)   │
│ • rating_positive    │         │ • admin_note         │
│ • rating_negative    │         └──────────────────────┘
│ • is_banned          │
└──────────┬───────────┘
           │
           ├─────────────────────────────────────────────────┐
           │                                                 │
           │ 1:N (seller)                                    │ 1:N (bidder)
           ↓                                                 ↓
┌──────────────────────┐         ┌──────────────────────┐         ┌──────────────────────┐
│   products           │         │   watchlist          │         │   bids               │
│──────────────────────│         │──────────────────────│         │──────────────────────│
│ • id (PK)            │←────────│ • id (PK)            │         │ • id (PK)            │
│ • seller_id (FK)     │       1:N│ • user_id (FK)       │    ┌───│ • product_id (FK)    │
│ • category_id (FK)   │         │ • product_id (FK)    │    │   │ • bidder_id (FK)     │
│ • name               │         └──────────────────────┘    │   │ • bid_amount         │
│ • description        │                                     │   │ • max_bid_amount     │
│ • thumbnail_url      │         ┌──────────────────────┐    │   │ • is_auto_bid        │
│ • images (JSONB)     │         │   questions          │    │   │ • is_rejected        │
│ • starting_price     │         │──────────────────────│    │   └──────────────────────┘
│ • step_price         │    ┌────│ • id (PK)            │    │
│ • buy_now_price      │    │    │ • product_id (FK)    │    │ 1:N
│ • current_price      │────┘    │ • asker_id (FK)      │    │
│ • auto_extend        │    1:N  │ • question           │    │
│ • end_time           │         │ • answer             │    │
│ • status (enum)      │         └──────────────────────┘    │
│ • winner_id (FK)     │                                     │
│ • final_price        │         ┌──────────────────────┐    │
│ • bid_count          │         │  rejected_bidders    │    │
│ • view_count         │         │──────────────────────│    │
│ • watchlist_count    │    ┌────│ • id (PK)            │    │
│ • search_vector      │    │    │ • product_id (FK)    │    │
└──────────┬───────────┘    │    │ • bidder_id (FK)     │    │
           │                │    │ • seller_id (FK)     │    │
           │ 1:N            │    │ • reason             │    │
           ↓                │    └──────────────────────┘    │
┌──────────────────────┐    │                                │
│ product_descriptions │    │                                │
│──────────────────────│    └────────────────────────────────┘
│ • id (PK)            │                 1:1 (after auction ends)
│ • product_id (FK)    │                         ↓
│ • description        │         ┌──────────────────────┐
│ • added_at           │         │   orders             │
└──────────────────────┘         │──────────────────────│
                                 │ • id (PK)            │
┌──────────────────────┐         │ • product_id (FK)    │
│   categories         │         │ • seller_id (FK)     │
│──────────────────────│         │ • buyer_id (FK)      │
│ • id (PK)            │         │ • final_price        │
│ • name               │         │ • shipping_address   │
│ • slug               │         │ • status (enum)      │
│ • parent_id (FK)     │←────┐   │ • payment_proof_url  │
│ • is_active          │     │   │ • cancelled_by (FK)  │
└──────────────────────┘     │   └──────────┬───────────┘
           ↑                 │              │
           │                 │              │ 1:N
           │ 2-level         │              ↓
           └─────────────────┘   ┌──────────────────────┐
                                 │   order_chat         │
┌──────────────────────┐         │──────────────────────│
│   ratings            │         │ • id (PK)            │
│──────────────────────│         │ • order_id (FK)      │
│ • id (PK)            │         │ • sender_id (FK)     │
│ • from_user_id (FK)  │         │ • message            │
│ • to_user_id (FK)    │         │ • is_read            │
│ • product_id (FK)    │         └──────────────────────┘
│ • rating (enum)      │
│ • comment            │         ┌──────────────────────┐
└──────────────────────┘         │  system_settings     │
                                 │──────────────────────│
                                 │ • key (PK)           │
                                 │ • value              │
                                 │ • description        │
                                 └──────────────────────┘
```

---

## 📋 Tables Summary

### **1. User Management (3 tables)**
| Table | Description | Key Fields |
|-------|-------------|------------|
| `profiles` | User info (bidder, seller, admin) | role, rating_positive/negative, is_banned |
| `upgrade_requests` | Bidder → Seller upgrade | status, reviewed_by |
| `ratings` | Rating (+1/-1) between users | rating (positive/negative), comment |

### **2. Category Management (1 table)**
| Table | Description | Key Fields |
|-------|-------------|------------|
| `categories` | 2-level categories | parent_id (NULL = level 1) |

### **3. Product & Auction (6 tables)**
| Table | Description | Key Fields |
|-------|-------------|------------|
| `products` | Products for auction | status, end_time, current_price, winner_id |
| `product_descriptions` | Append-only description history | product_id, description, added_at |
| `bids` | Bid history (manual + auto) | bid_amount, max_bid_amount, is_auto_bid |
| `watchlist` | Favorite products | user_id, product_id |
| `rejected_bidders` | Bidders rejected by seller | product_id, bidder_id, reason |
| `questions` | Q&A about products | question, answer |

### **4. Order & Payment (2 tables)**
| Table | Description | Key Fields |
|-------|-------------|------------|
| `orders` | Orders after auction ends | status, final_price, shipping_tracking_number |
| `order_chat` | Chat between buyer & seller | message, is_read |

### **5. System (1 table)**
| Table | Description | Key Fields |
|-------|-------------|------------|
| `system_settings` | System configuration | auto_extend_minutes, min_rating_percentage |

---

## 🔗 Relationships

### **profiles → products**
- **1:N** - Một seller có nhiều products
- **FK**: `products.seller_id → profiles.id`

### **profiles → bids**
- **1:N** - Một bidder có nhiều bids
- **FK**: `bids.bidder_id → profiles.id`

### **products → bids**
- **1:N** - Một product có nhiều bids
- **FK**: `bids.product_id → products.id`

### **products → orders**
- **1:1** - Một product chỉ có 1 order (sau khi kết thúc)
- **FK**: `orders.product_id → products.id`

### **categories (self-reference)**
- **1:N** - Parent category → Child categories
- **FK**: `categories.parent_id → categories.id`

---

## ⚡ Triggers

| Trigger | Table | Purpose |
|---------|-------|---------|
| `on_auth_user_created` | auth.users | Tự động tạo profile khi đăng ký |
| `*_updated_at` | profiles, products, orders | Tự động cập nhật updated_at |
| `update_user_rating` | ratings | Tự động +1 rating_positive/negative |
| `update_bid_count` | bids | Tự động tăng bid_count & current_price |
| `update_watchlist_count` | watchlist | Tự động +1/-1 watchlist_count |
| `update_product_search_vector` | products | Tự động cập nhật full-text search |

---

## 🔍 Indexes

### **Performance indexes:**
- `products.seller_id`, `products.category_id`, `products.status`
- `products.end_time` (cho top sắp kết thúc)
- `bids.product_id`, `bids.bidder_id`
- `products.search_vector` (GIN index cho full-text search)
- `products.name` (GIN trigram index cho fuzzy search)

---

## 📊 ENUMS

```sql
user_role: 'guest', 'bidder', 'seller', 'admin'
product_status: 'pending', 'approved', 'rejected', 'active', 'completed', 'cancelled'
upgrade_request_status: 'pending', 'approved', 'rejected'
order_status: 'pending_payment', 'payment_confirmed', 'shipped', 'delivered', 'completed', 'cancelled'
rating_type: 'positive', 'negative'
```

---

## 🎯 Key Features Support

### **Guest Features (Khải):**
- ✅ Categories 2-level menu
- ✅ Top 5 ending soon: `get_top_ending_soon()`
- ✅ Top 5 most bids: `get_top_most_bids()`
- ✅ Top 5 highest price: `get_top_highest_price()`
- ✅ Full-text search: `products.search_vector`
- ✅ Product listing with pagination

### **Bidder Features (Khoa):**
- ✅ Watchlist: `watchlist` table
- ✅ Bid: `bids` table với auto-bid support
- ✅ Bid history: `bids` với bidder name masked
- ✅ Questions: `questions` table
- ✅ Won products: `products.winner_id`
- ✅ Ratings: `ratings` table

### **Seller Features (Cường):**
- ✅ Add product: `products` table
- ✅ Append description: `product_descriptions` table
- ✅ Reject bidder: `rejected_bidders` table
- ✅ Answer questions: `questions.answer`
- ✅ Ratings: `ratings` table

### **Admin Features (Thắng):**
- ✅ Manage categories: `categories` table
- ✅ Manage products: `products` table
- ✅ Manage users: `profiles` table
- ✅ Approve upgrade: `upgrade_requests` table
- ✅ System settings: `system_settings` table

### **System Features (Hùng):**
- ✅ Mailing: Triggered by bids, questions, orders
- ✅ Auto-bid: `bids.max_bid_amount`, `is_auto_bid`
- ✅ Auto-extend: `products.auto_extend`
- ✅ Order flow: `orders` → `order_chat`
- ✅ Rating system: `ratings` with auto-update trigger

---

## 🚀 How to Use

### **1. Run in Supabase SQL Editor:**
```sql
-- Copy toàn bộ DATABASE-SCHEMA.sql và paste vào SQL Editor
-- Click Run
```

### **2. Verify:**
```sql
-- Kiểm tra tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Kiểm tra triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

### **3. Test:**
```sql
-- Test auto-create profile
-- Đăng ký user mới → Check profiles table

-- Test categories
SELECT * FROM categories WHERE parent_id IS NULL; -- Level 1
SELECT * FROM categories WHERE parent_id IS NOT NULL; -- Level 2
```

---

**🎉 Database ready! Mỗi thành viên có thể bắt đầu code phần của mình!**
