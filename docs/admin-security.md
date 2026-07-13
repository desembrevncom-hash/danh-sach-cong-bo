# Danh sách công bố - Admin Security & Authorization

Tài liệu này ghi lại cơ chế phân quyền và bảo mật dành cho tính năng Quản trị viên (Admin) của hệ thống. 

## 1. Cơ chế xác thực (Authentication)
- Toàn bộ tính năng Admin đã được chuyển sang sử dụng hệ thống **Supabase Auth** thay vì hệ thống mật khẩu tạm thời. 
- Admin đăng nhập qua email và mật khẩu được cung cấp bởi Supabase. Tuyệt đối không nhắc tới hay sử dụng "đăng nhập bằng mật khẩu edit key".

## 2. Phân quyền và Vai trò (Authorization / Roles)
- Vai trò của user được quản lý bằng bảng `public.profiles`. Chỉ những account được gán role admin mới có quyền thực thi thay đổi.
- **Bảo mật tại Edge Functions**: Mọi request tới API (Edge Functions) để thay đổi dữ liệu (như thêm/sửa/xoá/đổi thứ tự) đều sẽ kiểm tra đồng thời:
  1. JWT hợp lệ.
  2. Role Admin trong DB hoặc Claims.

## 3. Các thành phần đã bị loại bỏ (Deprecated)
Để đảm bảo an toàn và làm sạch dự án, các biến số và cơ chế cũ dưới đây **đã bị loại bỏ hoàn toàn**, không được phép sử dụng lại trong code:
- Không còn sử dụng biến môi trường `VITE_EDIT_PASSWORD`.
- Không còn sử dụng biến `EDIT_PASSWORD` ở các backend functions.
- Cơ chế `ALLOW_LEGACY_EDIT_KEY` đã bị huỷ bỏ.
- Endpoint/RPC `verify-edit-key` đã bị đánh dấu **deprecated/410** và không còn hoạt động.
