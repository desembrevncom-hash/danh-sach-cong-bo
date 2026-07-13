# QA Round 2 — Product Identity/Data Layer

## Public Catalog
- [x] `/desembre` load đúng sản phẩm Desembre.
- [x] `/dermagarden` load đúng sản phẩm Dermagarden.
- [x] Search không đổi brand.
- [x] Filter category không đổi brand.
- [x] Pagination không đổi brand.
- [x] Refresh page không mất brand.

## Admin Inline Edit
- [x] Sửa tên sản phẩm đúng item.
- [x] Sửa mô tả đúng item.
- [x] Set image đúng item.
- [x] Set link đúng item.
- [x] Hide/delete đúng item.
- [x] Reorder đúng item.
- [x] Undo/refresh không làm nhầm brand.

## Regression Risk
- [x] Không còn `id_alias ?? no` ngoài mapper.
- [x] Không dùng `displayNo` làm mutation target.
- [x] Không dùng row number làm React key.
