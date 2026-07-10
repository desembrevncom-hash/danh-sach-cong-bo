# Product Identity Model

Tài liệu này mô tả mô hình định danh (Identity Model) của sản phẩm trong hệ thống `danh-sach-cong-bo`.

## Bối cảnh & Lịch sử
Trong các phiên bản trước, hệ thống sử dụng một số nguyên `no` (ví dụ: `1, 2, 3... 1001`) làm khoá chính (Primary Key) cho các bản ghi trong bảng `product_overrides`. Các sản phẩm có sẵn (base products) có `no` tương ứng với ID gốc, trong khi các sản phẩm tùy chỉnh (custom products) tự tạo sẽ có `no >= 1000`.

Tuy nhiên, mô hình này gây ra nhiều vấn đề:
1. Thiếu ổn định khi danh sách sản phẩm cơ sở thay đổi.
2. Dễ xảy ra xung đột `no` khi quản trị viên tạo mới sản phẩm.
3. Phụ thuộc lớn vào việc Frontend tự tạo ID giả (ví dụ: `Date.now()`) trước khi lưu.

## Mô hình Identity Hiện tại (Round 6)
Để giải quyết các vấn đề trên, hệ thống đã chuyển sang sử dụng **UUID** (`id`) làm định danh chính. Cột `no` cũ được giữ lại với vai trò `legacyNo` nhằm đảm bảo khả năng tương thích ngược và phục vụ cho mục đích debug/rollback, nhưng không còn được sử dụng làm identity logic trên Frontend.

### 1. Database
- **`product_overrides.id`**: Khoá chính (Primary Key) thực sự, kiểu `UUID`. Mọi liên kết và cập nhật đều dùng trường này.
- **`product_overrides.no`**: Cột nguyên bản (Integer). Không còn đóng vai trò khoá chính trong ứng dụng, nhưng vẫn tồn tại trên database như một Compatibility Boundary (sẽ bị loại bỏ ở Round 7).
- **`product_identities`**: Bảng ánh xạ giúp gán UUID ổn định cho từng sản phẩm thật dựa trên thuộc tính `brand` + `legacy_no` cũ, đảm bảo mọi truy vấn đều có UUID hợp lệ.

### 2. Edge Functions (API)
- Frontend gửi các yêu cầu tạo/sửa/xoá thông qua Edge Functions (ví dụ: `save-product-override`, `save-product-order`).
- Các hàm này nhận tham số là `productId` (kiểu chuỗi UUID).
- Trong các mutation, hàm sẽ tự tra cứu `legacy_no` từ `product_identities` nếu cần tương tác với cấu trúc cũ, nhưng chủ yếu sử dụng `id` để thao tác trực tiếp với `product_overrides`.

### 3. Frontend Domain Model
Trong TypeScript, mô hình sản phẩm (`ProductViewModel` và `ProductOverrideRow`) đã được chuẩn hóa:

```typescript
type ProductViewModel = {
  id: string;              // Khoá chính, dạng UUID
  displayNo: number;       // Số nguyên dùng để hiển thị hoặc sắp xếp UI (thay thế chức năng hiển thị của `no` cũ)
  name: string;
  // ...các thuộc tính khác
};

type ProductOverrideRow = {
  id: string;              // Khoá chính
  legacyNo?: number;       // Giá trị của cột `no` cũ trên DB (tương thích)
  name: string | null;
  // ...các thuộc tính khác
};
```

## Các quy tắc quan trọng
1. **Frontend không được phép tự tạo số `no` mới.** Nếu cần tạo mới, Edge Function/Backend sẽ sử dụng UUID, và gán một `legacy_no` mặc định (`0`) nếu cần thiết để đáp ứng schema cũ.
2. **UI luôn ưu tiên dùng `id`.** Các state như `snapshot`, `overrides map` (`Record<string, Product>`), và tham số truyền cho các hàm xóa/sửa/đổi thứ tự đều phải dùng chuỗi UUID.
3. **Hiển thị bằng `displayNo`.** Nếu cần hiển thị số thự tự, hoặc tham chiếu số cho quản trị viên, dùng `displayNo` (hoặc `legacyNo` nếu thích hợp), nhưng không dùng nó làm khóa chính trong logic code.

## Legacy boundary rule

Trong giai đoạn trước khi drop `product_overrides.no`, backend có thể ghi `no`, nhưng `no` phải luôn lấy từ `product_identities.legacy_no`.

Không bao giờ dùng dummy value như `0`, `-1`, timestamp, row_number, hoặc display number.

## Canonical identity alignment

`product_identities.id` là canonical product ID.

`product_overrides.id` phải luôn bằng `product_identities.id` cho cùng `(brand, legacy_no)`.

Trong giai đoạn legacy, `product_overrides.no` vẫn tồn tại nhưng chỉ là bridge vật lý cũ. Mutation target luôn là UUID `id`.

## Định hướng tương lai (Round 7)
Trong bước cuối cùng (Round 7), cột `no` sẽ bị xóa bỏ hoàn toàn khỏi bảng `product_overrides` trên Supabase. Lúc này, hệ thống sẽ trở nên thuần túy dùng UUID, dứt điểm mọi tàn dư của `no`.
