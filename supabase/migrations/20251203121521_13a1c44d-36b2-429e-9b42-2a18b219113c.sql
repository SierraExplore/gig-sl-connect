-- Fix function search_path security warnings
CREATE OR REPLACE FUNCTION public.generate_gig_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(gig_id FROM 8) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.gigs;
  
  NEW.gig_id := 'GIG-SL-' || LPAD(next_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;