import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Users, Briefcase, ShieldCheck, IndianRupee, CheckCircle2, X, ExternalLink, Wallet } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — FalconLink AI" }] }),
  component: AdminDashboard,
});

interface PendingAgent { id: string; full_name: string; phone: string; pincode: string; bio: string | null; created_at: string; }
interface Gig { id: string; title: string; slug: string; category: string; status: string; created_at: string; agents: { full_name: string } | null; }
interface PendingPayment { id: string; booking_id: string; amount: number; upi_utr: string | null; upi_screenshot_url: string | null; created_at: string; }
interface PendingWd { id: string; agent_id: string; amount: number; upi_id: string | null; bank_account: string | null; ifsc: string | null; status: string; created_at: string; agents: { full_name: string; phone: string } | null; }

function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, agents: 0, bookings: 0, revenue: 0 });
  const [pending, setPending] = useState<PendingAgent[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [withdrawals, setWithdrawals] = useState<PendingWd[]>([]);

  useEffect(() => { if (!loading && (!user || !isAdmin)) navigate({ to: "/" }); }, [user, isAdmin, loading, navigate]);
  useEffect(() => { if (isAdmin) void load(); }, [isAdmin]);

  const load = async () => {
    const [
      { count: usersC }, { count: agentsC }, { count: bookingsC }, { data: revenue },
      { data: pend }, { data: g }, { data: p }, { data: wd },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("agents").select("*", { count: "exact", head: true }).eq("verified", true),
      supabase.from("bookings").select("*", { count: "exact", head: true }),
      supabase.from("payments").select("amount").eq("status", "paid"),
      supabase.from("agents").select("id,full_name,phone,pincode,bio,created_at").eq("verified", false).order("created_at", { ascending: false }),
      supabase.from("agent_gigs").select("id,title,slug,category,status,created_at,agents(full_name)").eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("payments").select("id,booking_id,amount,upi_utr,upi_screenshot_url,created_at").eq("status", "pending").eq("method", "upi_manual").order("created_at", { ascending: false }),
      supabase.from("withdrawal_requests").select("id,agent_id,amount,upi_id,bank_account,ifsc,status,created_at,agents(full_name,phone)").in("status", ["pending", "approved"]).order("created_at", { ascending: false }),
    ]);
    setStats({ users: usersC ?? 0, agents: agentsC ?? 0, bookings: bookingsC ?? 0, revenue: (revenue ?? []).reduce((a, b) => a + (b.amount ?? 0), 0) });
    setPending((pend ?? []) as PendingAgent[]);
    setGigs((g ?? []) as unknown as Gig[]);
    setPayments((p ?? []) as PendingPayment[]);
    setWithdrawals((wd ?? []) as unknown as PendingWd[]);
  };

  const verifyAgent = async (id: string) => {
    const { error } = await supabase.from("agents").update({ verified: true }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Agent verified"); void load();
  };

  const reviewGig = async (id: string, status: "approved" | "rejected", reason?: string) => {
    const { error } = await supabase.from("agent_gigs").update({ status, rejection_reason: reason ?? null }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Gig ${status}`); void load();
  };

  const verifyPayment = async (p: PendingPayment) => {
    const { error } = await supabase.from("payments").update({ status: "paid", verified_by: user!.id, verified_at: new Date().toISOString() }).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Payment verified, agent wallet credited"); void load();
  };

  const markWdPaid = async (id: string) => {
    const { error } = await supabase.from("withdrawal_requests").update({ status: "paid" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Marked paid"); void load();
  };

  const viewProof = async (path: string) => {
    const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <PageLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage platform, agents, gigs and payments.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Users} label="Users" value={stats.users} />
          <Stat icon={ShieldCheck} label="Verified Agents" value={stats.agents} />
          <Stat icon={Briefcase} label="Total Bookings" value={stats.bookings} />
          <Stat icon={IndianRupee} label="Revenue (paid)" value={`₹${stats.revenue}`} />
        </div>

        <Tabs defaultValue="agents" className="mt-10">
          <TabsList className="flex-wrap">
            <TabsTrigger value="agents">Agents {pending.length > 0 && <span className="ml-1 rounded-full bg-warning px-1.5 text-[10px] text-warning-foreground">{pending.length}</span>}</TabsTrigger>
            <TabsTrigger value="gigs">Gigs {gigs.length > 0 && <span className="ml-1 rounded-full bg-warning px-1.5 text-[10px] text-warning-foreground">{gigs.length}</span>}</TabsTrigger>
            <TabsTrigger value="payments">Payments {payments.length > 0 && <span className="ml-1 rounded-full bg-warning px-1.5 text-[10px] text-warning-foreground">{payments.length}</span>}</TabsTrigger>
            <TabsTrigger value="withdrawals">Payouts {withdrawals.length > 0 && <span className="ml-1 rounded-full bg-warning px-1.5 text-[10px] text-warning-foreground">{withdrawals.length}</span>}</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="mt-4 space-y-3">
            {pending.length === 0 && <Empty text="No pending applications." />}
            {pending.map((a) => (
              <Card key={a.id}>
                <div>
                  <div className="font-medium">{a.full_name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{a.phone} · Pincode {a.pincode}</div>
                  {a.bio && <div className="mt-1 text-xs text-muted-foreground">{a.bio}</div>}
                </div>
                <Button size="sm" className="grad-primary text-primary-foreground" onClick={() => verifyAgent(a.id)}><CheckCircle2 className="mr-1 h-4 w-4" />Verify</Button>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="gigs" className="mt-4 space-y-3">
            {gigs.length === 0 && <Empty text="No gigs awaiting review." />}
            {gigs.map((g) => (
              <Card key={g.id}>
                <div>
                  <div className="font-medium">{g.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">By {g.agents?.full_name} · {g.category}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => window.open(`/gigs/${g.slug}`, "_blank")}><ExternalLink className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => { const r = prompt("Rejection reason?"); if (r) void reviewGig(g.id, "rejected", r); }}><X className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" className="grad-primary text-primary-foreground" onClick={() => reviewGig(g.id, "approved")}><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Approve</Button>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="payments" className="mt-4 space-y-3">
            {payments.length === 0 && <Empty text="No pending UPI verifications." />}
            {payments.map((p) => (
              <Card key={p.id}>
                <div>
                  <div className="font-medium">₹{p.amount} · UTR: {p.upi_utr}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Booking {p.booking_id.slice(0, 8)}…</div>
                </div>
                <div className="flex gap-2">
                  {p.upi_screenshot_url && <Button size="sm" variant="outline" onClick={() => viewProof(p.upi_screenshot_url!)}>View proof</Button>}
                  <Button size="sm" className="grad-primary text-primary-foreground" onClick={() => verifyPayment(p)}><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Mark paid</Button>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="withdrawals" className="mt-4 space-y-3">
            {withdrawals.length === 0 && <Empty text="No payout requests." />}
            {withdrawals.map((w) => (
              <Card key={w.id}>
                <div>
                  <div className="font-medium">{w.agents?.full_name} — ₹{w.amount}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{w.upi_id ? `UPI: ${w.upi_id}` : `${w.bank_account} · ${w.ifsc}`} · {w.agents?.phone}</div>
                </div>
                <Button size="sm" className="grad-primary text-primary-foreground" onClick={() => markWdPaid(w.id)}><Wallet className="mr-1 h-3.5 w-3.5" />Mark paid</Button>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <SettingsForm />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">{children}</div>;
}
function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{text}</div>;
}
function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

function SettingsForm() {
  const [commission, setCommission] = useState("15");
  const [upiId, setUpiId] = useState("");
  const [upiQrUrl, setUpiQrUrl] = useState("");
  const [payee, setPayee] = useState("");
  const [minWd, setMinWd] = useState("500");
  const [saving, setSaving] = useState(false);
  const [qrFile, setQrFile] = useState<File | null>(null);

  useEffect(() => {
    void supabase.from("platform_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (!data) return;
      setCommission(String(data.commission_pct ?? 15));
      setUpiId(data.upi_id ?? "");
      setUpiQrUrl(data.upi_qr_url ?? "");
      setPayee(data.upi_payee_name ?? "");
      setMinWd(String(data.min_withdrawal ?? 500));
    });
  }, []);

  const save = async () => {
    setSaving(true);
    let qrUrl = upiQrUrl;
    if (qrFile) {
      const path = `admin/upi-qr-${Date.now()}-${qrFile.name}`;
      const { error: upErr } = await supabase.storage.from("gig-covers").upload(path, qrFile, { upsert: true });
      if (upErr) { setSaving(false); return toast.error(upErr.message); }
      const { data: pub } = supabase.storage.from("gig-covers").getPublicUrl(path);
      qrUrl = pub.publicUrl;
      setUpiQrUrl(qrUrl);
    }
    const { error } = await supabase.from("platform_settings").update({
      commission_pct: Number(commission), upi_id: upiId || null, upi_qr_url: qrUrl || null,
      upi_payee_name: payee || null, min_withdrawal: Number(minWd),
    }).eq("id", 1);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label>Commission %</Label><Input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} className="mt-1 h-11 rounded-xl" /></div>
        <div><Label>Min withdrawal (₹)</Label><Input type="number" value={minWd} onChange={(e) => setMinWd(e.target.value)} className="mt-1 h-11 rounded-xl" /></div>
        <div><Label>UPI ID</Label><Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" className="mt-1 h-11 rounded-xl" /></div>
        <div><Label>Payee name</Label><Input value={payee} onChange={(e) => setPayee(e.target.value)} className="mt-1 h-11 rounded-xl" /></div>
        <div className="sm:col-span-2">
          <Label>UPI QR image</Label>
          <Input type="file" accept="image/*" onChange={(e) => setQrFile(e.target.files?.[0] ?? null)} className="mt-1 h-11 rounded-xl" />
          {upiQrUrl && <img src={upiQrUrl} alt="QR" className="mt-3 h-32 w-32 rounded-xl border border-border bg-white p-2 object-contain" />}
        </div>
      </div>
      <Button onClick={save} disabled={saving} className="grad-primary text-primary-foreground">{saving ? "Saving..." : "Save settings"}</Button>
    </div>
  );
}
