import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Users, Briefcase, ShieldCheck, IndianRupee, CheckCircle2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface PendingAgent { id: string; full_name: string; phone: string; pincode: string; bio: string | null; created_at: string; }

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — FalconLink AI" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, agents: 0, bookings: 0, revenue: 0 });
  const [pending, setPending] = useState<PendingAgent[]>([]);

  useEffect(() => { if (!loading && (!user || !isAdmin)) navigate({ to: "/" }); }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    void load();
  }, [isAdmin]);

  const load = async () => {
    const [{ count: usersC }, { count: agentsC }, { count: bookingsC }, { data: revenue }, { data: pend }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("agents").select("*", { count: "exact", head: true }).eq("verified", true),
      supabase.from("bookings").select("*", { count: "exact", head: true }),
      supabase.from("bookings").select("price").eq("status", "completed"),
      supabase.from("agents").select("id,full_name,phone,pincode,bio,created_at").eq("verified", false).order("created_at", { ascending: false }),
    ]);
    setStats({
      users: usersC ?? 0, agents: agentsC ?? 0, bookings: bookingsC ?? 0,
      revenue: (revenue ?? []).reduce((a, b) => a + (b.price ?? 0), 0),
    });
    setPending((pend ?? []) as PendingAgent[]);
  };

  const verify = async (id: string) => {
    const { error } = await supabase.from("agents").update({ verified: true }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Agent verified");
    void load();
  };

  return (
    <PageLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage platform, agents and services.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Users} label="Users" value={stats.users} />
          <Stat icon={ShieldCheck} label="Verified Agents" value={stats.agents} />
          <Stat icon={Briefcase} label="Total Bookings" value={stats.bookings} />
          <Stat icon={IndianRupee} label="Revenue" value={`₹${stats.revenue}`} />
        </div>

        <h2 className="mt-12 font-display text-xl font-semibold">Pending agent verifications</h2>
        <div className="mt-4 space-y-3">
          {pending.length === 0 && <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No pending applications.</div>}
          {pending.map((a) => (
            <div key={a.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium">{a.full_name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{a.phone} · Pincode {a.pincode}</div>
                {a.bio && <div className="mt-1 text-xs text-muted-foreground">{a.bio}</div>}
              </div>
              <Button size="sm" className="grad-primary text-primary-foreground" onClick={() => verify(a.id)}><CheckCircle2 className="mr-1 h-4 w-4" />Verify</Button>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
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
