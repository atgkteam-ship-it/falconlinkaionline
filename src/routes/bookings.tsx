import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, MapPin, Clock } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface Booking {
  id: string; status: string; pincode: string; price: number;
  scheduled_at: string | null; created_at: string;
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

  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("bookings").select("id,status,pincode,price,scheduled_at,created_at,services(title,slug)").eq("customer_id", user.id).order("created_at", { ascending: false });
      setBookings((data ?? []) as unknown as Booking[]);
    };
    void load();
    const ch = supabase.channel("bookings-self").on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `customer_id=eq.${user.id}` }, () => void load()).subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user]);

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
              <div className="text-right">
                <div className="font-display text-lg font-bold">₹{b.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
