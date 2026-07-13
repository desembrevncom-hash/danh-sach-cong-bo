# Release Checklist

Checklist này cần được hoàn thành trước mỗi lần deploy lên production.
Đánh dấu `[x]` vào từng mục khi đã xác nhận.

---

## 1. Local Verification

Chạy toàn bộ lệnh dưới đây và đảm bảo **không có lỗi**:

```bash
npm install        # Cài đúng dependencies theo package-lock.json
npm run lint       # Kiểm tra ESLint (chấp nhận warnings, không chấp nhận errors)
npm run test       # Vitest — phải pass 100%
npm run build      # Vite build production — phải thành công
npm run dev        # Kiểm tra app chạy trên http://localhost:8080
```

- [ ] `npm install` — không có peer dependency error nghiêm trọng
- [ ] `npm run lint` — không có error (warning có thể bỏ qua)
- [ ] `npm run test` — tất cả tests pass
- [ ] `npm run build` — build thành công, output trong `dist/`
- [ ] `npm run dev` — app tải đúng trên localhost

---

## 2. Environment Variables

### Frontend (`.env`)

| Biến | Kiểm tra |
|---|---|
| `VITE_SUPABASE_URL` | Đúng project URL dạng `https://xxxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Là anon/publishable key, **không** phải service role key |

- [ ] `.env` tồn tại và có đủ 2 biến
- [ ] `.env` **không** bị commit lên git (`git status` không thấy `.env`)
- [ ] Giá trị trỏ đúng vào project production (không phải project dev/staging)

### Supabase Edge Functions (Dashboard → Settings → Secrets)

| Biến | Mô tả |
|---|---|
| `EDIT_PASSWORD` | Mật khẩu admin — đủ mạnh, không phải giá trị mặc định |
| `SUPABASE_URL` | Tự động inject bởi Supabase runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | Tự động inject bởi Supabase runtime |
| `ALLOWED_ORIGINS` | Danh sách domain cho phép, cách nhau dấu phẩy |

- [ ] `EDIT_PASSWORD` đã được set, không để trống
- [ ] `ALLOWED_ORIGINS` bao gồm domain production (ví dụ: `https://www.desembrevn.com`)
- [ ] `ALLOWED_ORIGINS` **không** chứa `*` ở production

---

## 3. Supabase Verification

### Database

- [ ] Bảng `product_overrides` tồn tại với đủ các cột:
  `no`, `image_url`, `link_url`, `section`, `name`, `desc`, `deleted`, `is_custom`, `updated_at`
- [ ] Row Level Security (RLS) đã bật trên `product_overrides`
- [ ] Policy "Public can read product overrides" (`SELECT` cho anon) đã tồn tại
- [ ] **Không có** policy `INSERT`/`UPDATE`/`DELETE` nào cho anon role

### Storage

- [ ] Bucket `product-images` tồn tại và là **public**
- [ ] Policy "Public can view product images" (`SELECT`) đã tồn tại

### Edge Functions

- [ ] `verify-edit-key` đã deploy và ở trạng thái Active
- [ ] `save-product-override` đã deploy và ở trạng thái Active
- [ ] Cả hai functions đã được set đúng secrets (`EDIT_PASSWORD`, `ALLOWED_ORIGINS`)
- [ ] CORS preflight (`OPTIONS`) trả về `200` với đúng `Access-Control-Allow-Origin`

### Security

- [ ] Service role key (`sb_secret_*` / `SUPABASE_SERVICE_ROLE_KEY`) **không** xuất hiện trong frontend bundle
  ```bash
  # Kiểm tra nhanh
  grep -r "sb_secret" dist/
  # Kết quả phải trống
  ```
- [ ] `EDIT_PASSWORD` **không** xuất hiện trong frontend bundle hoặc Edge Function response

---

## 4. Manual QA

Thực hiện trên **production domain** (hoặc localhost nếu chưa có production):

### Viewing

- [ ] Trang catalog tải đúng — danh sách sản phẩm hiển thị
- [ ] Ảnh sản phẩm (nếu có override) hiển thị đúng
- [ ] Link sản phẩm (nếu có override) hoạt động

### Search & Filter

- [ ] Tìm kiếm theo tên — kết quả đúng
- [ ] Filter theo nhóm (section) — kết quả đúng
- [ ] Kết hợp search + filter — kết quả đúng
- [ ] Nút "Đặt lại" xoá filter và search

### Export PDF

- [ ] Nhấn "Xuất PDF" → file PDF tải về
- [ ] PDF chứa đúng danh sách sản phẩm theo filter hiện tại

### Unlock Edit Mode

- [ ] Nhấn 🔒 → dialog nhập KEY xuất hiện
- [ ] Nhập KEY đúng → mở khoá thành công, các nút chỉnh sửa xuất hiện
- [ ] Nhập KEY sai → thông báo lỗi chung chung (không lộ thông tin)
- [ ] Nhập KEY sai **5 lần liên tiếp trong 60 giây** → bị chặn (HTTP 429 hoặc delay)
- [ ] Nhấn 🔓 (đang mở) → khoá lại, ẩn các nút chỉnh sửa

### Add / Edit / Delete Product

> Cần mở khoá trước.

- [ ] Thêm sản phẩm mới → xuất hiện trong catalog
- [ ] Sửa tên/mô tả/nhóm → lưu thành công, hiển thị đúng
- [ ] Đổi số thứ tự (No) → sản phẩm re-sort đúng
- [ ] Xoá sản phẩm base → sản phẩm ẩn khỏi catalog (soft delete)
- [ ] Xoá sản phẩm custom → xoá hoàn toàn khỏi database (hard delete)
- [ ] Reload page → data vẫn đúng (overrides được persist)

### Set Image / Link

- [ ] Upload ảnh từ máy → ảnh hiển thị sau khi lưu
- [ ] Nhập URL ảnh → ảnh hiển thị sau khi lưu
- [ ] Nhập URL link → link hoạt động
- [ ] Xoá ảnh → hiển thị về ảnh mặc định

### Rename Section

- [ ] Đổi tên nhóm → tất cả sản phẩm trong nhóm cập nhật đúng
- [ ] Nhóm mới xuất hiện trong dropdown filter

### History / Undo

- [ ] Sau thao tác chỉnh sửa → có thể hoàn tác (Undo)
- [ ] Sau hoàn tác → data trở về trạng thái trước

### Responsive

- [ ] Desktop (≥1024px) — bảng hiển thị đúng
- [ ] Tablet (768–1023px) — layout không bị vỡ
- [ ] Mobile (≤767px) — card list hiển thị đúng, không bị tràn ngang

---

## 5. Security Checklist

- [ ] File `.env` không bị commit (`git log --all -- .env` trả về trống)
- [ ] `.env.example` đã được commit và không chứa giá trị thật
- [ ] Service role key không có trong source code hay bundle
- [ ] `EDIT_PASSWORD` không bị hardcode trong bất kỳ file source nào
- [ ] Edge Function `verify-edit-key` không log password vào console/server log
- [ ] CORS allowlist không dùng `*` ở production
- [ ] Response khi sai password là thông báo chung chung (`Unauthorized`), không lộ chi tiết
- [ ] Rate limit `verify-edit-key` hoạt động: > 5 lần sai / 60s / IP → bị chặn
- [ ] Payload validation từ chối request thiếu field bắt buộc (trả `400`)

---

## 6. Deployment Checklist

### Trước khi deploy

- [ ] Tag git commit hiện tại:
  ```bash
  git tag v<version> -m "Release v<version>"
  git push origin v<version>
  ```
- [ ] Backup bảng `product_overrides` (Supabase Dashboard → Table Editor → Export CSV)

### Deploy Frontend

- [ ] `npm run build` pass
- [ ] Upload `dist/` lên hosting (Vercel / Netlify / Cloudflare Pages)
- [ ] Kiểm tra deployment URL hoạt động

### Deploy Edge Functions

```bash
npx supabase functions deploy verify-edit-key --project-ref <project-ref>
npx supabase functions deploy save-product-override --project-ref <project-ref>
```

- [ ] `verify-edit-key` deploy thành công
- [ ] `save-product-override` deploy thành công
- [ ] Secrets đã được cập nhật nếu có thay đổi

### Kiểm tra sau deploy

- [ ] Production domain load đúng catalog
- [ ] Unlock edit mode hoạt động trên production
- [ ] Add / Edit / Delete sản phẩm trên production
- [ ] Export PDF trên production
- [ ] CORS không bị lỗi trên production domain (không có lỗi `Access-Control-Allow-Origin` trong console)

---

## 7. Rollback Plan

### Frontend

Mỗi lần deploy frontend nên được tag trong git. Để rollback:

```bash
# Checkout tag cũ
git checkout v<previous-version>
npm install && npm run build

# Re-deploy dist/ lên hosting
# Hoặc dùng Vercel/Netlify instant rollback qua dashboard
```

- [ ] Git tag của bản trước đã được ghi nhận: `v__________`
- [ ] Biết cách rollback trên hosting đang dùng (Vercel: Deployments → Promote)

### Edge Functions

```bash
# Redeploy từ tag cũ
git checkout v<previous-version>
npx supabase functions deploy verify-edit-key --project-ref <project-ref>
npx supabase functions deploy save-product-override --project-ref <project-ref>
```

- [ ] Có thể redeploy Edge Functions từ git tag cũ trong vòng < 5 phút

### Database

Supabase không có tự động rollback migration. Trước mỗi thay đổi schema lớn:

```sql
-- Backup thủ công: chạy trong SQL Editor
COPY product_overrides TO STDOUT WITH CSV HEADER;
```

Hoặc dùng **Supabase Dashboard → Table Editor → Export CSV**.

- [ ] CSV backup `product_overrides` đã được lưu trước khi deploy
- [ ] Biết cách restore từ CSV nếu cần:
  ```sql
  -- Restore (xoá data cũ trước nếu cần)
  TRUNCATE product_overrides;
  -- Import lại qua Dashboard → Table Editor → Import CSV
  ```

---

*Checklist này nên được review và cập nhật sau mỗi lần thêm tính năng mới.*
