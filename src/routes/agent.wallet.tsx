import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wallet, ArrowDownToLine, Loader2, ArrowLeft } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface WalletData { agent_id: string; available_balance: number; pending_balance: number; lifetime_earnings: number; }
interface Tx { id: string; type: string; amount: number; note: string | null; created_at: string; }
interface Wd { id: string; amount: number; status: string; created_at: string; upi_id: string | null; bank_account: string | null; }

export const Route = createFileRoute("/agent/wallet")({
  head: () => ({ meta: [{ title: "Wallet — Agent" }] }),
  component: AgentWallet,
});

function AgentWallet() {
  const { user, isAgent, loading } = useAuth();
  const navigate = useNavigate();
  const [agentId, setAgentId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [wds, setWds] = useState<Wd[]>([]);
  const [minWd, setMinWd] = useState(500);
  const [amount, setAmount] = useState("");
  const [upi, setUpi] = useState("");
  const [bank, setBank] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!loading && (!user || !isAgent)) navigate({ to: "/" }); }, [user, isAgent, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data: a } = await supabase.from("agents").select("id").eq("user_id", user.id).maybeSingle();
      if (!a) return;
      setAgentId(a.id);
      const [{ data: w }, { data: t }, { data: wdData }, { data: s }] = await Promise.all([
        supabase.from("agent_wallets").select("*").eq("agent_id", a.id).maybeSingle(),
        supabase.from("wallet_transactions").select("*").eq("agent_id", a.id).order("created_at", { ascending: false }).limit(50),
        supabase.from("withdrawal_requests").select("*").eq("agent_id", a.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("platform_settings").select("min_withdrawal").eq("id", 1).maybeSingle(),
      ]);
      setWallet((w as WalletData) ?? { agent_id: a.id, available_balance: 0, pending_balance: 0, lifetime_earnings: 0 });
      setTxs((t ?? []) as Tx[]);
      setWds((wdData ?? []) as Wd[]);
      setMinWd(s?.min_withdrawal ?? 500);
    })();
  }, [user]);

  const requestWd = async () => {
    if (!agentId) return;
    const amt = Number(amount);
    if (!amt || amt < minWd) return toast.error(`Min withdrawal ₹${minWd}`);
    if (amt > (wallet?.available_balance ?? 0)) return toast.error("Insufficient available balance");
    if (!upi && !(bank && ifsc)) return toast.error("Enter UPI ID or bank+IFSC");
    setSubmitting(true);
    const { error } = await supabase.from("withdrawal_requests").insert({
      agent_id: agentId, amount: amt, upi_id: upi || null, bank_account: bank || null, ifsc: ifsc || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Withdrawal requested");
    setAmount(""); setUpi(""); setBank(""); setIfsc("");
    // reload
    const { data: wdData } = await supabase.from("withdrawal_requests").select("*").eq("agent_id", agentId).order("created_at", { ascending: false }).limit(20);
    setWds((wdData ?? []) as Wd[]);
  };

  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <Link to="/agent" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Agent</Link>
        <h1 className="mt-3 font-display text-3xl font-bold">Wallet</h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Available" value={wallet?.available_balance ?? 0} accent />
          <Stat label="Pending" value={wallet?.pending_balance ?? 0} />
          <Stat label="Lifetime earnings" value={wallet?.lifetime_earnings ?? 0} />
        </div>

        <Tabs defaultValue="withdraw" className="mt-8">
          <TabsList>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="requests">My requests</TabsTrigger>
          </TabsList>

          <TabsContent value="withdraw" className="mt-4">
            <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Min withdrawal: ₹{minWd}. Admin will manually transfer to your UPI/bank.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label>Amount (₹)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 h-11 rounded-xl" /></div>
                <div><Label>UPI ID</Label><Input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="yourname@upi" className="mt-1 h-11 rounded-xl" /></div>
                <div><Label>OR Bank account</Label><Input value={bank} onChange={(e) => setBank(e.target.value)} className="mt-1 h-11 rounded-xl" /></div>
                <div><Label>IFSC</Label><Input value={ifsc} onChange={(e) => setIfsc(e.target.value)} className="mt-1 h-11 rounded-xl" /></div>
              </div>
              <Button onClick={requestWd} disabled={submitting} className="grad-primary text-primary-foreground">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowDownToLine className="mr-2 h-4 w-4" />} Request withdrawal
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-2">
            {txs.length === 0 && <Empty text="No transactions yet." />}
            {txs.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                <div>
                  <div className="font-medium capitalize">{t.type.replace(/_/g, " ")}</div>
                  <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}{t.note ? ` · ${t.note}` : ""}</div>
                </div>
                <div className={`font-semibold ${t.type === "debit_withdrawal" ? "text-destructive" : "text-success"}`}>{t.type === "debit_withdrawal" ? "-" : "+"}₹{t.amount}</div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="requests" className="mt-4 space-y-2">
            {wds.length === 0 && <Empty text="No withdrawal requests yet." />}
            {wds.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                <div>
                  <div className="font-medium">₹{w.amount}</div>
                  <div className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString()} · {w.upi_id ?? w.bank_account}</div>
                </div>
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase">{w.status}</span>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /><span className="text-xs uppercase text-muted-foreground">{label}</span></div>
      <div className="mt-2 font-display text-2xl font-bold">₹{value}</div>
    </div>
  );
}
function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{text}</div>; }
