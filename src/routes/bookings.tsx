import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, MapPin, Clock, Star } from "lucide-react";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface Booking {
  id: string; status: string; pincode: string; price: number;
  scheduled_at: string | null; created_at: string; agent_id: string | null;
  services: { title: string; slug: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  assigned: "bg-primary/15 text-primary",
  in_progress: "bg-primary/20 text-primary",
  completed: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
};

export const Route = createFileRoute("/bookings")({
  head: () => ({ meta: [{ title: "My Bookings — FalconLink AI" }] }),
  component: BookingsPage,
});

function BookingsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [reviewing, setReviewing] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("bookings")
        .select("id,status,pincode,price,scheduled_at,created_at,agent_id,services(title,slug)")
        .eq("customer_id", user.id).order("created_at", { ascending: false });
      setBookings((data ?? []) as unknown as Booking[]);
      const { data: reviews } = await supabase.from("reviews").select("booking_id").eq("customer_id", user.id);
      setReviewed(new Set((reviews ?? []).map((r) => r.booking_id)));
    };
    void load();
    const ch = supabase.channel("bookings-self").on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `customer_id=eq.${user.id}` }, () => void load()).subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user]);

  const submitReview = async () => {
    if (!user || !reviewing || !reviewing.agent_id) return;
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      booking_id: reviewing.id, customer_id: user.id, agent_id: reviewing.agent_id,
      rating, comment: comment || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Thanks for your review!");
    setReviewed(new Set([...reviewed, reviewing.id]));
    setReviewing(null); setComment(""); setRating(5);
  };

  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <h1 className="font-display text-3xl font-bold">My Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live updates from your assigned agents.</p>

        <div className="mt-8 space-y-3">
          {bookings.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No bookings yet. <Link to="/services" className="text-primary hover:underline">Browse services</Link>
            </div>
          )}
          {bookings.map((b) => (
            <div key={b.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold">{b.services?.title ?? "Service"}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_COLORS[b.status] ?? "bg-accent"}`}>{b.status.replace("_", " ")}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{b.pincode}</span>
                  {b.scheduled_at && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(b.scheduled_at).toLocaleString()}</span>}
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(b.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                <div className="font-display text-lg font-bold">₹{b.price}</div>
                {b.status === "completed" && b.agent_id && !reviewed.has(b.id) && (
                  <Button size="sm" variant="outline" onClick={() => setReviewing(b)}>
                    <Star className="mr-1 h-3 w-3" /> Rate agent
                  </Button>
                )}
                {reviewed.has(b.id) && <span className="text-xs text-muted-foreground">✓ Reviewed</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!reviewing} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate your experience</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <div className="text-sm text-muted-foreground">{reviewing?.services?.title}</div>
              <div className="mt-3 flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                    <Star className={`h-8 w-8 transition ${n <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell others about your experience (optional)" rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewing(null)}>Cancel</Button>
            <Button onClick={submitReview} disabled={submitting} className="grad-primary text-primary-foreground">
              {submitting ? "Submitting..." : "Submit review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
