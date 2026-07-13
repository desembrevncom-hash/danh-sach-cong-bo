# Release Notes v1.0.0 (Release Candidate)
**Date:** 2026-07-11

Bản phát hành này đánh dấu trạng thái Release Candidate (RC) của hệ thống Tra cứu công bố sản phẩm, tập trung vào sự ổn định, tối ưu hóa giao diện và trải nghiệm quản trị (Admin Dashboard).

## 🚀 Public Changes (Giao diện người dùng)
- **Redesign Trang chủ**: Nâng cấp giao diện trang chủ sang trọng hơn với Hero Banner, Brand Cards và section "Quy trình tra cứu 3 bước" (ELEVATE YOUR DAILY RITUAL).
- **Brand Navigation Header**: Header được thiết kế lại gọn gàng, hiển thị 3 logo thương hiệu (Desembre, HYUNJIN, Dermagarden) phân bổ đều, tự động scale nhẹ logo tương ứng với route đang kích hoạt.
- **Tính năng tra cứu**: Bộ tìm kiếm (Search), phân loại theo nhóm (Section filter) và xuất PDF hoạt động mượt mà, chính xác.
- **Tối ưu hình ảnh**: Tất cả hình ảnh sản phẩm được gắn cờ `loading="lazy"` và `decoding="async"`, tích hợp SVG placeholder an toàn khi ảnh gốc bị lỗi.

## 🛠 Admin Changes (Trang quản trị)
- **Loading Stability & Async Hardening**:
  - Áp dụng kỹ thuật Request ID Tracking chống lỗi "Race Condition" khi người dùng chuyển qua lại các Tab quá nhanh.
  - Bọc giới hạn thời gian (Timeout) cho các thao tác gọi dữ liệu từ Supabase (khoảng 8-12 giây), loại bỏ tình trạng Infinite Spinner.
  - Bổ sung `DashboardErrorState` - giao diện báo lỗi chuyên nghiệp với nút "Thử lại", cho phép Retry nhẹ nhàng trên từng Tab thay vì phải tải lại cả trang.
- **Tính năng cốt lõi**:
  - Quản lý danh sách sản phẩm, ẩn/khôi phục (soft delete) và đổi tên/vị trí.
  - Quản lý nhóm (Section Management) hỗ trợ tạo fallback thông minh từ sản phẩm.

## ⚙️ SEO & Media Changes
- **SEO Manager**: Cung cấp công cụ quản trị Meta Tags (Title, Description, Canonical), Open Graph, Robots và Schema.js cho 3 Route chính (`/`, `/desembre`, `/dermagarden`).
- **Media Library**: Quản lý hình ảnh (Product Image, Brand Logo, Favicon, v.v.), hỗ trợ lọc theo thương hiệu và phân loại.
- **Static files**: `robots.txt` đã cấu hình chặn `/admin/`, `sitemap.xml` chuẩn SEO chứa 3 URL public.

## 🔒 Security Changes
- Loại bỏ hoàn toàn sự phụ thuộc vào `VITE_EDIT_PASSWORD`.
- Không expose `service_role` key trên frontend. Tách biệt việc cấp quyền: Frontend gửi Bearer JWT, Edge Functions ở backend kiểm tra đối chiếu với bảng `profiles` (`role === 'admin'`).

## ⚠️ Known Limitations (Hạn chế hiện tại)
1. **SEO Meta**: Các thẻ Meta hiện đang được xử lý thông qua Client-side SPA (React Helmet / Component), chưa được pre-render (SSR/SSG). Bots không chạy JS có thể chưa bắt được thay đổi ngay.
2. **Export PDF**: Tính năng xuất PDF hiện tại chỉ xuất danh sách các sản phẩm đang hiển thị ở "trang hiện hành" (current page).
3. **Empty State**: Nếu toàn bộ sản phẩm của một thương hiệu (ví dụ Dermagarden) bị ẩn (hidden), trang public của thương hiệu đó sẽ hiển thị trạng thái trống.
4. **Media Soft Delete**: Chức năng xóa ảnh trên Media Library chỉ xóa bản ghi trong Database (Soft Delete), chưa tự động xóa object file vật lý khỏi Supabase Storage.

## ✅ Manual QA Checklist
- [x] Đổi tab nhanh (Admin) 20 lần không bị ghi đè state.
- [x] Test mạng chậm (Slow 3G) kích hoạt đúng timeout & hiển thị nút "Thử lại".
- [x] Public route `/`, `/desembre`, `/dermagarden` load mượt mà.
- [x] Không thể truy cập `/admin/dashboard` nếu chưa đăng nhập.
- [x] `npm run typecheck` & `npm run lint` & `npm run test` (78 tests) đạt 100% Passed.

## ⏪ Rollback Notes
- Nếu gặp lỗi nghiêm trọng về Database, vui lòng restore snapshot từ Supabase Backup (Project Settings > Database > Backups).
- Để Rollback Frontend, revert commit về bản tag ổn định trước đó và redeploy lên Vercel.
