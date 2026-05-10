import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Briefcase, Star, CheckCircle2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface Job { id: string; status: string; pincode: string; price: number; created_at: string; services: { title: string } | null; }

export const Route = createFileRoute("/agent")({
  head: () => ({ meta: [{ title: "Agent Dashboard — FalconLink AI" }] }),
  component: AgentDashboard,
});

function AgentDashboard() {
  const { user, isAgent, loading } = useAuth();
  const navigate = useNavigate();
  const [agentId, setAgentId] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [rating, setRating] = useState(5);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => { if (!loading && (!user || !isAgent)) navigate({ to: "/" }); }, [user, isAgent, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data: a } = await supabase.from("agents").select("id,verified,rating").eq("user_id", user.id).maybeSingle();
      if (!a) return;
      setAgentId(a.id); setVerified(a.verified); setRating(Number(a.rating));
      const { data: b } = await supabase.from("bookings").select("id,status,pincode,price,created_at,services(title)").eq("agent_id", a.id).order("created_at", { ascending: false });
      setJobs((b ?? []) as unknown as Job[]);
    })();
  }, [user]);

  const updateStatus = async (id: string, status: "in_progress" | "completed") => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    await supabase.from("booking_events").insert({ booking_id: id, status, note: `Agent marked ${status}` });
    toast.success("Updated");
    setJobs(jobs.map((j) => j.id === id ? { ...j, status } : j));
  };

  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <h1 className="font-display text-3xl font-bold">Agent Dashboard</h1>
        {!verified && agentId && <div className="mt-3 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm">Your account is pending admin verification.</div>}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5"><div className="text-xs uppercase text-muted-foreground">Total jobs</div><div className="mt-2 font-display text-2xl font-bold">{jobs.length}</div></div>
          <div className="rounded-2xl border border-border bg-card p-5"><div className="text-xs uppercase text-muted-foreground">Earnings</div><div className="mt-2 font-display text-2xl font-bold">₹{jobs.filter(j => j.status === "completed").reduce((a, j) => a + j.price, 0)}</div></div>
          <div className="rounded-2xl border border-border bg-card p-5"><div className="text-xs uppercase text-muted-foreground">Rating</div><div className="mt-2 inline-flex items-center gap-1 font-display text-2xl font-bold"><Star className="h-5 w-5 fill-warning text-warning" />{rating}</div></div>
        </div>

        <h2 className="mt-10 font-display text-xl font-semibold">Assigned jobs</h2>
        <div className="mt-4 space-y-3">
          {jobs.length === 0 && <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No jobs yet.</div>}
          {jobs.map((j) => (
            <div key={j.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span className="font-medium">{j.services?.title}</span>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase">{j.status}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Pincode {j.pincode} · ₹{j.price}</div>
              </div>
              <div className="flex gap-2">
                {j.status === "assigned" && <Button size="sm" onClick={() => updateStatus(j.id, "in_progress")}>Start</Button>}
                {j.status === "in_progress" && <Button size="sm" className="grad-primary text-primary-foreground" onClick={() => updateStatus(j.id, "completed")}><CheckCircle2 className="mr-1 h-4 w-4" />Complete</Button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
