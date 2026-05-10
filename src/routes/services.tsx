import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, ArrowRight, Clock, IndianRupee } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

interface Service {
  id: string; slug: string; title: string; description: string;
  category: string; base_price: number; eta_minutes: number; icon: string | null;
}

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "All Services — FalconLink AI" },
      { name: "description", content: "Browse PAN, Aadhaar, Passport, certificates, GST and other services available across India." },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  useEffect(() => {
    void supabase.from("services").select("*").eq("active", true).order("title").then(({ data }) => setServices((data ?? []) as Service[]));
  }, []);

  const categories = useMemo(() => ["all", ...Array.from(new Set(services.map((s) => s.category)))], [services]);
  const filtered = services.filter((s) => (cat === "all" || s.category === cat) && (s.title.toLowerCase().includes(q.toLowerCase()) || s.description.toLowerCase().includes(q.toLowerCase())));

  return (
    <PageLayout>
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-20 md:px-6">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold md:text-4xl">All services</h1>
          <p className="mt-2 text-muted-foreground">Pick a service or describe what you need to the AI assistant.</p>
        </div>

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search services..." className="pl-9 h-11 rounded-xl" />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${cat === c ? "grad-primary text-primary-foreground shadow-soft" : "border border-border bg-card hover:border-primary"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.4) }}>
              <Link to="/services/$slug" params={{ slug: s.slug }} className="group block h-full rounded-2xl border border-border bg-card p-5 transition hover:border-primary hover:shadow-glow">
                <div className="flex items-start justify-between">
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">{s.category}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" />{s.base_price}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{Math.round(s.eta_minutes / 60)}h</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        {filtered.length === 0 && services.length > 0 && (
          <p className="mt-10 text-center text-sm text-muted-foreground">No services match your search.</p>
        )}
      </section>
    </PageLayout>
  );
}
