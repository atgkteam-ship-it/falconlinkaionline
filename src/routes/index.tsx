import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Search, MapPin, Clock, ShieldCheck, Brain, Users, Star } from "lucide-react";
import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FalconLink AI — AI-powered government services in India" },
      { name: "description", content: "PAN, Aadhaar, Passport & more — type what you need, our AI matches verified local agents who come to your doorstep." },
      { property: "og:title", content: "FalconLink AI" },
      { property: "og:description", content: "AI-powered government & home services for India." },
    ],
  }),
  component: HomePage,
});

const SAMPLE = [
  "PAN card banana hai",
  "Aadhaar update karna hai",
  "Passport renew chahiye",
  "Birth certificate urgently",
  "Driving licence ke liye help",
];

function HomePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const submit = (text?: string) => {
    const value = (text ?? q).trim();
    if (!value) return;
    navigate({ to: "/ai", search: { q: value } as never });
  };

  return (
    <PageLayout>
      {/* HERO */}
      <section className="relative overflow-hidden grid-bg">
        <div className="mx-auto max-w-7xl px-4 pt-16 pb-20 md:px-6 md:pt-24 md:pb-28">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Powered by Gemini · Built for India
            </div>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Tell our AI what you need.<br />
              <span className="grad-text">We handle the rest.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
              From PAN cards to passports — describe your task in Hindi or English. Our AI finds verified local agents,
              estimates pricing, and books a home visit.
            </p>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mx-auto mt-8 max-w-2xl">
              <div className="glass-strong flex items-center gap-2 rounded-2xl p-2 shadow-glow">
                <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder='Try "PAN card banana hai"'
                  className="flex-1 bg-transparent px-1 py-3 text-base outline-none placeholder:text-muted-foreground"
                />
                <Button onClick={() => submit()} className="grad-primary text-primary-foreground rounded-xl px-5 shadow-glow hover:opacity-90">
                  Ask AI <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SAMPLE.map((s) => (
                  <button key={s} onClick={() => submit(s)} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-foreground transition">
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* trust row */}
          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { icon: ShieldCheck, label: "Verified agents" },
              { icon: MapPin, label: "Local pincode match" },
              { icon: Clock, label: "Live tracking" },
              { icon: Star, label: "Rated by users" },
            ].map((f, i) => (
              <motion.div key={f.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }} className="flex flex-col items-center gap-2 text-center">
                <div className="grad-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-soft"><f.icon className="h-5 w-5 text-primary-foreground" /></div>
                <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">An AI that runs the platform</h2>
          <p className="mt-3 text-muted-foreground">Not just chat — it understands intent, books services, and manages agents.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: Brain, title: "AI understands", text: 'Type "Aadhaar update" in any language — AI detects intent, suggests required docs, and pricing.' },
            { icon: Users, title: "Matches local agents", text: "Pincode-based matching to verified agents nearby with ratings and live availability." },
            { icon: ShieldCheck, title: "Manages everything", text: "Bookings, status updates, notifications and reviews — all orchestrated by AI." },
          ].map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass rounded-2xl p-6 shadow-soft">
              <div className="grad-primary inline-flex h-11 w-11 items-center justify-center rounded-xl"><s.icon className="h-5 w-5 text-primary-foreground" /></div>
              <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6 md:pb-24">
        <div className="grad-primary relative overflow-hidden rounded-3xl px-8 py-12 text-center text-primary-foreground shadow-glow md:py-16">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Ready to skip the queue?</h2>
          <p className="mt-3 opacity-90">Browse 14+ services or just tell the AI what you need.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="rounded-xl"><Link to="/services">Browse services</Link></Button>
            <Button asChild size="lg" className="rounded-xl bg-foreground text-background hover:opacity-90"><Link to="/ai">Open AI assistant</Link></Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
