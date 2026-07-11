# Operations Runbook

Tài liệu này cung cấp các thông tin liên quan đến quy trình kỹ thuật, cấu hình và triển khai dự án cho đội ngũ kỹ sư vận hành (DevOps/SRE).

## 1. Production URLs
- **Public Home:** `/`
- **Catalog Desembre:** `/desembre`
- **Catalog Dermagarden:** `/dermagarden`
- **Admin Login:** `/admin/login`
- **Admin Dashboard:** `/admin/dashboard`

## 2. Vercel Deploy Flow (Quy trình triển khai tự động)
Hệ thống CI/CD được thiết lập qua Vercel.
- **Push lên nhánh `main`:** Tự động kích hoạt quá trình build & deploy trên Vercel.
- **Kiểm tra Logs:** Giám sát Vercel Deployments để theo dõi Logs quá trình Build (Typecheck, Lint).
- **Smoke test sau deploy:** Sau khi Vercel báo "Ready", kỹ sư có trách nhiệm F5 truy cập lại Production URLs để chắc chắn trang load bình thường.

## 3. Supabase Edge Functions Deploy
Hệ thống sử dụng Edge Functions để xử lý logic nhạy cảm thay vì Frontend viết trực tiếp vào DB.
Danh sách các Function cốt lõi:
- `save-product-override`: Function chính chuyên trách thao tác CRUD cho sản phẩm (Thêm/Sửa/Ẩn/Hiện).
- `save-product-order`: Function xử lý cập nhật vị trí ưu tiên/reorder của danh sách sản phẩm.

**Lệnh Deploy Edge Function (Thủ công nếu có sửa đổi):**
```bash
npx supabase functions deploy save-product-override
npx supabase functions deploy save-product-order
```

## 4. Environment Variables (Biến môi trường)
**Môi trường Frontend (Tạo trên Vercel settings):**
- `VITE_SUPABASE_URL`: Đường dẫn kết nối API Supabase.
- `VITE_SUPABASE_ANON_KEY`: Khóa ẩn danh an toàn dùng cho SDK Public.

**Môi trường Supabase Edge (Tạo trên Supabase Secrets):**
- `SUPABASE_URL`: Tái sử dụng URL kết nối.
- `SUPABASE_SERVICE_ROLE_KEY`: Khóa Service Role có quyền cao nhất để ghi vào DB (KHÔNG BAO GIỜ lưu khóa này tại Frontend hoặc Vercel).
- `SUPABASE_ANON_KEY` (Tùy chọn nếu dùng).

## 5. Storage Buckets (Lưu trữ tệp tin)
Kiến trúc Object Storage gồm 2 buckets chính:
- **`product-images`**: Dành riêng cho ảnh đại diện sản phẩm lúc thêm/sửa sản phẩm.
- **`site-assets`**: Dành riêng cho Thư viện Media, Banner, Logo, SEO images.
- **Quy tắc bảo mật (Harden):** Chặn tải lên các tệp mã độc (VD: không upload `.svg` vì có thể nhúng XSS script).

## 6. Known Technical Notes (Kiến trúc kỹ thuật)
- **Product upload:** Thay vì dùng SDK `supabase.storage.from`, upload ảnh trong Form Sản phẩm dùng cơ chế `raw fetch` REST API thuần túy, tránh bị treo `navigator.locks` ở Client.
- **Save Override:** Giao tiếp từ UI tới Backend thông qua raw REST API Fetch (gọi `/functions/v1/save-product-override`), gửi kèm Token vào Header thay vì dùng SDK Invoke dễ lỗi Session.
- **Dashboard Refresh:** Danh sách Product Table dùng raw fetch `fetchProducts` với Header `Cache-Control: no-store` để chống Stale cache cục bộ.
- **Media Library Upload:** Tạm thời vẫn sử dụng Supabase SDK. Nếu sau này vận hành gặp hiện tượng Timeout, đề xuất Migrate module này qua raw fetch tương tự Product Form.
