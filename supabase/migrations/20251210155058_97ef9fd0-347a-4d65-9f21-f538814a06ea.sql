-- Add unique constraint to prevent duplicate ratings per job instance per rater
ALTER TABLE public.ratings 
ADD CONSTRAINT ratings_unique_rater_job 
UNIQUE (rater_id, job_instance_id);