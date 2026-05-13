
-- Drop SECURITY DEFINER views
DROP VIEW IF EXISTS public.agents_public;
DROP VIEW IF EXISTS public.reviews_public;

-- AGENTS: column-level privileges
REVOKE ALL ON public.agents FROM anon, authenticated;
GRANT SELECT (id, full_name, bio, rating, total_jobs, pincode, service_areas, verified, created_at)
  ON public.agents TO anon, authenticated;
-- Authenticated users still need full access for their own row / admin actions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents TO authenticated;
-- (Re-grant SELECT on all cols to authenticated; column privileges only matter for anon now.)
GRANT SELECT ON public.agents TO authenticated;

-- Add back a minimal public read policy for verified agents (column privileges restrict anon)
CREATE POLICY "agents public read verified safe cols"
ON public.agents
FOR SELECT
TO anon
USING (verified = true);

-- REVIEWS: column-level privileges (hide customer_id from anon)
REVOKE ALL ON public.reviews FROM anon, authenticated;
GRANT SELECT (id, agent_id, rating, comment, created_at) ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;

-- Public read policy for reviews (anon limited by column grants)
CREATE POLICY "reviews public read safe cols"
ON public.reviews
FOR SELECT
TO anon
USING (true);
