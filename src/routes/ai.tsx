import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Loader2, Bot, User as UserIcon, Wrench } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { z } from "zod";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/ai")({
  validateSearch: searchSchema,
  head: () => ({ meta: [
    { title: "AI Assistant — FalconLink AI" },
    { name: "description", content: "Describe what you need. Our AI finds services, prices and verified agents." },
  ]}),
  component: AIPage,
});

function AIPage() {
  const { q } = Route.useSearch();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const sentInitial = useRef(false);

  useEffect(() => {
    if (q && !sentInitial.current) {
      sentInitial.current = true;
      void sendMessage({ text: q });
    }
  }, [q, sendMessage]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const submit = () => {
    const text = input.trim();
    if (!text || status === "submitted" || status === "streaming") return;
    void sendMessage({ text });
    setInput("");
  };

  const loading = status === "submitted" || status === "streaming";

  return (
    <PageLayout hideFooter>
      <div className="mx-auto flex h-[calc(100vh-65px)] max-w-3xl flex-col px-4 md:px-6">
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-6">
          {messages.length === 0 && (
            <div className="mx-auto max-w-xl text-center pt-16">
              <div className="grad-primary mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-glow"><Sparkles className="h-7 w-7 text-primary-foreground" /></div>
              <h1 className="mt-5 font-display text-2xl font-bold">How can I help you today?</h1>
              <p className="mt-2 text-sm text-muted-foreground">Try: "PAN card banana hai" or "Aadhaar update karna hai 110001"</p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {["PAN card banana hai","Aadhaar update karna hai","Passport renew chahiye","Birth certificate urgently"].map(p => (
                  <button key={p} onClick={() => sendMessage({ text: p })} className="rounded-xl border border-border bg-card p-3 text-left text-sm hover:border-primary transition">{p}</button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-5">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${m.role === "user" ? "bg-accent" : "grad-primary"}`}>
                    {m.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary-foreground" />}
                  </div>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "glass"}`}>
                    {m.parts.map((part, i) => {
                      if (part.type === "text") return (
                        <div key={i} className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-2">
                          <ReactMarkdown>{part.text}</ReactMarkdown>
                        </div>
                      );
                      if (part.type.startsWith("tool-")) {
                        return (
                          <div key={i} className="mt-2 rounded-lg border border-border bg-card/60 p-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5 font-medium"><Wrench className="h-3 w-3" /> {part.type.replace("tool-", "")}</div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 pb-6 pt-2">
          <div className="glass-strong flex items-end gap-2 rounded-2xl p-2 shadow-soft">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder="Tell the AI what you need..."
              rows={1}
              className="flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <Button onClick={submit} disabled={loading || !input.trim()} size="icon" className="grad-primary text-primary-foreground shadow-glow">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
