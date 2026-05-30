-- =============================================================
-- Audit Log: product_overrides_history
-- Ghi lại mọi INSERT / UPDATE / DELETE trên product_overrides
-- Dùng JSONB để bền và dễ truy vấn sau này
-- =============================================================

CREATE TABLE IF NOT EXISTS public.product_overrides_history (
  history_id  BIGSERIAL PRIMARY KEY,
  action      TEXT          NOT NULL,         -- 'INSERT' | 'UPDATE' | 'DELETE'
  product_no  INTEGER       NOT NULL,
  old_data    JSONB,                           -- NULL khi INSERT
  new_data    JSONB,                           -- NULL khi DELETE
  changed_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Index để truy vấn nhanh theo sản phẩm hoặc thời gian
CREATE INDEX IF NOT EXISTS idx_alog_product_no  ON public.product_overrides_history (product_no);
CREATE INDEX IF NOT EXISTS idx_alog_changed_at  ON public.product_overrides_history (changed_at DESC);

-- Bảo mật: bật RLS, không thêm policy public
-- → chỉ Service Role (Edge Functions) mới ghi/đọc được
ALTER TABLE public.product_overrides_history ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- Hàm trigger (SECURITY DEFINER để chạy bằng quyền owner)
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_audit_product_overrides()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.product_overrides_history
      (action, product_no, old_data, new_data)
    VALUES
      ('INSERT', NEW.no, NULL, to_jsonb(NEW));

  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.product_overrides_history
      (action, product_no, old_data, new_data)
    VALUES
      ('UPDATE', NEW.no, to_jsonb(OLD), to_jsonb(NEW));

  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.product_overrides_history
      (action, product_no, old_data, new_data)
    VALUES
      ('DELETE', OLD.no, to_jsonb(OLD), NULL);
  END IF;

  RETURN NULL; -- AFTER trigger: return value is ignored
END;
$$;

-- =============================================================
-- Gắn trigger vào bảng product_overrides
-- =============================================================
DROP TRIGGER IF EXISTS trg_audit_product_overrides ON public.product_overrides;

CREATE TRIGGER trg_audit_product_overrides
  AFTER INSERT OR UPDATE OR DELETE
  ON public.product_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_audit_product_overrides();
