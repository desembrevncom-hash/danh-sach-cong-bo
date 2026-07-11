# Hướng Dẫn Sử Dụng Dành Cho Quản Trị Viên (Admin User Guide)

Tài liệu này cung cấp hướng dẫn chi tiết cách vận hành Hệ thống Quản trị Danh mục Công bố Sản phẩm.

## 1. Đăng nhập Admin
- **URL truy cập:** `/admin/login`
- Sử dụng tài khoản đã được phân quyền (role `admin`) thông qua Supabase Auth.
- Nếu không thể truy cập vào Dashboard sau khi đăng nhập thành công, vui lòng yêu cầu bộ phận kỹ thuật kiểm tra lại phân quyền `role` trong bảng `profiles`.

## 2. Quản lý sản phẩm (Thêm mới)
Để thêm một sản phẩm mới vào danh mục:
1. Nhấn nút "Thêm sản phẩm".
2. **Chọn Thương hiệu (Brand):** Desembre hoặc Dermagarden.
3. **Chọn/Tạo nhóm sản phẩm:** Lựa chọn nhóm (section) phù hợp hoặc gõ tên một nhóm mới để hệ thống tự tạo.
4. **Tải ảnh lên (Upload):** Chọn ảnh chất lượng cao. Ảnh sẽ được tự động lưu trữ an toàn trên máy chủ.
5. **Nhập link công bố:** Nhập các đường link liên kết với sản phẩm (nếu có).
6. Nhấn **Lưu sản phẩm** và chờ hệ thống xác nhận.

## 3. Sửa thông tin sản phẩm
Bạn có thể chỉnh sửa trực tiếp trên bảng điều khiển bằng cách nhấn biểu tượng "Sửa" hoặc nhấp chuột vào nội dung cần thay đổi:
- **Tên & Mô tả:** Chỉnh sửa trực tiếp text.
- **Nhóm sản phẩm:** Đổi sang nhóm khác theo danh sách có sẵn.
- **Ảnh:** Nhấp vào ảnh để tải ảnh mới lên thay thế.
- **Link công bố:** Thay đổi hoặc xóa bỏ đường link.

## 4. Ẩn / Hiện sản phẩm (Soft Delete)
- **Ẩn (Hide):** Khi ẩn, sản phẩm sẽ ngay lập tức biến mất khỏi trang Danh mục (Public Catalog) mà khách hàng nhìn thấy. Trong Dashboard, biểu tượng sẽ đổi sang thùng rác vô hiệu hóa và có nhãn "ĐÃ ẨN".
- **Khôi phục (Restore):** Nhấn vào biểu tượng Khôi phục để hiển thị lại sản phẩm ra bên ngoài.
- *Lưu ý:* Hệ thống không cho phép xóa vĩnh viễn (Hard Delete) đối với thao tác hàng ngày để đảm bảo an toàn dữ liệu. Các sản phẩm chỉ ở trạng thái "Ẩn".

## 5. Quản lý nhóm sản phẩm
Nhóm sản phẩm (Section) giúp phân loại sản phẩm.
- **Thêm nhóm mới:** Có thể tạo trực tiếp lúc thêm sản phẩm.
- **Chỉnh sửa tên nhóm (Label):** Thay đổi nhãn hiển thị của nhóm.
- **Sắp xếp thứ tự:** Kéo thả hoặc điền số thứ tự ưu tiên hiển thị.
- **Ẩn/Hiện nhóm:** Có thể vô hiệu hóa toàn bộ nhóm nếu cần thiết (phụ thuộc vào tuỳ chọn UI).

## 6. Thư viện ảnh (Media Library)
- Dành cho việc quản lý các tập tin, hình ảnh chung trên trang (Banner, tài liệu).
- Hỗ trợ tải ảnh mới lên và Sao chép đường dẫn (Copy URL) để dán vào các nơi cần thiết.
- Khuyến cáo **không tải tệp SVG** để bảo vệ bảo mật hệ thống. Sử dụng định dạng PNG, JPG hoặc WebP để tối ưu dung lượng.

## 7. Quản lý SEO (SEO Manager)
Tối ưu hóa công cụ tìm kiếm cho các trang đích:
- **Title & Description:** Tiêu đề và Mô tả xuất hiện trên Google.
- **Canonical URL:** Gắn link gốc chuẩn.
- **OG Image:** Hình ảnh hiển thị khi chia sẻ link qua Facebook, Zalo.
- **Schema JSON:** Khai báo cấu trúc dữ liệu cho Bot Google.
- *Tuyệt đối không bật tùy chọn `noindex` đối với các trang Public (chẳng hạn `/desembre` hoặc `/dermagarden`) trừ phi có chủ đích rõ ràng.*

## 8. Trình quản lý Thiết kế (Design Manager)
- Cho phép đổi Banner, Logo ở Header (Desembre, HYUNJIN, Dermagarden).
- **Quy chuẩn Logo:** Kích thước khuyến nghị 600x180px, định dạng nền trong suốt (PNG/WebP).
- **Ảnh thẻ thương hiệu trang chủ:** Khuyến nghị 1200×700px, PNG/JPG/WebP, dưới 800KB.
- **Banner Hero trang chủ:**
  - Desktop khuyến nghị 2400×1200px, tỉ lệ 2:1, JPG/WebP/PNG, dưới 1.5MB.
  - Mobile khuyến nghị 1200×1600px, tỉ lệ 3:4 hoặc 4:5, dưới 1MB.
  - Tránh đặt chữ/logo sát mép vì có thể bị crop trên mobile.
- Sau khi thực hiện đổi, hãy F5 tải lại trang Public bên ngoài để kiểm tra kết quả.

## 9. Danh mục Công bố (Public Catalog)
Đây là các trang khách hàng xem:
- `/desembre`: Danh mục sản phẩm Desembre.
- `/dermagarden`: Danh mục sản phẩm Dermagarden.
- Chỉ những sản phẩm đang Hoạt động (`deleted=false`) mới được phép hiển thị.

## 10. Xuất tệp PDF (Export PDF)
- Hệ thống hỗ trợ xuất file PDF tương ứng với những sản phẩm đang được hiển thị trên giao diện lúc đó (theo bộ lọc và phân trang hiện hành).
- Việc xuất toàn bộ thư viện (Export All) sẽ là tính năng được mở rộng ở các phiên bản tiếp theo.
