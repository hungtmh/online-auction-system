# Cấu Trúc Dự Án Auction System

## 📁 Cấu Trúc Thư Mục

```
src/
├── App.jsx                 # File điều hướng chính (Router)
├── main.jsx               # Entry point
├── index.css              # Global styles
│
├── pages/                 # Các trang chính của ứng dụng
│   ├── GuestHomePage.jsx       # Trang chủ (khách)
│   ├── DashboardPage.jsx       # Trang dashboard (sau đăng nhập)
│   └── AuctionListPage.jsx     # Trang danh sách đấu giá
│
├── components/            # UI Components cho từng trang
│   ├── GuestHomePage/
│   │   └── GuestHomePageContent.jsx
│   ├── Auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   └── AuctionList/
│       └── AuctionListPageContent.jsx
│
└── lib/
    └── supabase.js        # Supabase client config
```

## 🎯 Nguyên Tắc Tổ Chức

### **pages/**
- Chứa các **trang chính** mà ứng dụng sẽ điều hướng tới
- Mỗi page là một **wrapper** nhẹ nhàng, import component từ `components/`
- Được định nghĩa trong `App.jsx` với React Router

**Ví dụ:**
```jsx
// pages/GuestHomePage.jsx
import GuestHomePageContent from '../components/GuestHomePage/GuestHomePageContent'

function GuestHomePage() {
  return <GuestHomePageContent />
}

export default GuestHomePage
```

### **components/**
- Chứa các **UI components** thực sự
- Được tổ chức theo **tên trang** tương ứng trong `pages/`
- Mỗi thư mục con chứa các components cho 1 trang cụ thể

**Ví dụ:**
```
components/
├── GuestHomePage/         # Components cho GuestHomePage
│   └── GuestHomePageContent.jsx
├── Dashboard/             # Components cho DashboardPage
│   ├── DashboardContent.jsx
│   ├── StatsCard.jsx
│   └── RecentActivity.jsx
└── Auth/                  # Components dùng chung cho auth
    ├── Login.jsx
    └── Register.jsx
```

## 🚀 Thêm Trang Mới

### Bước 1: Tạo Component trong `components/`
```bash
# Tạo thư mục cho page mới
mkdir src/components/MyNewPage

# Tạo component
touch src/components/MyNewPage/MyNewPageContent.jsx
```

### Bước 2: Tạo Page trong `pages/`
```jsx
// pages/MyNewPage.jsx
import MyNewPageContent from '../components/MyNewPage/MyNewPageContent'

function MyNewPage() {
  return <MyNewPageContent />
}

export default MyNewPage
```

### Bước 3: Thêm Route trong `App.jsx`
```jsx
import MyNewPage from './pages/MyNewPage'

// Trong <Routes>
<Route path="/my-new-page" element={<MyNewPage />} />
```

## 📝 Routes Hiện Tại

| Route | Page | Mô tả |
|-------|------|-------|
| `/` | GuestHomePage | Trang chủ (cho khách) |
| `/dashboard` | DashboardPage | Dashboard sau đăng nhập |
| `/auctions` | AuctionListPage | Danh sách sản phẩm đấu giá |
| `*` | 404 | Trang không tồn tại |

## 💡 Lưu Ý

1. **Pages** nên đơn giản, chỉ import và render component
2. **Components** chứa logic và UI thực sự
3. Mỗi page có thư mục riêng trong `components/` để dễ quản lý
4. Components dùng chung (như Auth) có thể đặt trong `components/Shared/` hoặc theo chức năng

## 🔧 Công Nghệ Sử Dụng

- **React 18** - UI Framework
- **React Router DOM** - Routing
- **Tailwind CSS** - Styling
- **Supabase** - Backend & Auth
- **Vite** - Build tool
