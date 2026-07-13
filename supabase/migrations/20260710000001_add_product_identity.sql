-- 1. Thêm cột identity uuid mới vào product_overrides
ALTER TABLE public.product_overrides
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

-- 2. Backfill uuid cho các row cũ (nếu có)
UPDATE public.product_overrides
SET id = gen_random_uuid()
WHERE id IS NULL;

-- 3. Ràng buộc NOT NULL và Unique Index
ALTER TABLE public.product_overrides
ALTER COLUMN id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS product_overrides_id_key
ON public.product_overrides(id);

-- 4. Thêm product_id vào history log để tracking (nullable để backward compatible với log cũ)
ALTER TABLE public.product_overrides_history
ADD COLUMN IF NOT EXISTS product_id uuid;

-- 5. Cập nhật Trigger Audit Function (nếu cần copy id vào history log)
-- NOTE: Giữ nguyên cột "no" trong audit log để tương thích. Thêm "product_id".
CREATE OR REPLACE FUNCTION public.fn_audit_product_overrides()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.product_overrides_history (no, product_id, action, changed_by, old_data, new_data)
    VALUES (NEW.no, NEW.id, 'INSERT', NEW.changed_by, NULL, row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.product_overrides_history (no, product_id, action, changed_by, old_data, new_data)
    VALUES (NEW.no, NEW.id, 'UPDATE', NEW.changed_by, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.product_overrides_history (no, product_id, action, changed_by, old_data, new_data)
    VALUES (OLD.no, OLD.id, 'DELETE', NULL, row_to_json(OLD), NULL);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. RPC Skeleton: Người dùng hãy đưa logic search_products_catalog thực tế vào đây!
-- Hàm bắt buộc trả về: id (uuid/text), legacy_no (number), display_no (number), brand, section, name, desc, image_url, link_url, link_url_2, sort_order, total_count.

-- CREATE OR REPLACE FUNCTION search_products_catalog(
--   p_brand_id text,
--   p_page integer DEFAULT 1,
--   p_page_size integer DEFAULT 10,
--   p_search_query text DEFAULT ''::text,
--   p_section text DEFAULT 'ALL'::text
-- )
-- RETURNS TABLE (
--   id text,             -- SỬA ĐỔI: Thêm id
--   legacy_no bigint,    -- SỬA ĐỔI: no đổi tên thành legacy_no
--   display_no bigint,   -- SỬA ĐỔI: thêm row_number hiển thị
--   brand text,
--   section text,
--   name text,
--   "desc" text,
--   image_url text,
--   link_url text,
--   link_url_2 text,
--   is_custom boolean,
--   sort_order integer,
--   total_count bigint
-- ) AS $$
-- BEGIN
--   -- CODE NỘI BỘ BÊN TRONG CỦA BẠN (vẫn có thể Join bằng o.no nếu muốn)
--   RETURN QUERY SELECT 
--     o.id::text as id,
--     o.no as legacy_no,
--     row_number() over() as display_no,
--     ...
-- END;
-- $$ LANGUAGE plpgsql;
