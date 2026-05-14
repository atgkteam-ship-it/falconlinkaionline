import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const TIERS = ["basic", "standard", "premium"] as const;
type Tier = typeof TIERS[number];

export const Route = createFileRoute("/agent/gigs/new")({
  head: () => ({ meta: [{ title: "New Gig — Agent" }] }),
  component: NewGig,
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 60) + "-" + Math.random().toString(36).slice(2, 7);
}

function NewGig() {
  const { user, isAgent, loading } = useAuth();
  const navigate = useNavigate();
  const [agentId, setAgentId] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Freelance");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [packages, setPackages] = useState<Record<Tier, { title: string; description: string; price: string; delivery_days: string; revisions: string; enabled: boolean }>>({
    basic: { title: "Basic", description: "", price: "499", delivery_days: "3", revisions: "1", enabled: true },
    standard: { title: "Standard", description: "", price: "999", delivery_days: "5", revisions: "2", enabled: false },
    premium: { title: "Premium", description: "", price: "1999", delivery_days: "7", revisions: "3", enabled: false },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && (!user || !isAgent)) navigate({ to: "/" }); }, [user, isAgent, loading, navigate]);
  useEffect(() => {
    if (!user) return;
    void supabase.from("agents").select("id,verified").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) { setAgentId(data.id); setVerified(data.verified); }
    });
  }, [user]);

  const updatePkg = (tier: Tier, field: string, value: string | boolean) => {
    setPackages({ ...packages, [tier]: { ...packages[tier], [field]: value } });
  };

  const save = async (asDraft: boolean) => {
    if (!agentId || !user) return;
    if (!verified) return toast.error("Verify hone ke baad gig create kariye");
    if (!title.trim() || !description.trim()) return toast.error("Title aur description chahiye");
    const enabledPkgs = TIERS.filter((t) => packages[t].enabled);
    if (enabledPkgs.length === 0) return toast.error("At least one package enable kariye");
    setSaving(true);
    let coverUrl: string | null = null;
    if (cover) {
      const path = `${user.id}/${Date.now()}-${cover.name}`;
      const { error: upErr } = await supabase.storage.from("gig-covers").upload(path, cover);
      if (upErr) { setSaving(false); return toast.error(upErr.message); }
      coverUrl = supabase.storage.from("gig-covers").getPublicUrl(path).data.publicUrl;
    }
    const slug = slugify(title);
    const { data: gig, error } = await supabase.from("agent_gigs").insert({
      agent_id: agentId, title, slug, description, category,
      cover_image_url: coverUrl, tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      status: asDraft ? "draft" : "pending",
    }).select("id").single();
    if (error || !gig) { setSaving(false); return toast.error(error?.message ?? "Failed"); }
    const pkgRows = enabledPkgs.map((t) => ({
      gig_id: gig.id, tier: t, title: packages[t].title, description: packages[t].description,
      price: Number(packages[t].price), delivery_days: Number(packages[t].delivery_days), revisions: Number(packages[t].revisions),
    }));
    const { error: pkgErr } = await supabase.from("gig_packages").insert(pkgRows);
    setSaving(false);
    if (pkgErr) return toast.error(pkgErr.message);
    toast.success(asDraft ? "Saved as draft" : "Submitted for review");
    navigate({ to: "/agent/gigs" });
  };

  return (
    <PageLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <Link to="/agent/gigs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> My gigs</Link>
        <h1 className="mt-3 font-display text-3xl font-bold">Create a gig</h1>

        <section className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display font-semibold">Overview</h2>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Gig title (e.g. I will design a modern logo)" className="h-11 rounded-xl" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (Freelance, Design, Writing...)" className="h-11 rounded-xl" />
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tags, comma separated" className="h-11 rounded-xl" />
          </div>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Detailed description, what's included, FAQs..." className="rounded-xl" />
          <div>
            <Label>Cover image</Label>
            <Input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] ?? null)} className="mt-1 h-11 rounded-xl" />
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display font-semibold">Pricing packages</h2>
          <p className="mt-1 text-xs text-muted-foreground">At least one tier enable kariye.</p>
          <div className="mt-4 space-y-4">
            {TIERS.map((t) => (
              <div key={t} className={`rounded-xl border p-4 ${packages[t].enabled ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={packages[t].enabled} onChange={(e) => updatePkg(t, "enabled", e.target.checked)} />
                  <span className="font-medium capitalize">{t}</span>
                </label>
                {packages[t].enabled && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-4">
                    <Input value={packages[t].title} onChange={(e) => updatePkg(t, "title", e.target.value)} placeholder="Title" className="h-10 rounded-lg" />
                    <Input value={packages[t].price} onChange={(e) => updatePkg(t, "price", e.target.value)} type="number" placeholder="Price ₹" className="h-10 rounded-lg" />
                    <Input value={packages[t].delivery_days} onChange={(e) => updatePkg(t, "delivery_days", e.target.value)} type="number" placeholder="Delivery days" className="h-10 rounded-lg" />
                    <Input value={packages[t].revisions} onChange={(e) => updatePkg(t, "revisions", e.target.value)} type="number" placeholder="Revisions" className="h-10 rounded-lg" />
                    <Textarea value={packages[t].description} onChange={(e) => updatePkg(t, "description", e.target.value)} rows={2} placeholder="What's included..." className="sm:col-span-4 rounded-lg" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 flex gap-3">
          <Button onClick={() => save(true)} disabled={saving} variant="outline">Save draft</Button>
          <Button onClick={() => save(false)} disabled={saving} className="grad-primary text-primary-foreground">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Submit for review
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
