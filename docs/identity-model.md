# Danh sách công bố - Identity Model & Database Constraints

Hệ thống sử dụng mô hình danh tính (identity model) kết hợp giữa UUID (làm khoá chính) và Legacy No (để hỗ trợ tra cứu/back-up).

## 1. product_overrides
- **`id`**: UUID primary key. Đây là định danh duy nhất (canonical identity) và là **mutation target** duy nhất khi thực hiện các thao tác thêm, sửa, xoá, hoặc reorder.
- **`no`**: **Đã bị drop vật lý** ở Round 7B-2 (không còn tồn tại trong schema của bảng `product_overrides`). Không bao giờ dùng `no` làm trường để truy vấn hay update/upsert.

## 2. product_identities (View/Table)
- **`id`**: Canonical product identity, luôn match 1-1 với `product_overrides.id`.
- **`legacy_no`**: Giữ lại nhằm mục đích audit, backup, và debug từ hệ thống cũ. Không dùng làm định danh để mutate dữ liệu.

## 3. Hiển thị (UI)
- **`displayNo` / `displayIndex`**: Là số thứ tự chỉ dùng để hiển thị trên UI. Số này được tính toán động (runtime) trên Client thông qua hàm gom nhóm `buildProductDisplayRows`, hoàn toàn không liên quan đến cơ sở dữ liệu.
- **Cấm**: Tuyệt đối không dùng `row_number` trong SQL hay `displayNo` làm identity cho các hành động mutate/edit.

## 4. Sao lưu dữ liệu (Backup)
- Bảng **`product_overrides_legacy_no_backup`**: Là bảng lưu trữ cấu hình `no` nguyên bản từ hệ thống cũ trước khi drop. Bảng này **chưa bị xóa** và vẫn được giữ lại để phòng trường hợp cần tra cứu lại các dữ liệu legacy.

---
**Lịch sử thay đổi:**
- *Round 7B-2*: Tiến hành drop cột `product_overrides.no` một cách an toàn. Mọi API, UI và Trigger đều được thiết kế lại để không phụ thuộc vào `no`.
