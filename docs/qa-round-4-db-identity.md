# QA Round 4 — DB Identity Migration

## Public Catalog
- [ ] `/desembre` load đúng.
- [ ] `/dermagarden` load đúng.
- [ ] Search đúng.
- [ ] Filter đúng.
- [ ] Pagination đúng.
- [ ] Refresh không đổi brand.

## Admin Mutation
- [ ] Sửa tên đúng sản phẩm.
- [ ] Sửa mô tả đúng sản phẩm.
- [ ] Set image đúng sản phẩm.
- [ ] Set link đúng sản phẩm.
- [ ] Hide/delete đúng sản phẩm.
- [ ] Reorder đúng sản phẩm.
- [ ] Không sửa nhầm sản phẩm có cùng displayNo ở page khác.
- [ ] Không sửa nhầm sản phẩm khác brand.

## Audit
- [ ] `changed_by` được ghi khi admin JWT mutation.
- [ ] Legacy no vẫn còn để trace nếu cần rollback.

## Regression
- [ ] Không còn `toLegacyProductNo` trong frontend service/component.
- [ ] Không còn `id_alias ?? no` ngoài mapper.
- [ ] React key dùng `id` dạng chuỗi UUID.
- [ ] Mutation target dùng `productId`.
