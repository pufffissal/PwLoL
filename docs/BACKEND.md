# Connecting Supabase + Claude

The app works offline out of the box. This guide connects it to:

- **Supabase** for regions (lore), anonymous auth, and saving each reader's tales
- **Claude** (Anthropic API), called **only** from a Supabase Edge Function, for the storyteller

```
┌──────────────┐  supabase-js (anon key + user JWT)  ┌─────────────────────────────┐
│  Expo app    │ ───────────────────────────────────▶ │ Supabase                    │
│              │   select regions / upsert tales      │  Postgres + RLS             │
│              │                                      │  Auth (anonymous sign-in)   │
│              │   functions.invoke('storyteller')    │  Edge Function: storyteller │──▶ Claude API
└──────────────┘ ───────────────────────────────────▶ └─────────────────────────────┘   (ANTHROPIC_API_KEY
                                                                                          lives only here)
```

> **Never put your Anthropic API key in the app.** Anything in an APK can be extracted.
> The Edge Function holds the key; the app only ever has the public Supabase anon key.

## 1. Create the Supabase project

1. Create a project at <https://supabase.com/dashboard>.
2. **Authentication → Sign In / Providers → enable "Allow anonymous sign-ins".**
   Readers get a private account silently. You can later let them link an email/OAuth identity.
3. Copy **Project URL** and **anon public key** from *Project Settings → API*.

## 2. Install the Supabase CLI and link

```bash
npm i -g supabase            # or: brew install supabase/tap/supabase
supabase login
supabase link --project-ref YOUR-PROJECT-REF
```

## 3. Create tables and seed the lore

```bash
npm run seed:sql             # regenerates the seed from src/data/regions.ts (optional)
supabase db push             # applies supabase/migrations/*.sql
```

This creates:

| Table | Purpose | Access (RLS) |
|---|---|---|
| `regions` | Lore content, sections as JSONB | Everyone can read; nobody can write from the app |
| `tales` | Saved storyteller conversations | Each user can read/write only their own rows |
| `storyteller_usage` | Token usage + rate limiting | No client access; only the Edge Function (service role) |

Edit lore from the Supabase Table Editor. The app picks up changes on pull-to-refresh.

## 4. Deploy the storyteller Edge Function

Get an API key from <https://platform.claude.com/> (Settings → API keys), then:

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
# optional overrides:
supabase secrets set STORYTELLER_MODEL=claude-opus-5-5      # default
supabase secrets set STORYTELLER_HOURLY_LIMIT=40            # requests per user per hour

supabase functions deploy storyteller
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected into Edge Functions automatically.

JWT verification stays **on** (the default), so only signed-in app users can call the function.

### What the function does (`supabase/functions/storyteller/index.ts`)

1. Verifies the caller's Supabase JWT.
2. Validates and trims the conversation (last 24 turns, 2,000 chars per user message, alternating roles).
3. Enforces a per-user hourly limit using `storyteller_usage`.
4. Looks up the chosen region and adds it to the system prompt.
5. Calls Claude through the official SDK (`npm:@anthropic-ai/sdk`):
   - `model: claude-opus-5-5`, `output_config.effort: "low"` (fast, inexpensive chat turns)
   - The system prompt is marked with `cache_control`, so repeated turns reuse the cached prefix
   - Server-side refusal **fallbacks** (`fallbacks: "default"` + beta `server-side-fallback-2026-07-01`):
     if a safety classifier declines, the API retries on a suitable model in the same call
   - Handles `stop_reason: "refusal"` with an in-character message
6. Logs token usage, then returns `{ reply }`. The reply ends with three `» suggested actions`, which the app shows as tappable chips.

**Cost tip:** for a high-traffic app you can switch to a cheaper model with
`supabase secrets set STORYTELLER_MODEL=claude-haiku-5-5` and redeploy. Test story quality before you do.

### Test it from the terminal

```bash
# Get a user token: sign in anonymously via the REST API
TOKEN=$(curl -s -X POST "https://YOUR-PROJECT-REF.supabase.co/auth/v1/signup" \
  -H "apikey: YOUR-ANON-KEY" -H "Content-Type: application/json" -d '{}' | jq -r .access_token)

curl -s "https://YOUR-PROJECT-REF.supabase.co/functions/v1/storyteller" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"regionId":"zaun","messages":[{"role":"user","content":"I wake up in a chem-baron'\''s workshop."}]}'
```

## 5. Point the app at your project

```bash
cp .env.example .env
# fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
npx expo start
```

The dashboard chip changes from **Offline lore** to **Synced** once regions load from Supabase.

For APKs built by GitHub Actions, add the same two values as **repository secrets**
(*Settings → Secrets and variables → Actions*): `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
Then re-run the **Android APK** workflow.

## Local development of the function (optional)

```bash
supabase start                                  # local Postgres + Auth (Docker)
supabase functions serve storyteller --env-file supabase/.env.local
# supabase/.env.local contains ANTHROPIC_API_KEY=sk-ant-...  (git-ignored)
```
