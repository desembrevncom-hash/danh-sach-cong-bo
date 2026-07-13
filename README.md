# Danh sách công bố — Product Catalog

Ứng dụng web hiển thị và quản lý danh sách sản phẩm Desembre. Catalog có thể xem công khai; chỉnh sửa yêu cầu mở khoá bằng KEY admin.

🌍 **Live Production:** [https://danh-sach-cong-bo.desembre-vn.com](https://danh-sach-cong-bo.desembre-vn.com/)


## Tech Stack

| Lớp | Công nghệ |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| UI | Tailwind CSS, Shadcn UI (Radix UI) |
| Backend / DB | Supabase (PostgreSQL + Storage) |
| Serverless | Supabase Edge Functions (Deno) |
| PDF Export | @react-pdf/renderer |
| Test | Vitest |

## Cấu trúc thư mục

```
src/
├── data/                         # Dữ liệu sản phẩm tĩnh (base list)
├── features/
│   ├── edit-unlock/              # Unlock edit mode (KEY admin)
│   │   ├── components/           # UnlockDialog
│   │   └── hooks/                # useEditUnlock
│   ├── export-pdf/               # Export catalog PDF
│   └── products/
│       ├── components/           # UI components (Table, CardList, Dialog…)
│       ├── hooks/                # useProductActions
│       ├── services/             # productOverrideService (Supabase calls)
│       ├── types.ts              # Shared types
│       └── utils/                # productTransforms (business logic)
├── hooks/                        # useEditHistory (undo/redo)
├── integrations/supabase/        # Supabase client
└── pages/
    └── CatalogPage.tsx           # Root page (state + layout coordinator)

supabase/
├── functions/
│   ├── save-product-order/    # Edge Function: lưu thứ tự sản phẩm (sort_order)
│   ├── save-product-override/    # Edge Function: ghi/xoá override
│   └── verify-edit-key/          # Edge Function: xác thực KEY admin
└── migrations/                   # SQL schema migrations
```

## Cài đặt

```bash
git clone <repo-url>
cd danh-sach-cong-bo-main
npm install
```

## Biến môi trường

Copy file `.env.example` thành `.env` và điền giá trị:

```bash
cp .env.example .env
```

| Biến | Mô tả |
|---|---|
| `VITE_SUPABASE_URL` | Project URL từ Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/Publishable key (safe to expose in browser) |

> **Lưu ý**: Service Role key (`sb_secret_*`) **không được** dùng ở frontend. Chỉ dùng trong Edge Functions qua Supabase secrets.

## Chạy local

```bash
npm run dev
# → http://localhost:8080
```

## Build production

```bash
npm run build
# Output: dist/
```

## Chạy test

```bash
npm run test
```

## Deploy frontend

Bất kỳ static hosting nào đều được (Vercel, Netlify, Cloudflare Pages…):

```bash
npm run build
# Upload thư mục dist/ lên hosting
```

Nếu dùng **Vercel**:
```bash
npx vercel --prod
```

## Deploy Supabase Edge Functions

Cần [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
# Login
npx supabase login

# Deploy từng function (--no-verify-jwt: hàm dùng mật khẩu riêng, không cần JWT Supabase)
npx supabase functions deploy verify-edit-key --no-verify-jwt --project-ref <project-ref>
npx supabase functions deploy save-product-override --no-verify-jwt --project-ref <project-ref>
npx supabase functions deploy save-product-order --no-verify-jwt --project-ref <project-ref>

# Hoặc deploy tất cả một lần:
npx supabase functions deploy --no-verify-jwt --project-ref <project-ref>
```

`<project-ref>` là ID dự án (phần subdomain trong URL Supabase, ví dụ `toytykbimcpkieocozzm`).

### Secrets cho Edge Functions

Vào **Supabase Dashboard → Settings → Edge Functions → Secrets**:

| Key | Mô tả |
|---|---|
| `ALLOWED_ORIGINS` | CORS origins, ví dụ: `https://yourdomain.com,http://localhost:8080` |

## Thiết lập Database

Chạy migrations trong **Supabase Dashboard → SQL Editor**:

```bash
# Hoặc dùng CLI:
npx supabase db push --project-ref <project-ref>
```

## Các flow chính

### Xem catalog
- Mở trang chủ → catalog hiển thị ngay, không cần đăng nhập.
- Dữ liệu gốc được lưu trong `src/data/desembreProducts.ts` (static).
- Overrides (ảnh, link, tên, mô tả tuỳ chỉnh) được đọc từ bảng `product_overrides` trên Supabase.

### Search / Filter
- Thanh tìm kiếm: lọc theo tên sản phẩm.
- Dropdown nhóm: lọc theo section.
- Nút "Đặt lại": xoá filter.

### Unlock edit mode
- Nhấn biểu tượng khoá 🔒 → nhập KEY admin.
- KEY được xác thực qua Edge Function `verify-edit-key`.
- Sau khi mở khoá, các nút chỉnh sửa xuất hiện trên mỗi sản phẩm.

### Thêm / Sửa / Xoá sản phẩm
- Cần mở khoá trước.
- **Thêm**: nút "+ Thêm sản phẩm" → điền form → lưu qua Edge Function.
- **Sửa**: icon bút chì trên sản phẩm → sửa thông tin → lưu.
- **Xoá**: icon thùng rác → xác nhận → lưu (soft delete hoặc hard delete với custom product).
- Hỗ trợ **Undo** (hoàn tác) cho mọi thao tác chỉnh sửa.

### Đặt ảnh / Link
- **Ảnh**: upload từ máy hoặc nhập URL → lưu vào Supabase Storage.
- **Link**: nhập URL sản phẩm (affiliate link…).

### Export PDF
- Nút "Xuất PDF" → tạo file PDF danh sách sản phẩm hiện tại (theo filter đang áp dụng).

## Lưu ý bảo mật

- `.env` đã được thêm vào `.gitignore` — **không commit file này**.
- Service Role key (`sb_secret_*`) chỉ dùng server-side qua Supabase secrets.

## 🔒 Security Architecture (Round 5)
Bảo mật Admin của ứng dụng sử dụng Supabase Auth và Role-Based Access Control:
1. **Supabase Auth**: Admin đăng nhập thông qua email/password được tạo bằng giao diện quản lý của Supabase.
2. **`public.profiles`**: Có role `admin` (mặc định là `viewer`).
3. **Edge Functions**: Các thao tác chỉnh sửa gọi đến Edge Function kèm JWT, backend sẽ xác thực JWT và kiểm tra role `admin` trong bảng `profiles` trước khi cho phép.
- (Lịch sử) **Legacy Fallback**: Trước đây hệ thống hỗ trợ nhập Edit Key bằng mật khẩu trực tiếp qua `VITE_EDIT_PASSWORD` và `EDIT_PASSWORD`. Cơ chế này đã bị loại bỏ hoàn toàn trong Round 5. Tương tự, `verify-edit-key` edge function hiện sẽ trả về `410 Gone`.

## ⚙️ Edge Functions

```bash
# Deploy hàm lưu sản phẩm
npx supabase functions deploy save-product-override --project-ref <project-ref>
npx supabase functions deploy save-product-order --project-ref <project-ref>
```

### Cách cấp quyền Admin:
Sau khi User đăng ký tài khoản trên Supabase, hãy chạy SQL sau trong SQL Editor của Supabase để cấp quyền admin:

```sql
INSERT INTO public.profiles (user_id, role)
VALUES ('<uuid-cua-user>', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```
