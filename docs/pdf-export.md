# Danh sách công bố - PDF Export Behavior

Tài liệu này xác định rõ hành vi và quy tắc xuất file PDF của ứng dụng.

## 1. Hành vi xuất file hiện tại (Current Behavior)
Tính năng xuất file PDF (PDF Export) hiện tại đang hoạt động theo chế độ **Export Current Page Only**. 

- Khi người dùng nhấn nút "Xuất PDF", hệ thống sẽ lấy chính xác danh sách các sản phẩm đang được hiển thị trên **trang hiện tại** của giao diện Web (gồm tối đa 20 sản phẩm/trang tuỳ theo bộ lọc).
- Thứ tự của các sản phẩm trên PDF (cột `NO.`) được đồng bộ hoá 100% (Single Source of Truth) với số thứ tự hiển thị (`displayIndex`) của UI. Do đó, các nhóm sản phẩm (Section) trên PDF sẽ không bị lộn xộn mà được gom nhóm gọn gàng y hệt như những gì người dùng đang nhìn thấy trên màn hình.

## 2. TODO (Future Enhancements)
- Nếu trong tương lai (các Round sau) có yêu cầu nghiệp vụ muốn thay đổi hành vi thành **Export All Visible Products** (Xuất toàn bộ 63+ sản phẩm trong một lần tải PDF thay vì từng trang), chúng ta sẽ cần:
  1. Thay đổi nhãn (Label) của nút "Xuất PDF" trên thanh công cụ thành các lựa chọn cụ thể như "Xuất trang này" / "Xuất toàn bộ".
  2. Implement một hàm fetch ngầm định riêng biệt (background fetch) để tải toàn bộ danh sách `pageSize = totalCount` thay vì dùng danh sách `filteredProducts` của page hiện tại.
  3. Cấp dữ liệu tổng đó qua hook `buildProductDisplayRows` để đảm bảo thứ tự đánh số toàn cục không bị ngắt quãng.

Hiện tại, **hành vi mặc định không được thay đổi**, và người dùng/Admin chỉ mong đợi PDF khớp với những gì đang hiển thị trên Web.
