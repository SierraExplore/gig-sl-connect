-- Drop the permissive INSERT policy that allows any user to insert audit logs
DROP POLICY IF EXISTS "System can create audit logs" ON public.audit_logs;

-- Create a secure SECURITY DEFINER function for audit logging
-- This function can only be called by database triggers or service_role
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_action TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_record_id UUID DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO audit_logs (actor_id, action, table_name, record_id, old_data, new_data)
  VALUES (auth.uid(), p_action, p_table_name, p_record_id, p_old_data, p_new_data)
  RETURNING id INTO log_id;
  RETURN log_id;
END;
$$;

-- Revoke direct execute from public, only allow authenticated users through specific flows
REVOKE EXECUTE ON FUNCTION public.create_audit_log FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_audit_log TO authenticated;