
CREATE OR REPLACE FUNCTION public.grant_agent_role_on_verify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.verified = true AND (TG_OP = 'INSERT' OR OLD.verified IS DISTINCT FROM NEW.verified) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'agent')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_grant_agent_role ON public.agents;
CREATE TRIGGER trg_grant_agent_role
AFTER INSERT OR UPDATE OF verified ON public.agents
FOR EACH ROW EXECUTE FUNCTION public.grant_agent_role_on_verify();

-- Ensure unique constraint exists for ON CONFLICT
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END $$;

-- Backfill
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'agent'::app_role FROM public.agents WHERE verified = true
ON CONFLICT (user_id, role) DO NOTHING;
