-- Allow authenticated users to insert new skills
CREATE POLICY "Authenticated users can create skills"
ON public.skills
FOR INSERT
TO authenticated
WITH CHECK (true);