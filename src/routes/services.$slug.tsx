import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, IndianRupee, FileCheck, Sparkles } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Service {
  id: string; slug: string; title: string; description: string;
  category: string; base_price: number; eta_minutes: number;
  required_documents: string[]; icon: string | null;
}

export const Route = createFileRoute("/services/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — FalconLink AI` },
      { name: "description", content: "Apply with verified local agents. Doorstep documents, transparent pricing." },
    ],
  }),
  component: ServiceDetail,
});

function ServiceDetail() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void supabase.from("services").select("*").eq("slug", slug).maybeSingle().then(({ data }) => {
      setService(data as Service | null);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <PageLayout><div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">Loading...</div></PageLayout>;
  if (!service) throw notFound();

  return (
    <PageLayout>
      <article className="mx-auto max-w-4xl px-4 py-12 md:px-6">
        <Link to="/services" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All services</Link>

        <div className="mt-6 grid gap-8 md:grid-cols-[1fr_320px]">
          <div>
            <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">{service.category}</span>
            <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">{service.title}</h1>
            <p className="mt-3 text-muted-foreground">{service.description}</p>

            <h2 className="mt-8 font-display text-lg font-semibold">Required documents</h2>
            <ul className="mt-3 space-y-2">
              {service.required_documents.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm">
                  <FileCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {d}
                </li>
              ))}
            </ul>
          </div>

          <aside className="glass rounded-2xl p-6 shadow-soft h-fit md:sticky md:top-24">
            <div className="flex items-baseline gap-1">
              <IndianRupee className="h-5 w-5" />
              <span className="font-display text-3xl font-bold">{service.base_price}</span>
              <span className="text-sm text-muted-foreground">starting</span>
            </div>
            <div className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" /> ~{Math.round(service.eta_minutes / 60)} hours estimated
            </div>
            <Button onClick={() => navigate({ to: "/book/$serviceId", params: { serviceId: service.id } })} className="mt-5 w-full grad-primary text-primary-foreground shadow-glow hover:opacity-90">
              Book now
            </Button>
            <Button asChild variant="outline" className="mt-2 w-full">
              <Link to="/ai" search={{ q: `I need ${service.title}` } as never}><Sparkles className="mr-2 h-4 w-4" />Ask AI first</Link>
            </Button>
          </aside>
        </div>
      </article>
    </PageLayout>
  );
}
