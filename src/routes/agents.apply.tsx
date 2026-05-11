import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/agents/apply")({
  head: () => ({ meta: [{ title: "Become an Agent — FalconLink AI" }] }),
  component: ApplyPage,
});

function ApplyPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", phone: "", pincode: "", areas: "", bio: "" });
  const [busy, setBusy] = useState(false);
  const [existing, setExisting] = useState<{ verified: boolean } | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (user) void supabase.from("agents").select("id,verified").eq("user_id", user.id).maybeSingle().then(({ data }) => setExisting(data ? { verified: data.verified } : null));
  }, [user, loading, navigate]);

  const submit = async () => {
    if (!user) return;
    if (!/^\d{6}$/.test(form.pincode)) return toast.error("Valid 6-digit pincode required");
    setBusy(true);
    const areas = form.areas.split(",").map((s) => s.trim()).filter(Boolean);
    const { error } = await supabase.from("agents").insert({
      user_id: user.id, full_name: form.full_name, phone: form.phone, pincode: form.pincode,
      service_areas: areas.length ? areas : [form.pincode], bio: form.bio,
    });
    if (error) { setBusy(false); return toast.error(error.message); }
    await supabase.from("user_roles").insert({ user_id: user.id, role: "agent" });
    toast.success("Application submitted! Admin will verify you soon.");
    navigate({ to: "/" });
  };

  if (existing) return <PageLayout><div className="mx-auto max-w-md py-20 text-center"><ShieldCheck className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 font-display text-xl font-semibold">Application already submitted</h2><p className="mt-2 text-sm text-muted-foreground">An admin will verify your account shortly.</p></div></PageLayout>;

  return (
    <PageLayout>
      <div className="mx-auto max-w-xl px-4 py-10 md:px-6">
        <h1 className="font-display text-3xl font-bold">Become an Agent</h1>
        <p className="mt-1 text-sm text-muted-foreground">Get matched with customers in your area. Verification by admin required.</p>
        <div className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6">
          <div><Label>Full name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1 h-11 rounded-xl" /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 h-11 rounded-xl" /></div>
          <div><Label>Primary pincode</Label><Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} maxLength={6} className="mt-1 h-11 rounded-xl" /></div>
          <div><Label>Other service pincodes (comma separated)</Label><Input value={form.areas} onChange={(e) => setForm({ ...form, areas: e.target.value })} placeholder="110002, 110003" className="mt-1 h-11 rounded-xl" /></div>
          <div><Label>About you</Label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="mt-1 rounded-xl" /></div>
          <Button onClick={submit} disabled={busy} className="w-full h-11 rounded-xl grad-primary text-primary-foreground shadow-glow">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Submit application
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
