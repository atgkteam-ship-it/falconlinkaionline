import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Star, Clock, RotateCw, Briefcase, IndianRupee } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface Gig {
  id: string; title: string; description: string; category: string; cover_image_url: string | null; tags: string[];
  agent_id: string; agents: { full_name: string; rating: number; total_jobs: number; bio: string | null } | null;
}
interface Pkg { id: string; tier: string; title: string; description: string; price: number; delivery_days: number; revisions: number; }

export const Route = createFileRoute("/gigs/$slug")({
  head: ({ params }) => ({ meta: [
    { title: `${params.slug.replace(/-/g, " ")} — FalconLink AI` },
    { name: "description", content: "Hire a verified freelance agent on FalconLink AI." },
  ] }),
  component: GigDetail,
});

function GigDetail() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gig, setGig] = useState<Gig | null>(null);
  const [pkgs, setPkgs] = useState<Pkg[]>([]);
  const [selected, setSelected] = useState<Pkg | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data: g } = await supabase.from("agent_gigs").select("id,title,description,category,cover_image_url,tags,agent_id,agents(full_name,rating,total_jobs,bio)").eq("slug", slug).eq("status", "approved").maybeSingle();
      if (g) {
        setGig(g as unknown as Gig);
        const { data: p } = await supabase.from("gig_packages").select("*").eq("gig_id", g.id).order("price");
        setPkgs((p ?? []) as Pkg[]);
        setSelected((p?.[0] as Pkg) ?? null);
      }
      setLoading(false);
    })();
  }, [slug]);

  const order = async () => {
    if (!user) { navigate({ to: "/login" }); return; }
    if (!gig || !selected) return;
    setOrdering(true);
    const { data, error } = await supabase.from("bookings").insert({
      customer_id: user.id, agent_id: gig.agent_id, gig_id: gig.id, package_tier: selected.tier as "basic"|"standard"|"premium",
      pincode: "000000", price: selected.price, status: "assigned",
    }).select("id").single();
    setOrdering(false);
    if (error || !data) return toast.error(error?.message ?? "Failed");
    await supabase.from("booking_events").insert({ booking_id: data.id, status: "assigned", note: `Gig order — ${selected.tier}` });
    navigate({ to: "/checkout/$bookingId", params: { bookingId: data.id } });
  };

  if (loading) return <PageLayout><div className="py-20 text-center text-muted-foreground">Loading...</div></PageLayout>;
  if (!gig) throw notFound();

  return (
    <PageLayout>
      <article className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <Link to="/services" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Browse</Link>

        <div className="mt-6 grid gap-8 md:grid-cols-[1fr_360px]">
          <div>
            {gig.cover_image_url && <img src={gig.cover_image_url} alt={gig.title} className="aspect-video w-full rounded-2xl border border-border object-cover" />}
            <span className="mt-4 inline-block rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">{gig.category}</span>
            <h1 className="mt-2 font-display text-3xl font-bold">{gig.title}</h1>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className="font-medium">{gig.agents?.full_name}</span>
              <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-warning text-warning" />{gig.agents?.rating}</span>
              <span className="text-muted-foreground">{gig.agents?.total_jobs} jobs</span>
            </div>
            <p className="mt-6 whitespace-pre-wrap text-sm text-muted-foreground">{gig.description}</p>
            {gig.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {gig.tags.map((t) => <span key={t} className="rounded-full bg-muted px-2.5 py-1 text-xs">{t}</span>)}
              </div>
            )}
          </div>

          <aside className="h-fit md:sticky md:top-24">
            <div className="glass rounded-2xl p-5 shadow-soft">
              <div className="flex gap-2 border-b border-border pb-3">
                {pkgs.map((p) => (
                  <button key={p.id} onClick={() => setSelected(p)} className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold uppercase ${selected?.id === p.id ? "grad-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>
                    {p.tier}
                  </button>
                ))}
              </div>
              {selected && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-baseline gap-1"><IndianRupee className="h-5 w-5" /><span className="font-display text-3xl font-bold">{selected.price}</span></div>
                  <h3 className="font-semibold">{selected.title}</h3>
                  {selected.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{selected.delivery_days}d delivery</span>
                    <span className="inline-flex items-center gap-1"><RotateCw className="h-3.5 w-3.5" />{selected.revisions} revisions</span>
                  </div>
                  <Button onClick={order} disabled={ordering} className="w-full grad-primary text-primary-foreground shadow-glow">
                    <Briefcase className="mr-2 h-4 w-4" />{ordering ? "Creating order..." : `Continue (₹${selected.price})`}
                  </Button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </article>
    </PageLayout>
  );
}
