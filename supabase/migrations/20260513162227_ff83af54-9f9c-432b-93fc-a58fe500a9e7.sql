
-- 1. Agents: restrict full table read; add public-safe view
DROP POLICY IF EXISTS "agents public read verified" ON public.agents;

CREATE POLICY "agents owner or admin read"
ON public.agents
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE VIEW public.agents_public
WITH (security_invoker = false) AS
SELECT id, full_name, bio, rating, total_jobs, pincode, service_areas, verified, created_at
FROM public.agents
WHERE verified = true;

GRANT SELECT ON public.agents_public TO anon, authenticated;

-- 2. Reviews: restrict full read; add public-safe view
DROP POLICY IF EXISTS "reviews public read" ON public.reviews;

CREATE POLICY "reviews participant read"
ON public.reviews
FOR SELECT
TO authenticated
USING (
  auth.uid() = customer_id
  OR EXISTS (SELECT 1 FROM public.agents a WHERE a.id = reviews.agent_id AND a.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE OR REPLACE VIEW public.reviews_public
WITH (security_invoker = false) AS
SELECT id, agent_id, rating, comment, created_at
FROM public.reviews;

GRANT SELECT ON public.reviews_public TO anon, authenticated;

-- 3. Notifications: allow users to delete their own
CREATE POLICY "notif self delete"
ON public.notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Lock down internal trigger functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_agent_role_on_verify() FROM anon, authenticated, PUBLIC;
