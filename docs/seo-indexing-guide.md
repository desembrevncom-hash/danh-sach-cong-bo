# Hướng Dẫn Indexing SEO - Google Search Console

Sau khi hệ thống và nội dung SEO đã được cập nhật ổn định trên môi trường production, bạn cần thực hiện các bước sau để Google cập nhật kết quả tìm kiếm (indexing) một cách nhanh chóng nhất.

## 1. Lưu ý chung về thời gian Crawl/Index

- Sau khi sửa cấu hình SEO (Title, Description, Hình ảnh, Canonical...), Google thường mất từ **vài ngày đến vài tuần** để crawl (thu thập dữ liệu) và index (lập chỉ mục) lại website.
- **Không có bất kỳ bảo đảm nào** từ Google rằng các thay đổi sẽ được cập nhật ngay lập tức.
- Vì các route được inject Meta Tags thông qua JavaScript (`react-helmet-async`), Googlebot vẫn có thể render và thu thập dữ liệu bình thường, nhưng quá trình xử lý có thể chậm hơn so với website render sẵn HTML tĩnh (Static/SSR).

## 2. Các bước Submit trên Google Search Console (GSC)

Truy cập [Google Search Console](https://search.google.com/search-console) và chọn đúng property `https://cong-bo.hjcnt.com.vn/`.

### Bước 2.1: Submit Sitemap (Sơ đồ trang web)
1. Ở menu bên trái, chọn **Sitemaps (Sơ đồ trang web)**.
2. Tại phần "Add a new sitemap", nhập `sitemap.xml`.
3. Bấm **Submit (Gửi)**.
4. Đảm bảo trạng thái hiện "Success (Thành công)". Hệ thống đã được thiết lập sẵn file tại `https://cong-bo.hjcnt.com.vn/sitemap.xml`.

### Bước 2.2: Request Indexing cho các Route quan trọng (URL Inspection)
Để thúc đẩy quá trình ưu tiên crawl lại, hãy thực hiện Request Indexing cho 3 URL cốt lõi sau:
1. `https://cong-bo.hjcnt.com.vn/`
2. `https://cong-bo.hjcnt.com.vn/desembre`
3. `https://cong-bo.hjcnt.com.vn/dermagarden`

**Cách thực hiện:**
- Paste URL vào thanh tìm kiếm trên cùng của GSC (URL Inspection).
- Chờ Google tải kết quả kiểm tra URL hiện tại.
- Bấm vào nút **Request Indexing (Yêu cầu lập chỉ mục)**.
- Đợi 1-2 phút để Google đưa URL vào hàng đợi (priority queue).

## 3. Kiểm tra và Theo dõi

### Page Indexing Report
- Trong menu trái, chọn **Pages (Trang)** hoặc **Indexing (Lập chỉ mục) > Pages**.
- Xem các lỗi hoặc cảnh báo. Nếu có URL bị báo "Crawled - currently not indexed" hoặc "Discovered - currently not indexed", hãy kiên nhẫn chờ thêm hoặc tiếp tục Request Indexing.

### Kiểm tra thực tế bằng toán tử `site:`
- Bạn có thể lên Google Search và gõ:
  `site:cong-bo.hjcnt.com.vn`
- Xem danh sách các URL đang được index và preview title/description hiện tại. Lưu ý rằng kết quả có thể chưa cập nhật ngay.

## 4. Technical Note (Dành cho Dev/Admin)
- **Sitemap tĩnh**: File `sitemap.xml` hiện tại là file tĩnh. Việc thay đổi SEO trong Admin Dashboard *không* tự động đổi thẻ `<lastmod>` trong sitemap vì giới hạn không sử dụng Edge Function. Đối với quy mô catalog nhỏ (vài route chính), điều này không ảnh hưởng nghiêm trọng đến SEO.
- **JS-Injected Meta**: Do sử dụng `react-helmet-async`, source HTML gốc (`view-source:`) sẽ chỉ hiển thị meta mặc định. Googlebot sẽ render JavaScript để đọc được meta chính xác cho `/desembre` và `/dermagarden`. Recommendation future: Nếu SEO gặp trở ngại lớn, cân nhắc áp dụng prerender (SSG/SSR) cho 3 route public.
