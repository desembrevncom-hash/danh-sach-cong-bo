# Hướng dẫn xử lý sự cố (Incident Response Guide)

Tài liệu này dùng để chẩn đoán và khắc phục nhanh các sự cố phát sinh trên hệ thống. Khi báo lỗi, hãy bật DevTools (F12) chuyển sang tab Network để thu thập logs.

## 1. Nếu Admin không đăng nhập được
**Các điểm cần kiểm tra (Checklist):**
- Tài khoản người dùng (Email) có tồn tại bên trong hệ thống Supabase Auth (Authentication) chưa.
- Trong bảng `profiles`, `user_id` có trỏ đúng vào Auth UID hay không.
- Bảng `profiles` bắt buộc cột `role` = `admin`.
- JWT Token bị hết hạn, hãy thử Clear Cache trình duyệt hoặc đăng nhập bằng thẻ Ẩn danh.

**SQL Gợi ý:**
```sql
select u.email, p.role
from auth.users u
join public.profiles p on p.user_id = u.id
where u.email = '...';
```

## 2. Nếu Thêm Sản phẩm bị lỗi (Request fail)
Hãy xem Logs tại tab Network:
- POST `/storage/v1/object/product-images` (Upload ảnh).
- POST `/functions/v1/save-product-override` (Lưu thông tin).
- GET `/rest/v1/product_overrides` (Refresh data).

**Phân nhánh giải quyết theo Status Code:**
- **Storage `401`/`403`:** Token bị lỗi hoặc sai Policy ở Storage.
- **Storage `409`:** Bị trùng tên tệp (Path conflict).
- **Function `401`:** Hết Session đăng nhập, Token hết hạn.
- **Function `403`:** Tài khoản hiện tại không mang role admin.
- **Function `409`:** Lỗi Duplicate Identity, Edge Function kiệt sức vì trùng `legacy_no` quá nhiều vòng lặp.
- **Function `500`:** Bị lỗi nội bộ Server. Hãy đăng nhập Supabase Dashboard -> Edge Functions -> save-product-override -> Logs để truy nguyên chi tiết.

## 3. Nếu Sản phẩm đã lưu nhưng UI chưa xuất hiện/thay đổi
Trường hợp này khả năng là lỗi liên quan tới State/Cache nội bộ Frontend.
**Các điểm cần kiểm tra (Checklist):**
- Theo dõi API fetch `/rest/v1/product_overrides` trên tab Network xem DB đã trả về mảng dữ liệu có dòng mới chưa.
- Kiểm tra tính chất `Cache-Control: no-store` trong Request Headers xem có bị trình duyệt lạm dụng Cache không.
- Bấm F5 Tải lại trang toàn bộ (Hard Reload).
- Vào Database Postgres chạy SQL kiểm tra row có bị giấu hay thực sự chưa ghi vào DB.

## 4. Nếu Trang Public Catalog không hiện sản phẩm
Các khách hàng không thể nhìn thấy sản phẩm ngoài giao diện `/desembre` hoặc `/dermagarden`.
**Các điểm cần kiểm tra (Checklist):**
- Cột `deleted` trong bảng `product_overrides` có đang bằng `true` không (Trạng thái ĐÃ ẨN).
- Tên Brand gán trên sản phẩm có khớp với URL đang truy cập không.
- Nhóm của sản phẩm (Section) có bị cấu hình sai sót không.
- Hàm gọi `search_products_catalog` (RPC) có đếm được số lượng tổng của Catalog không.
- Nếu logic Public yêu cầu Nhóm (Section) đó phải hiển thị (`active = true`), cần check bảng `catalog_sections`.

## 5. Nếu Upload ảnh bị lỗi (Không lên %)
**Các điểm cần kiểm tra (Checklist):**
- Kiểm tra bucket Storage `product-images` trên Supabase xem có tồn tại không.
- Supabase Storage RLS Policies có cho phép Upload file mới không.
- Định dạng (Mime-type) hoặc kích thước tập tin vượt giới hạn (File type/size limit).
- Network / Kết nối internet bị ngắt nghẽn.

## 6. Nếu SEO / Logo không đổi sau khi lưu
**Các điểm cần kiểm tra (Checklist):**
- Dữ liệu ở 2 bảng `site_settings` (Logo/Design) và `seo_pages` (Meta SEO) đã ghi nhận thay đổi mới nhất chưa.
- Browser Cache: Các trình duyệt Web lưu trữ rất mạnh hình ảnh / Favicon. Khắc phục bằng cách xem ở chế độ Ẩn danh (Incognito) hoặc xóa Cache bằng phím `Ctrl + Shift + R`.
