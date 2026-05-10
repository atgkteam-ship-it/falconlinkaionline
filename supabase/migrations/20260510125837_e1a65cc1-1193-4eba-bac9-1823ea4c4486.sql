
-- Fix update_updated_at search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Tighten notifications insert: only insert for self (admin policy added separately)
DROP POLICY IF EXISTS "notif insert any auth" ON public.notifications;
CREATE POLICY "notif self insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notif admin insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Revoke public execute on SECURITY DEFINER funcs
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- Seed services
INSERT INTO public.services (slug, title, description, category, base_price, eta_minutes, required_documents, icon) VALUES
('pan-card-new','New PAN Card','Apply for a new PAN card with home document pickup.','identity',299,4320,'["Aadhaar Card","Passport size photo","Address proof"]','credit-card'),
('pan-card-update','PAN Card Update / Correction','Update name, DOB, address or photo on existing PAN.','identity',249,4320,'["Existing PAN","Aadhaar","Supporting proof"]','credit-card'),
('aadhaar-update','Aadhaar Update','Update name, address, mobile or biometrics on Aadhaar.','identity',199,2880,'["Aadhaar Card","Address proof"]','user-check'),
('aadhaar-new','New Aadhaar Enrollment','Book a slot and assistance for new Aadhaar enrollment.','identity',299,4320,'["ID proof","Address proof","Birth proof"]','user-check'),
('birth-certificate','Birth Certificate','Apply or download a municipal birth certificate.','certificates',399,5760,'["Hospital records","Parents Aadhaar","Address proof"]','file-text'),
('death-certificate','Death Certificate','Apply for an official death certificate.','certificates',399,5760,'["Hospital report","Aadhaar of deceased","Applicant ID"]','file-text'),
('marriage-certificate','Marriage Certificate','Register marriage and get the official certificate.','certificates',999,10080,'["Aadhaar of both","Wedding photo","Witness IDs"]','heart'),
('passport-new','New Passport Application','End-to-end passport application + appointment help.','travel',1499,7200,'["Aadhaar","Birth proof","Address proof"]','plane'),
('passport-renew','Passport Renewal','Renew an expiring or expired passport.','travel',1299,5760,'["Old passport","Aadhaar","Address proof"]','plane'),
('driving-licence','Driving Licence','Learner / permanent driving licence assistance.','transport',899,7200,'["Aadhaar","Address proof","Photo"]','car'),
('voter-id','Voter ID Card','New voter ID or address change.','identity',199,5760,'["Aadhaar","Address proof"]','vote'),
('income-certificate','Income Certificate','Government income certificate application.','certificates',299,4320,'["Aadhaar","Salary slip / ITR","Address proof"]','indian-rupee'),
('caste-certificate','Caste Certificate','Apply for SC/ST/OBC caste certificate.','certificates',299,4320,'["Aadhaar","Parents caste cert","Address proof"]','file-badge'),
('gst-registration','GST Registration','Register your business for GST.','business',1499,4320,'["PAN","Aadhaar","Business proof","Bank details"]','briefcase');
