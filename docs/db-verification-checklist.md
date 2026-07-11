# Database Verification Checklist

Sử dụng các câu lệnh SQL an toàn (Safe SELECT queries) dưới đây để phục vụ cho các đợt kiểm tra sức khỏe của cơ sở dữ liệu định kỳ. Không có câu truy vấn nào ở đây gây nguy hiểm cho dữ liệu.

## 1. Đếm sản phẩm theo thương hiệu (Count by brand)
```sql
select
  brand,
  count(*) as total,
  count(*) filter (where deleted is not true) as visible,
  count(*) filter (where deleted is true) as hidden
from public.product_overrides
group by brand
order by brand;
```

## 2. Tìm kiếm các sản phẩm bị thiếu dữ liệu định danh (Missing identity)
Câu lệnh truy tìm các sản phẩm hiện có ở bảng hiển thị nhưng bị mồ côi (thiếu ID) ở bảng Identity gốc.
*Kết quả kỳ vọng: 0 rows.*
```sql
select
  po.id,
  po.brand,
  po.name
from public.product_overrides po
left join public.product_identities pi on pi.id = po.id
where pi.id is null;
```

## 3. Tìm kiếm ID ảo bị lặp lại (Duplicate legacy_no)
Câu lệnh quét xem hệ thống có bị lỗi sinh mã trùng số thứ tự nội bộ không.
*Kết quả kỳ vọng: 0 rows.*
```sql
select
  brand,
  legacy_no,
  count(*) as duplicate_count
from public.product_identities
group by brand, legacy_no
having count(*) > 1
order by brand, legacy_no;
```

## 4. Cảnh báo nhóm sản phẩm chưa đăng ký (Orphan Product Section)
Kiểm tra xem có bất kỳ Sản phẩm nào được điền một Nhóm (Section) mà Nhóm đó không hề tồn tại trong bảng quản lý cấu hình Nhóm `catalog_sections` hay không.
*Kết quả kỳ vọng: 0 rows.*
```sql
select distinct
  po.brand,
  po.section
from public.product_overrides po
left join public.catalog_sections cs
  on cs.brand = po.brand
 and cs.value = po.section
where po.section is not null
  and po.section <> ''
  and cs.id is null
order by po.brand, po.section;
```

## 5. Bắt các Nhóm sản phẩm lặp lại dữ liệu cấu hình (Duplicate sections)
*Kết quả kỳ vọng: 0 rows.*
```sql
select
  brand,
  value,
  count(*) as duplicate_count
from public.catalog_sections
group by brand, value
having count(*) > 1
order by brand, value;
```

## 6. Lượng dữ liệu Public View hiển thị trên Database
```sql
select
  brand,
  count(*) filter (where deleted is not true) as db_visible
from public.product_overrides
group by brand
order by brand;
```

## 7. Lượng dữ liệu Public View qua cửa ngõ RPC Function
Hàm Store Procedure trả về kết quả Search.
*Kết quả kỳ vọng: `db_visible` (ở Câu 6) = `rpc_visible` (Câu 7) tương ứng với từng brand.*
```sql
select
  'desembre' as brand,
  coalesce(max(total_count), 0) as rpc_visible
from public.search_products_catalog(null, null, 'desembre', 1, 20)

union all

select
  'dermagarden' as brand,
  coalesce(max(total_count), 0) as rpc_visible
from public.search_products_catalog(null, null, 'dermagarden', 1, 20);
```

## 8. Đọc trạng thái Bảng Cấu hình SEO (seo_pages)
```sql
select route_path, title, canonical_url, robots, is_active
from public.seo_pages
order by route_path;
```

## 9. Đọc Bảng Thiết Lập Giao Diện (site_settings)
```sql
select *
from public.site_settings;
```

## 10. Check cài đặt Storage Buckets (Bảo vệ bảo mật file)
Đọc cấu hình chặn Mime type và Giới hạn tệp.
```sql
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('product-images', 'site-assets');
```
