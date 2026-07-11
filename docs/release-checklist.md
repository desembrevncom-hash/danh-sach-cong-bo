# Release Checklist (Kiểm tra trước khi Phát hành)

Đây là danh sách công việc cần đánh dấu `(Tick)` bắt buộc đối với Kỹ sư trước khi thực thi việc ấn nút Phát Hành hoặc Báo cáo hoàn tất Deploy.

## 1. Checklist Trước Khi Deploy (Pre-flight Checks)
- [ ] Lệnh `npm run typecheck` chạy qua (Pass).
- [ ] Lệnh `npm run lint` chạy qua (Hoặc chỉ còn warning an toàn ở các file UI tĩnh).
- [ ] Lệnh `npm run build` chạy qua thành công.
- [ ] Lệnh `npm run test` chạy qua (Nếu dự án cài đặt Vitest).
- [ ] Các sửa đổi Edge Functions đã được đẩy lên Supabase Cloud (`npx supabase functions deploy ...`).
- [ ] Bất kỳ Database Migration mới nào đã được Apply trên Production Database.
- [ ] Env variables tại Vercel đã trỏ đúng vào Supabase Production.
- [ ] Env variables tại Supabase Edge có đủ Service Role Key.
- [ ] Quản trị viên (Role Admin) có thể đăng nhập bình thường ở môi trường Staging/Dev hiện hành.
- [ ] Smoke test sơ bộ các luồng Add / Edit / Hide / Restore sản phẩm (Sử dụng dữ liệu Test).
- [ ] Các trang Public Catalog tải thành công nội dung từ API.
- [ ] Đường dẫn `/robots.txt` và `/sitemap.xml` hoạt động trả file chuẩn.

## 2. Checklist Sau Khi Deploy (Post-deploy Verification)
Sau khi Vercel lên luồng xanh (Success), hãy vào Production URL và tự tay chạy:
- [ ] Truy cập `/` (Home page) không bị trắng trang.
- [ ] Truy cập `/desembre` load đủ Data.
- [ ] Truy cập `/dermagarden` load đủ Data.
- [ ] Đăng nhập thành công vào `/admin/login`.
- [ ] Xem danh sách sản phẩm ở `/admin/dashboard`.
- [ ] Tạo thử 1 sản phẩm **Không Ảnh** -> Báo thành công.
- [ ] Tạo thử 1 sản phẩm **Có Ảnh** -> Báo thành công.
- [ ] Ấn nút **Ẩn** sản phẩm vừa tạo -> Đổi icon rác và làm mờ Row.
- [ ] Bật chế độ Ẩn danh xem trang Public -> Sản phẩm đó không hiển thị (Đúng).
- [ ] Nhấn nút **Khôi phục** sản phẩm đó -> Trở lại icon thường và hết mờ Row.
- [ ] Test tính năng in tài liệu: **Export PDF** tải về được file có nội dung.
- [ ] Test cập nhật SEO: Truy cập tab Quản lý SEO, sửa Meta Title -> Hiện báo Save thành công.
- [ ] Test Thiết kế: Tải 1 ảnh lên làm Logo Header -> Hiện báo thành công. Mở trang public thấy Logo đã đổi.
- [ ] Test Media: Mở Media Library tải 1 file tài liệu -> Thành công, lấy được URL.
