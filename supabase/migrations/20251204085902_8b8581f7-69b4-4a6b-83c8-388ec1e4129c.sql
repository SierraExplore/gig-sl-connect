-- Enable realtime for remaining tables (notifications already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'applications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'job_instances'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.job_instances;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'gigs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.gigs;
  END IF;
END $$;

-- Set REPLICA IDENTITY FULL for complete row data
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.applications REPLICA IDENTITY FULL;
ALTER TABLE public.job_instances REPLICA IDENTITY FULL;
ALTER TABLE public.gigs REPLICA IDENTITY FULL;