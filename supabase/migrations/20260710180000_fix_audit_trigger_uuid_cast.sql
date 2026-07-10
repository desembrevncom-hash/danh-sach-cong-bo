-- Fix fn_audit_product_overrides to cast uuid to text
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
      ('INSERT', 0, NEW.id::text, NULL, to_jsonb(NEW));

  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.product_overrides_history
      (action, product_no, product_id, old_data, new_data)
    VALUES
      ('UPDATE', 0, NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));

  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.product_overrides_history
      (action, product_no, product_id, old_data, new_data)
    VALUES
      ('DELETE', 0, OLD.id::text, to_jsonb(OLD), NULL);
  END IF;

  RETURN NULL;
END;
$$;
