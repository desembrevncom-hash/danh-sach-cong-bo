# Danh sách công bố - Section Taxonomy

Hệ thống quản lý nhóm sản phẩm (Section Taxonomy) cho các thương hiệu (Brand) đã được thiết kế lại để hiển thị linh hoạt theo thời gian thực (Dynamic DB-driven). 

## 1. Cơ chế hoạt động của Section Dropdown
- Danh sách các Section được lấy động trực tiếp từ Database thông qua RPC `public.get_catalog_sections`. 
- Giao diện Client (React) sẽ fetch dữ liệu này thông qua hook khi trang được tải hoặc khi thay đổi cấu hình `activeBrand`. 

### Tham số `include_hidden`:
- **Chế độ Public (Khách vãng lai)**: Lời gọi RPC sẽ sử dụng `include_hidden = false`. Do đó, người dùng thông thường sẽ không bao giờ thấy các Section mà bên trong nó toàn bộ sản phẩm đều bị đánh dấu `deleted = true` (ẩn).
  - *Ví dụ: Nếu toàn bộ sản phẩm Dermagarden bị ẩn, khách vãng lai khi vào trang Dermagarden sẽ chỉ thấy duy nhất option "Tất cả nhóm sản phẩm" trong dropdown.*
- **Chế độ Admin**: Khi truy cập bằng quyền quản trị (đã xác thực bằng JWT), RPC sẽ gọi với `include_hidden = true`. Admin có thể thấy mọi Section kể cả khi mọi sản phẩm trong đó đã bị ẩn, giúp thuận tiện cho việc chỉnh sửa và thêm mới.

## 2. Quản lý Nhãn hiển thị (Label Map)
- Object `SECTION_LABELS` trong `src/config/brands.ts` **chỉ đóng vai trò là một bộ từ điển (label map)** để làm đẹp UI (format hiển thị), nó **không phải** là Source of Truth.
- Nếu một Section mới xuất hiện trong DB mà chưa được định nghĩa trong `SECTION_LABELS`, dropdown vẫn sẽ hoạt động bình thường, và label sẽ tự fallback về chính tên Section đó.

## 3. Fallback Configuration
- Object `BRAND_SECTION_OPTIONS` (config cứng trong `brands.ts`) giờ đây **chỉ đóng vai trò là Fallback dự phòng**.
- Nếu RPC gọi xuống DB bị lỗi (VD: rớt mạng, lỗi server), ứng dụng sẽ tự động tải danh sách này lên để đảm bảo tính năng lọc không bị sụp đổ (crash).

## 4. Cross-Brand Context Switching
- Để ngăn ngừa lỗi hiển thị (kẹt filter) khi chuyển đổi trực tiếp URL giữa các Brand (từ `/desembre` sang `/dermagarden`), hệ thống đã cài đặt cơ chế tự động thiết lập lại state. Khi `activeBrand` thay đổi, `section` luôn được tự động reset về giá trị `ALL_SECTION_VALUE` ("__ALL__").
