-- Sửa lại trigger audit do cột product_id trong DB production đang là UUID, 
-- việc ép kiểu sang text (::text) sẽ gây lỗi.
-- Do đó chúng ta ép về ::uuid để tương thích.

CREATE OR REPLACE FUNCTION public.fn_audit_product_overrides()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.product_overrides_history
      (action, product_no, product_id, old_data, new_data)
    VALUES
      ('INSERT', 0, NEW.id::uuid, NULL, to_jsonb(NEW));

  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.product_overrides_history
      (action, product_no, product_id, old_data, new_data)
    VALUES
      ('UPDATE', 0, NEW.id::uuid, to_jsonb(OLD), to_jsonb(NEW));

  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.product_overrides_history
      (action, product_no, product_id, old_data, new_data)
    VALUES
      ('DELETE', 0, OLD.id::uuid, to_jsonb(OLD), NULL);
  END IF;

  RETURN NULL;
END;
$$;
