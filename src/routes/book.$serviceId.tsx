import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, Calendar, Star, IndianRupee, Loader2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface Service { id: string; title: string; base_price: number; eta_minutes: number; }
interface Agent { id: string; full_name: string; pincode: string; rating: number; total_jobs: number; bio: string | null; }

export const Route = createFileRoute("/book/$serviceId")({
  head: () => ({ meta: [{ title: "Book service — FalconLink AI" }] }),
  component: BookPage,
});

function BookPage() {
  const { serviceId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void supabase.from("services").select("id,title,base_price,eta_minutes").eq("id", serviceId).maybeSingle().then(({ data }) => setService(data as Service | null));
  }, [serviceId]);

  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [user, loading, navigate]);

  const findAgents = async () => {
    if (!/^\d{6}$/.test(pincode)) return toast.error("Enter a valid 6-digit pincode");
    setSearching(true);
    const { data } = await supabase.from("agents")
      .select("id,full_name,pincode,rating,total_jobs,bio")
      .eq("verified", true)
      .or(`pincode.eq.${pincode},service_areas.cs.{${pincode}}`)
      .order("rating", { ascending: false }).limit(10);
    setAgents((data ?? []) as Agent[]);
    setSearching(false);
    if (!data || data.length === 0) toast.info("No agents in this pincode yet — booking will go to admin pool.");
  };

  const submit = async () => {
    if (!user || !service) return;
    if (!/^\d{6}$/.test(pincode)) return toast.error("Pincode required");
    setSubmitting(true);
    const { data, error } = await supabase.from("bookings").insert({
      customer_id: user.id, service_id: service.id, agent_id: agentId,
      pincode, address, scheduled_at: scheduledAt || null, notes,
      price: service.base_price, status: agentId ? "assigned" : "pending",
    }).select("id").single();
    if (error || !data) { setSubmitting(false); return toast.error(error?.message ?? "Failed"); }
    await supabase.from("booking_events").insert({ booking_id: data.id, status: agentId ? "assigned" : "pending", note: "Booking created" });
    await supabase.from("notifications").insert({ user_id: user.id, title: "Booking confirmed", body: `Your ${service.title} booking is being processed.`, link: "/bookings" });
    toast.success("Booking created!");
    navigate({ to: "/bookings" });
  };

  if (!service) return <PageLayout><div className="py-20 text-center text-muted-foreground">Loading...</div></PageLayout>;

  return (
    <PageLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <h1 className="font-display text-3xl font-bold">Book: {service.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Starting ₹{service.base_price} · ~{Math.round(service.eta_minutes/60)}h</p>

        <div className="mt-8 space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display font-semibold">1. Where do you need this?</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Pincode</Label>
                <Input value={pincode} onChange={(e) => setPincode(e.target.value)} maxLength={6} placeholder="110001" className="mt-1 h-11 rounded-xl" />
              </div>
              <div className="flex items-end">
                <Button onClick={findAgents} disabled={searching} variant="outline" className="h-11 w-full rounded-xl">
                  {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />} Find agents
                </Button>
              </div>
            </div>
            <Label className="mt-3 block">Address (optional)</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House / Street / Area" className="mt-1 h-11 rounded-xl" />
          </section>

          {agents.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-display font-semibold">2. Choose an agent</h2>
              <div className="mt-3 grid gap-2">
                {agents.map((a) => (
                  <button key={a.id} onClick={() => setAgentId(a.id)} className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${agentId === a.id ? "border-primary bg-accent" : "border-border hover:border-primary/50"}`}>
                    <div>
                      <div className="font-medium">{a.full_name}</div>
                      <div className="text-xs text-muted-foreground">{a.bio ?? `Pincode ${a.pincode}`} · {a.total_jobs} jobs</div>
                    </div>
                    <div className="inline-flex items-center gap-1 text-sm"><Star className="h-3.5 w-3.5 fill-warning text-warning" />{a.rating}</div>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display font-semibold">3. Schedule & notes</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Preferred date/time</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="mt-1 h-11 rounded-xl" />
              </div>
            </div>
            <Label className="mt-3 block">Notes for agent</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 rounded-xl" />
          </section>

          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-5">
            <div className="inline-flex items-center gap-1 font-display text-xl font-bold"><IndianRupee className="h-5 w-5" />{service.base_price}</div>
            <Button onClick={submit} disabled={submitting} className="grad-primary text-primary-foreground shadow-glow">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />} Confirm booking
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
