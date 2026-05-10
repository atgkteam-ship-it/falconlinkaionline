import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";
import { createClient } from "@supabase/supabase-js";

const SYSTEM = `You are FalconLink AI — a smart operating system for an Indian government services platform (PAN, Aadhaar, Passport, certificates, GST, etc.).
Users write in Hindi, English or Hinglish like "PAN card banana hai" or "Aadhaar update karna hai".

Your job:
1. Detect the user's intent and find the matching service from the catalog using the find_services tool.
2. Tell them required documents, estimated price (in INR ₹) and time.
3. If they share a pincode, use find_agents to recommend verified local agents.
4. Help them book by guiding step-by-step. Be warm, concise, and use markdown.
5. For support questions, answer helpfully. For unrelated topics, gently redirect.

Always be friendly and respond in the same language/style the user used. Use ₹ for prices.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const body = (await request.json()) as { messages?: unknown };
        if (!Array.isArray(body.messages)) return new Response("Bad request", { status: 400 });

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const supabaseUrl = process.env.SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const sb = createClient(supabaseUrl, supabaseKey);

        const gateway = createLovableAiGatewayProvider(apiKey);
        const model = gateway("google/gemini-3-flash-preview");

        const tools = {
          find_services: tool({
            description: "Search the catalog of services (PAN, Aadhaar, Passport, certificates, etc.) by keyword.",
            inputSchema: z.object({ query: z.string().describe("Service keyword in any language") }),
            execute: async ({ query }) => {
              const { data } = await sb.from("services").select("id,slug,title,description,category,base_price,eta_minutes,required_documents").eq("active", true);
              const q = query.toLowerCase();
              const matches = (data ?? []).filter((s) =>
                s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.slug.includes(q)
              ).slice(0, 5);
              return matches.length ? matches : (data ?? []).slice(0, 5);
            },
          }),
          find_agents: tool({
            description: "Find verified local agents by pincode (India). Returns top-rated agents in the area.",
            inputSchema: z.object({ pincode: z.string().regex(/^\d{6}$/, "6-digit Indian pincode") }),
            execute: async ({ pincode }) => {
              const { data } = await sb.from("agents")
                .select("id,full_name,pincode,service_areas,rating,total_jobs,bio")
                .eq("verified", true)
                .or(`pincode.eq.${pincode},service_areas.cs.{${pincode}}`)
                .order("rating", { ascending: false })
                .limit(5);
              return data ?? [];
            },
          }),
          estimate_pricing: tool({
            description: "Get pricing and ETA for a service by slug.",
            inputSchema: z.object({ slug: z.string() }),
            execute: async ({ slug }) => {
              const { data } = await sb.from("services").select("title,base_price,eta_minutes,required_documents").eq("slug", slug).maybeSingle();
              return data ?? { error: "not found" };
            },
          }),
        };

        const result = streamText({
          model,
          system: SYSTEM,
          tools,
          stopWhen: stepCountIs(50),
          messages: await convertToModelMessages(body.messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
