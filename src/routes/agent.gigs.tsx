import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, ArrowLeft, ExternalLink, Send } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface Gig { id: string; title: string; slug: string; category: string; status: string; created_at: string; rejection_reason: string | null; }

export const Route = createFileRoute("/agent/gigs")({
  head: () => ({ meta: [{ title: "My Gigs — Agent" }] }),
  component: AgentGigs,
});

function AgentGigs() {
  const { user, isAgent, loading } = useAuth();
  const navigate = useNavigate();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => { if (!loading && (!user || !isAgent)) navigate({ to: "/" }); }, [user, isAgent, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data: a } = await supabase.from("agents").select("id,verified").eq("user_id", user.id).maybeSingle();
      if (!a) return;
      setAgentId(a.id); setVerified(a.verified);
      const { data } = await supabase.from("agent_gigs").select("id,title,slug,category,status,created_at,rejection_reason").eq("agent_id", a.id).order("created_at", { ascending: false });
      setGigs((data ?? []) as Gig[]);
    })();
  }, [user]);

  const submit = async (id: string) => {
    const { error } = await supabase.from("agent_gigs").update({ status: "pending" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Submitted for review");
    setGigs(gigs.map((g) => g.id === id ? { ...g, status: "pending" } : g));
  };

  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <Link to="/agent" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Agent</Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">My Gigs</h1>
            <p className="mt-1 text-sm text-muted-foreground">Apni services list karein. Verified hone ke baad approve hone par public dikhegi.</p>
          </div>
          {verified && <Button asChild className="grad-primary text-primary-foreground"><Link to="/agent/gigs/new"><Plus className="mr-2 h-4 w-4" />New gig</Link></Button>}
        </div>

        {!verified && agentId && <div className="mt-6 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm">Verified hone ke baad gig publish kar sakenge.</div>}

        <div className="mt-6 space-y-3">
          {gigs.length === 0 && <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No gigs yet.</div>}
          {gigs.map((g) => (
            <div key={g.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{g.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${g.status === "approved" ? "bg-success/15 text-success" : g.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-accent"}`}>{g.status}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{g.category}</div>
                {g.rejection_reason && <div className="mt-1 text-xs text-destructive">Reason: {g.rejection_reason}</div>}
              </div>
              <div className="flex gap-2">
                {g.status === "approved" && <Button asChild size="sm" variant="outline"><a href={`/gigs/${g.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a></Button>}
                {(g.status === "draft" || g.status === "rejected") && <Button size="sm" className="grad-primary text-primary-foreground" onClick={() => submit(g.id)}><Send className="mr-1 h-3.5 w-3.5" />Submit</Button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
