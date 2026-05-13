
-- Platform settings (single row config)
CREATE TABLE public.platform_settings (
  id integer PRIMARY KEY DEFAULT 1,
  commission_pct numeric NOT NULL DEFAULT 15,
  upi_id text,
  upi_qr_url text,
  upi_payee_name text,
  min_withdrawal integer NOT NULL DEFAULT 500,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO public.platform_settings (id) VALUES (1);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.platform_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin write" ON public.platform_settings FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Agent gigs
CREATE TYPE public.gig_status AS ENUM ('draft','pending','approved','rejected','paused');
CREATE TABLE public.agent_gigs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  category text NOT NULL,
  cover_image_url text,
  tags text[] NOT NULL DEFAULT '{}',
  status gig_status NOT NULL DEFAULT 'draft',
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_gigs_status ON public.agent_gigs(status);
CREATE INDEX idx_gigs_agent ON public.agent_gigs(agent_id);
ALTER TABLE public.agent_gigs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gigs public read approved" ON public.agent_gigs FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "gigs owner read" ON public.agent_gigs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM agents a WHERE a.id = agent_gigs.agent_id AND a.user_id = auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY "gigs owner insert" ON public.agent_gigs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM agents a WHERE a.id = agent_gigs.agent_id AND a.user_id = auth.uid() AND a.verified = true));
CREATE POLICY "gigs owner update" ON public.agent_gigs FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM agents a WHERE a.id = agent_gigs.agent_id AND a.user_id = auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY "gigs owner delete" ON public.agent_gigs FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM agents a WHERE a.id = agent_gigs.agent_id AND a.user_id = auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE TRIGGER gigs_updated BEFORE UPDATE ON public.agent_gigs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Gig packages
CREATE TYPE public.gig_tier AS ENUM ('basic','standard','premium');
CREATE TABLE public.gig_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id uuid NOT NULL REFERENCES public.agent_gigs(id) ON DELETE CASCADE,
  tier gig_tier NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  price integer NOT NULL,
  delivery_days integer NOT NULL DEFAULT 3,
  revisions integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gig_id, tier)
);
ALTER TABLE public.gig_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pkg public read approved" ON public.gig_packages FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM agent_gigs g WHERE g.id = gig_packages.gig_id AND g.status = 'approved'));
CREATE POLICY "pkg owner all" ON public.gig_packages FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM agent_gigs g JOIN agents a ON a.id = g.agent_id WHERE g.id = gig_packages.gig_id AND a.user_id = auth.uid()) OR has_role(auth.uid(),'admin')) WITH CHECK (EXISTS (SELECT 1 FROM agent_gigs g JOIN agents a ON a.id = g.agent_id WHERE g.id = gig_packages.gig_id AND a.user_id = auth.uid()) OR has_role(auth.uid(),'admin'));

-- Service requests (customer demands)
CREATE TYPE public.request_status AS ENUM ('open','assigned','completed','cancelled');
CREATE TABLE public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  budget_min integer,
  budget_max integer,
  pincode text,
  deadline date,
  status request_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_req_status ON public.service_requests(status);
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "req owner read" ON public.service_requests FOR SELECT TO authenticated USING (auth.uid() = customer_id OR EXISTS (SELECT 1 FROM agents a WHERE a.user_id = auth.uid() AND a.verified = true) OR has_role(auth.uid(),'admin'));
CREATE POLICY "req customer insert" ON public.service_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "req customer update" ON public.service_requests FOR UPDATE TO authenticated USING (auth.uid() = customer_id OR has_role(auth.uid(),'admin'));
CREATE TRIGGER req_updated BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Proposals (agent bids)
CREATE TYPE public.proposal_status AS ENUM ('pending','accepted','rejected','withdrawn');
CREATE TABLE public.request_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL,
  quote_price integer NOT NULL,
  delivery_days integer NOT NULL DEFAULT 3,
  message text,
  status proposal_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, agent_id)
);
ALTER TABLE public.request_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prop participant read" ON public.request_proposals FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM agents a WHERE a.id = request_proposals.agent_id AND a.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM service_requests r WHERE r.id = request_proposals.request_id AND r.customer_id = auth.uid())
  OR has_role(auth.uid(),'admin')
);
CREATE POLICY "prop agent insert" ON public.request_proposals FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM agents a WHERE a.id = request_proposals.agent_id AND a.user_id = auth.uid() AND a.verified = true));
CREATE POLICY "prop owner or req-owner update" ON public.request_proposals FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM agents a WHERE a.id = request_proposals.agent_id AND a.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM service_requests r WHERE r.id = request_proposals.request_id AND r.customer_id = auth.uid())
  OR has_role(auth.uid(),'admin')
);

-- Bookings: link to gigs / requests + payment_status
CREATE TYPE public.payment_status_t AS ENUM ('unpaid','paid','refunded');
ALTER TABLE public.bookings
  ADD COLUMN gig_id uuid REFERENCES public.agent_gigs(id),
  ADD COLUMN package_tier gig_tier,
  ADD COLUMN request_id uuid REFERENCES public.service_requests(id),
  ADD COLUMN payment_status payment_status_t NOT NULL DEFAULT 'unpaid';
ALTER TABLE public.bookings ALTER COLUMN service_id DROP NOT NULL;

-- Payments
CREATE TYPE public.payment_method_t AS ENUM ('stripe','upi_manual');
CREATE TYPE public.payment_record_status AS ENUM ('pending','paid','failed','refunded');
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  commission integer NOT NULL DEFAULT 0,
  agent_amount integer NOT NULL DEFAULT 0,
  method payment_method_t NOT NULL,
  status payment_record_status NOT NULL DEFAULT 'pending',
  stripe_session_id text,
  upi_utr text,
  upi_screenshot_url text,
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pay_booking ON public.payments(booking_id);
CREATE INDEX idx_pay_status ON public.payments(status);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pay participant read" ON public.payments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM bookings b WHERE b.id = payments.booking_id AND (b.customer_id = auth.uid() OR EXISTS (SELECT 1 FROM agents a WHERE a.id = b.agent_id AND a.user_id = auth.uid())))
  OR has_role(auth.uid(),'admin')
);
CREATE POLICY "pay customer insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM bookings b WHERE b.id = payments.booking_id AND b.customer_id = auth.uid())
);
CREATE POLICY "pay admin update" ON public.payments FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER pay_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Agent wallets
CREATE TABLE public.agent_wallets (
  agent_id uuid PRIMARY KEY,
  available_balance integer NOT NULL DEFAULT 0,
  pending_balance integer NOT NULL DEFAULT 0,
  lifetime_earnings integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet owner read" ON public.agent_wallets FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM agents a WHERE a.id = agent_wallets.agent_id AND a.user_id = auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE TRIGGER wallet_updated BEFORE UPDATE ON public.agent_wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Wallet transactions ledger
CREATE TYPE public.wallet_tx_type AS ENUM ('credit_booking','release_to_available','debit_withdrawal','adjustment');
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  type wallet_tx_type NOT NULL,
  amount integer NOT NULL,
  booking_id uuid,
  withdrawal_id uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_wtx_agent ON public.wallet_transactions(agent_id, created_at DESC);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wtx owner read" ON public.wallet_transactions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM agents a WHERE a.id = wallet_transactions.agent_id AND a.user_id = auth.uid()) OR has_role(auth.uid(),'admin'));

-- Withdrawal requests
CREATE TYPE public.withdrawal_status AS ENUM ('pending','approved','paid','rejected');
CREATE TABLE public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  amount integer NOT NULL,
  upi_id text,
  bank_account text,
  ifsc text,
  status withdrawal_status NOT NULL DEFAULT 'pending',
  admin_note text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_wd_agent ON public.withdrawal_requests(agent_id);
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wd owner read" ON public.withdrawal_requests FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM agents a WHERE a.id = withdrawal_requests.agent_id AND a.user_id = auth.uid()) OR has_role(auth.uid(),'admin'));
CREATE POLICY "wd owner insert" ON public.withdrawal_requests FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM agents a WHERE a.id = withdrawal_requests.agent_id AND a.user_id = auth.uid()));
CREATE POLICY "wd admin update" ON public.withdrawal_requests FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER wd_updated BEFORE UPDATE ON public.withdrawal_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger: when payment marked paid -> credit pending wallet
CREATE OR REPLACE FUNCTION public.handle_payment_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent_id uuid;
BEGIN
  IF NEW.status = 'paid' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'paid') THEN
    SELECT agent_id INTO v_agent_id FROM bookings WHERE id = NEW.booking_id;
    IF v_agent_id IS NOT NULL THEN
      INSERT INTO agent_wallets (agent_id, pending_balance, lifetime_earnings)
        VALUES (v_agent_id, NEW.agent_amount, NEW.agent_amount)
        ON CONFLICT (agent_id) DO UPDATE
          SET pending_balance = agent_wallets.pending_balance + NEW.agent_amount,
              lifetime_earnings = agent_wallets.lifetime_earnings + NEW.agent_amount;
      INSERT INTO wallet_transactions (agent_id, type, amount, booking_id, note)
        VALUES (v_agent_id, 'credit_booking', NEW.agent_amount, NEW.booking_id, 'Payment received');
    END IF;
    UPDATE bookings SET payment_status = 'paid' WHERE id = NEW.booking_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_payment_paid AFTER INSERT OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.handle_payment_paid();

-- Trigger: when booking completed + paid -> release pending to available
CREATE OR REPLACE FUNCTION public.handle_booking_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount integer;
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' AND NEW.payment_status = 'paid' AND NEW.agent_id IS NOT NULL THEN
    SELECT COALESCE(SUM(agent_amount),0) INTO v_amount FROM payments WHERE booking_id = NEW.id AND status = 'paid';
    IF v_amount > 0 THEN
      UPDATE agent_wallets SET pending_balance = pending_balance - v_amount, available_balance = available_balance + v_amount WHERE agent_id = NEW.agent_id;
      INSERT INTO wallet_transactions (agent_id, type, amount, booking_id, note) VALUES (NEW.agent_id, 'release_to_available', v_amount, NEW.id, 'Booking completed');
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_booking_completed AFTER UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.handle_booking_completed();

-- Trigger: when withdrawal marked paid -> debit available
CREATE OR REPLACE FUNCTION public.handle_withdrawal_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid' THEN
    UPDATE agent_wallets SET available_balance = available_balance - NEW.amount WHERE agent_id = NEW.agent_id;
    INSERT INTO wallet_transactions (agent_id, type, amount, withdrawal_id, note) VALUES (NEW.agent_id, 'debit_withdrawal', NEW.amount, NEW.id, 'Withdrawal paid');
    NEW.paid_at = now();
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_withdrawal_paid BEFORE UPDATE ON public.withdrawal_requests FOR EACH ROW EXECUTE FUNCTION public.handle_withdrawal_paid();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('gig-covers','gig-covers', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs','payment-proofs', false) ON CONFLICT DO NOTHING;

CREATE POLICY "gig-covers public read" ON storage.objects FOR SELECT USING (bucket_id = 'gig-covers');
CREATE POLICY "gig-covers auth upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gig-covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "gig-covers owner update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'gig-covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "gig-covers owner delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'gig-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "proofs owner read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'payment-proofs' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(),'admin')));
CREATE POLICY "proofs owner upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
