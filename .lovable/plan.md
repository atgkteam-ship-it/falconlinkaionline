# FalconLink AI — Build Plan (V1 Full MVP)

A premium, AI-first platform for India where users describe a need in plain Hindi/English (e.g. "PAN card banana hai") and the AI handles intent detection, service creation, agent matching by pincode, pricing/time estimates, and bookings.

## 1. Design Direction

- **Palette**: White `#ffffff`, surface `#f5f7fb`, primary blue `#1a73e8`, deep navy `#0a2540` (semantic tokens in `src/styles.css`, oklch).
- **Style**: Uber/Urban Company-inspired — clean white UI, electric blue accents, glassmorphism cards, soft shadows, rounded-2xl, smooth Framer Motion transitions.
- **Typography**: Space Grotesk (display) + Inter (body).
- **Dark mode**: full token-based dark theme.
- **Mobile-first**, fully responsive.

## 2. Pages & Routes (TanStack Start)

```text
/                       Landing (hero + AI prompt bar + how it works)
/services               AI-generated service catalog (PAN, Aadhaar, Birth cert, etc.)
/services/$slug         Service detail + booking CTA
/ai                     Full AI assistant (chat + actions)
/book/$serviceId        Booking flow (pincode → agent match → schedule)
/bookings               Customer bookings + live status
/agents/apply           Agent registration panel
/_authenticated/agent   Agent dashboard (jobs, earnings, ratings)
/_authenticated/admin   Admin dashboard (users, agents, bookings, services)
/login                  Email + Google sign-in
/auth/callback          OAuth callback
```

Each route gets its own `head()` with unique title/description/OG tags. SEO + manifest for installable PWA (manifest only, no SW — per Lovable PWA guidance).

## 3. AI Layer (Gemini via Lovable AI Gateway)

Server function `runAssistant` (TanStack `createServerFn`) using Vercel AI SDK + Lovable AI Gateway with `google/gemini-3-flash-preview`. Tools the AI can call:

- `detectIntent(query)` → service category + urgency
- `suggestService({intent})` → matching service + required documents + price + ETA
- `findAgents({serviceId, pincode})` → ranked agents from DB
- `createBooking({serviceId, agentId, pincode, address, schedule})`
- `getBookingStatus({bookingId})`
- `supportFAQ({topic})`

The `/ai` page renders streamed assistant messages with tool-result cards (service preview, agent cards, booking confirmation). Markdown rendering with `react-markdown`.

## 4. Backend (Lovable Cloud)

Tables (all with RLS):

- `profiles` (id, full_name, phone, pincode, role-less)
- `user_roles` (user_id, role: `customer|agent|admin`) — separate table, `has_role()` SECURITY DEFINER
- `services` (id, slug, title, description, category, base_price, eta_minutes, required_documents jsonb, ai_generated bool)
- `agents` (id user_id, full_name, phone, pincode, service_areas text[], verified bool, rating, total_jobs, bio, id_proof_url)
- `bookings` (id, customer_id, agent_id, service_id, pincode, address, scheduled_at, status: `pending|assigned|in_progress|completed|cancelled`, price, notes)
- `booking_events` (booking_id, status, note, created_at) — for live tracking timeline
- `reviews` (booking_id, customer_id, agent_id, rating, comment)
- `notifications` (user_id, title, body, link, read_at)
- `ai_conversations` + `ai_messages` (threaded chat history)

Realtime enabled on `bookings`, `booking_events`, `notifications` for live tracking + toast notifications.

Auth: Email/password + Google OAuth. Admin login: seed one admin user (you'll set credentials via the admin setup flow on first run).

Agent matching: pincode-only — query `agents` where `pincode = $1 OR $1 = ANY(service_areas)` AND `verified = true`, ordered by `rating DESC, total_jobs DESC`.

## 5. Customer Panel

- AI prompt bar on every page (sticky on mobile)
- Service browse + detail
- Booking flow: pincode → agent list → select → schedule → confirm
- "My Bookings" with realtime status timeline
- Reviews after completion
- Notification bell (realtime)

## 6. Agent Panel

- `/agents/apply` public form: name, phone, pincode, service_areas, ID proof upload (Cloud Storage), bio
- After admin verification → `/_authenticated/agent` dashboard: incoming jobs, accept/decline, mark in-progress/complete, earnings, rating

## 7. Admin Dashboard

- KPIs (users, agents, bookings, revenue)
- Verify agents (approve/reject)
- Manage services (AI can auto-generate via Gemini: title, description, docs, price, ETA)
- Manage bookings (override status, reassign)
- Users table
- AI command bar — admin types "verify all agents in 110001 with 5+ ratings" → AI executes via tools
- Protected by `admin` role check in `_authenticated/admin` layout

## 8. Build Order (incremental)

1. Enable Lovable Cloud, create schema + RLS + roles + seed services
2. Design system tokens, theme, dark mode, layout shell, header/footer, PWA manifest
3. Landing page + service catalog + service detail (with mock-then-real data)
4. Auth (email + Google) + profile + role bootstrap
5. AI assistant page + Gemini server function + first 3 tools (intent, suggest, find agents)
6. Booking flow + realtime status + notifications
7. Agent application + agent dashboard
8. Admin dashboard + AI command bar + agent verification
9. Reviews + ratings + AI-generated service listings
10. Polish: animations, SEO heads per route, PWA manifest, responsive QA

## Technical Notes

- Stack: TanStack Start + React 19 + Tailwind v4 + shadcn/ui + Framer Motion + Lovable Cloud (Supabase) + Lovable AI Gateway (Gemini).
- AI calls server-side only via `createServerFn`; `LOVABLE_API_KEY` never reaches client.
- Roles in separate `user_roles` table with `has_role()` SECURITY DEFINER (no recursive RLS).
- Realtime via Supabase channels for bookings/notifications.
- Manifest-only PWA (installable, no service worker — avoids preview iframe issues).
- Maps deferred — pincode + service_areas array gives nearby matching now; Google Maps can be added later by providing an API key.

## Out of Scope for V1

- Payments / Stripe (add later)
- Google Maps + live GPS tracking (pincode-only for now)
- SMS/WhatsApp notifications (in-app + email only)
- Native mobile app (PWA covers install)

Given the size, I'll build this in the order above, shipping working slices each step rather than one giant change.
