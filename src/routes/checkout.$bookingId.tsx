import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IndianRupee, Upload, CheckCircle2, Loader2, CreditCard, QrCode, Info } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface Booking { id: string; price: number; customer_id: string; payment_status: string; services: { title: string } | null; }
interface Settings { commission_pct: number; upi_id: string | null; upi_qr_url: string | null; upi_payee_name: string | null; }

export const Route = createFileRoute("/checkout/$bookingId")({
  head: () => ({ meta: [{ title: "Checkout — FalconLink AI" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { bookingId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [utr, setUtr] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [user, loading, navigate]);

  useEffect(() => {
    void (async () => {
      const [{ data: b }, { data: s }] = await Promise.all([
        supabase.from("bookings").select("id,price,customer_id,payment_status,services(title)").eq("id", bookingId).maybeSingle(),
        supabase.from("platform_settings").select("commission_pct,upi_id,upi_qr_url,upi_payee_name").eq("id", 1).maybeSingle(),
      ]);
      setBooking(b as unknown as Booking);
      setSettings(s as Settings);
    })();
  }, [bookingId]);

  const submitUpi = async () => {
    if (!user || !booking) return;
    if (!utr.trim() || utr.length < 6) return toast.error("Enter a valid UTR / Transaction ID");
    setSubmitting(true);
    let proofUrl: string | null = null;
    if (file) {
      const path = `${user.id}/${bookingId}-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, file);
      if (upErr) { setSubmitting(false); return toast.error(upErr.message); }
      proofUrl = path;
    }
    const commission = Math.round((booking.price * (settings?.commission_pct ?? 15)) / 100);
    const agent_amount = booking.price - commission;
    const { error } = await supabase.from("payments").insert({
      booking_id: booking.id, amount: booking.price, commission, agent_amount,
      method: "upi_manual", status: "pending", upi_utr: utr.trim(), upi_screenshot_url: proofUrl,
    });
    if (error) { setSubmitting(false); return toast.error(error.message); }
    await supabase.from("notifications").insert({ user_id: user.id, title: "Payment submitted", body: "Hum verify karke confirm kar denge.", link: "/bookings" });
    toast.success("Payment submitted — admin will verify shortly");
    navigate({ to: "/bookings" });
  };

  if (!booking) return <PageLayout><div className="py-20 text-center text-muted-foreground">Loading...</div></PageLayout>;

  if (booking.payment_status === "paid") {
    return (
      <PageLayout>
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
          <h1 className="mt-4 font-display text-2xl font-bold">Already paid</h1>
          <p className="mt-2 text-sm text-muted-foreground">This booking is paid up.</p>
          <Button asChild className="mt-6"><Link to="/bookings">View bookings</Link></Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
        <h1 className="font-display text-3xl font-bold">Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">{booking.services?.title}</p>

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-border bg-card p-5">
          <span className="text-sm text-muted-foreground">Amount payable</span>
          <span className="inline-flex items-center font-display text-2xl font-bold"><IndianRupee className="h-5 w-5" />{booking.price}</span>
        </div>

        <Tabs defaultValue="upi" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upi"><QrCode className="mr-2 h-4 w-4" />UPI</TabsTrigger>
            <TabsTrigger value="card"><CreditCard className="mr-2 h-4 w-4" />Card / Stripe</TabsTrigger>
          </TabsList>

          <TabsContent value="upi" className="mt-4 space-y-4 rounded-2xl border border-border bg-card p-5">
            {settings?.upi_id ? (
              <>
                <div className="grid gap-4 sm:grid-cols-[200px_1fr] sm:items-start">
                  {settings.upi_qr_url ? (
                    <img src={settings.upi_qr_url} alt="UPI QR" className="h-48 w-48 rounded-xl border border-border bg-white object-contain p-2" />
                  ) : (
                    <div className="flex h-48 w-48 items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">No QR uploaded</div>
                  )}
                  <div className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">UPI ID: </span><span className="font-mono font-semibold">{settings.upi_id}</span></div>
                    {settings.upi_payee_name && <div><span className="text-muted-foreground">Payee: </span>{settings.upi_payee_name}</div>}
                    <div><span className="text-muted-foreground">Amount: </span>₹{booking.price}</div>
                    <p className="text-xs text-muted-foreground">QR scan kariye ya UPI ID se ₹{booking.price} bhejiye, fir UTR neeche daaliye.</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>UTR / Transaction ID</Label>
                    <Input value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="123456789012" className="mt-1 h-11 rounded-xl" />
                  </div>
                  <div>
                    <Label>Payment screenshot (optional)</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1 h-11 rounded-xl" />
                  </div>
                </div>

                <Button onClick={submitUpi} disabled={submitting} className="w-full grad-primary text-primary-foreground shadow-glow">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Submit payment for verification
                </Button>
              </>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                <Info className="mx-auto mb-2 h-5 w-5" />
                UPI not configured yet. Admin se kahein settings me UPI add karein.
              </div>
            )}
          </TabsContent>

          <TabsContent value="card" className="mt-4 rounded-2xl border border-border bg-card p-8 text-center">
            <CreditCard className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 font-semibold">Card payments coming soon</h3>
            <p className="mt-2 text-sm text-muted-foreground">Stripe checkout enable hone par yahan card / UPI auto-payment option milega.</p>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
