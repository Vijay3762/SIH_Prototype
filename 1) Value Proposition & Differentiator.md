1) Value Proposition & Differentiator

Today vs us:
Today: eco-clubs, one-day drives, quiz-only apps; little habit formation, no verification, poor local relevance, weak reporting.
Prakriti Odyssey: Tamagotchi care–play–evolve loop tied to real, verifiable actions; adaptive quests; school/NGO/CSR dashboards with auditable impact.
What’s uniquely different:
Tamagotchi loop: students nurture an eco‑pet that grows only with verified sustainable actions.
Verified actions: geo-QR check-ins, EXIF/GPS/time, AI vision checks, duplicate hashing, trust score, random sampling; near zero extra teacher workload.
Adaptive learning: quests adapt by skill, interest, and local context; difficulty calibrated over time.
SaaS at scale: multi-tenant onboarding in minutes; seasonal content and updates roll out to all tenants instantly; national roll-ups for CSR/Govt.
Pedagogy value chain:
Hook: story scenes (bird/river/forest perspectives) connect emotion to ecology.
Practice: mini-games (Recycle-Sort, Bubble-Pop, Fetch) build literacies.
Act: real-world missions (tree planting, waste segregation, cycling to school).
Verify: automated checks + reviewer queue when needed.
Reflect/Assess: micro‑prompts + 3–5 Q formative assessment.
Reinforce: streaks, badges, eco‑pet growth, school competitions.
Community: leaderboards, class challenges, school-wide goals.
Next: story beat progresses only with real impact, sustaining engagement.
2) Detailed Technical Architecture (End-to-End)

Frontend
Next.js (App Router) + React + Tailwind for PWA UX; offline caching via service worker.
Game layer: Phaser 3 for 2D mini‑games; react‑three‑fiber (Three.js) for pet/room visuals.
TF.js in-browser: quick object presence checks (tree/bin/bicycle), basic spoof heuristics, privacy-preserving client-side filters.
Backend/SaaS
Supabase: Postgres (source of truth), Auth (JWT/RBAC), Storage (evidence), Realtime (leaderboards/notifications), Edge Functions (secure server logic).
Background jobs: Edge Functions + CRON (e.g., nightly quest rotation, streak decay, sampling reviews).
Media pipeline: uploads to Supabase Storage (S3-compatible); image compression, perceptual hashing, EXIF parse; signed URLs; lifecycle policies.
AI/ML
Client-side TF.js: fast checks to reduce spam and latency; runs on student device.
Server-side TensorFlow (Python + FastAPI): heavier models—scene validation, monthly sapling growth deltas, recommendation bandits, difficulty modeling.
Deployment: TFLite for mobile (when packaged) and TF Serving/Cloud Run for scalable inference.
Verification pipeline (multi-layer)
Metadata: EXIF timestamp, GPS within geo-fence, QR check-ins at location.
Vision: object detection and anti-spoof heuristics; near-duplicate detection via perceptual hash.
Trust score: per-student dynamic score influences auto-approve thresholds and sampling rates.
Reviewer queue: teacher/NGO sees only flagged/low-confidence items; actions are audited.
Real-time & scale
Supabase Realtime: update leaderboards, notify approvals, reflect pet growth instantly.
CDN for static assets; Storage presigned URLs for media; horizontal scale for API/ML.
Security & privacy
Row-Level Security (RLS) by school_id with JWT claims; strict least-privilege RBAC.
Minimal PII; explicit consent flows; audit logs; rate limits; India DPDP-aligned data retention.
Multi-tenancy
All rows scoped by school_id (or org_id if NGO aggregation is needed); RLS policies enforce isolation.
Onboarding: create school, roles, defaults, and seed starter content in one step.
Seasonal content updates propagate across tenants with feature flags and versioning.
3) Data Model & Storage Strategy

Core tables (selected)
schools(id, name, state, org_id?, settings_json)
users(id, email, role, school_id, coins, badges_json, trust_score, avatar_url)
pets(id, user_id, species, stage, hunger, energy, cleanliness, mood, accessories_json, updated_at)
quests(id, school_id, type, title, description, assigned_by, rewards_json, deadline, tags_json, difficulty, is_active)
quest_assignments(id, quest_id, user_id, status, due_at, assigned_at)
submissions(id, quest_id, user_id, status, media_url, meta_json, ai_confidence, reviewer_id?, reviewed_at)
leaderboard_entries(id, scope, school_id, period, user_id, score, last_updated_at)
badges(id, code, name, description, criteria_json, icon_url)
eco_points_ledger(id, user_id, amount, reason, quest_id?, submission_id?, created_at)
events(id, school_id, user_id?, type, payload_json, occurred_at) for telemetry/analytics.
content_modules(id, code, title, locale, version, body_json, published_at) for story/lessons.
Storage layout (Supabase Storage)
Buckets: evidence/, avatars/, content_assets/.
Evidence path: evidence/{school_id}/{user_id}/{submission_id}.jpg.
Policies: only owner + reviewers can read; public access disabled; signed URL for reviewer preview.
Caching strategy
Browser (IndexedDB): current pet state snapshot, assigned quests, last N leaderboard entries, lesson assets; enables offline play and delayed sync.
Browser (localStorage): auth session token (managed by Supabase client), lightweight feature flags.
Postgres: everything authoritative—users, quests, submissions, points, leaderboards.
Object storage: heavy binary media (images/videos) only; metadata mirrored in submissions.meta_json.
RLS examples (Supabase)
Claims: JWT includes school_id, role, user_id.
Example policy for submissions select: using (school_id = auth.jwt()->>'school_id').
Example policy for submissions insert: with check (user_id = auth.uid() and school_id = auth.jwt()->>'school_id').
Reviewer read: using (school_id = auth.jwt()->>'school_id' and (auth.jwt()->>'role') in ('teacher','admin','ngo')).
Points award trigger (concept)
On submissions.status = 'approved', insert to eco_points_ledger, update users.coins, enqueue pet growth update event.
4) Content Generation & Pedagogy Ops

Authoring
Quest builder: define type (quiz/photo/qr/activity), learning goal, SDG tag, rubrics, reward, deadlines, geofence/QR if applicable.
Versioning: content_modules.version with is_active flags; safe rollout and rollback.
Localization: content_modules(locale=hi-IN, en-IN, ta-IN, …) with asset fallbacks.
Mini-games → outcomes
Recycle‑Sort: classify waste streams → waste literacy, contamination awareness.
Bubble‑Pop: pollutant avoidance gameplay → air quality concepts.
Fetch: rewards loop & care tasks → persistence, responsibility to eco‑pet.
Adaptive sequencing
Knowledge tracing: simple Bayesian mastery per tag; increase/decrease difficulty.
Bandits: epsilon‑greedy or UCB to balance novelty vs mastery; cap exploration for fairness.
Reflection & assessment
Micro‑prompts post‑mission; short quizzes (3–5 Qs) feed mastery model; immediate feedback.
Teacher dashboards can view learning goal attainment without grading overhead.
5) AI/ML: Models & Decisions

Vision (server)
Object detection: small CNN/SSD variants for tree/bin/bicycle presence; latency target <300ms/image on GPU; quantized for cost.
Spoof checks: perceptual hash (pHash) for duplicates, EXIF sanity, edge/texture anomalies; scene consistency (sky/soil for saplings).
Growth deltas: monthly sapling image comparison (keypoint matching + canopy area estimation).
Vision (client)
TF.js lightweight classifier to reject obvious spam before upload; runs offline if needed; avoids sending junk media.
Recommenders
Hybrid: content-based (tags, difficulty, context like “available at home”) + CF from similar students; multi-armed bandits to learn best next quest.
Difficulty calibration: IRT-style or simpler success-rate smoothing per user×tag.
Analytics
Cohorts by school/class; funnels: assigned → started → submitted → approved; D1/D7 retention, streaks, verified actions; CSV exports.
Explainability & bias
Store model scores with features and decision reason codes; per‑region/device error analysis; enforce thresholds that do not penalize low-end devices; human review escape hatch.
6) Why This Stack (Definitive, Tied to Problem)

Supabase + Postgres
Verifiable actions need relational joins (student→submission→quest→reviewer) and RLS for multi‑tenant school data—clean in SQL, hard in NoSQL rules.
Real-time leaderboards via Realtime; Storage tightly integrated for evidence with signed URLs; open SQL for CSR/Govt analytics without ETL pain.
Versus Firebase/Firestore: NoSQL complicates audits/joins, rule complexity, eventual consistency pitfalls for points/leaderboards; cost unpredictability.
Versus Mongo/Hasura: Mongo lacks RLS; Hasura great for GraphQL but still relies on underlying SQL/RLS patterns we get natively in Supabase.
TensorFlow + TF.js/TFLite
Same family from browser to server to mobile; mature quantization + on-device inference; TF.js runs in web without native installs.
Versus PyTorch: great research ecosystem, but TF.js/TFLite offer smoother web/on-device path which we need for client-side checks and low-latency UX.
Next.js + Phaser/r3f
Browser-first delivery for schools (no installs); PWA + edge rendering; easy distribution in constrained labs; Phaser/r3f deliver delightful gameplay.
Versus Unity mobile: powerful, but heavier installs, device fragmentation, and distribution hurdles for schools; web-first maximizes reach.
7) SaaS Commercial Model & CSR Fit

Multi-tenant onboarding
Self-serve: create school → invite teachers/students → auto-seed starter content → ready in minutes.
Central updates: push seasonal missions (World Environment Day), national challenges.
Pricing sketch
Schools: annual per-student plan with tiered discounts.
CSR/NGO: per‑student sponsorship, campaign modules, national reporting add‑on.
Why NGOs/CSR love it
Verified, auditable impact with evidence trails; roll-up dashboards; campaign tooling; easy exports for reporting and audits.
8) Risks & Mitigations

Cheating/fakes: layered verification, trust score, random sampling, reviewer queue, anomaly detection on submission velocity and hashes.
Low bandwidth: offline caches, compressed uploads, deferred sync, QR-only missions for no‑camera devices.
Privacy: minimal PII, consent flows, media retention windows, encryption in transit, strict RLS; parent/guardian controls for minors.
Model drift: scheduled retraining using events telemetry; A/B guarded rollouts; monitor precision/recall and false positive rates.
9) Mini Roadmap

MVP: story quests, eco‑pet, photo + QR missions, basic verification, leaderboards, teacher review queue.
Next: PWA install, push notifications, more languages, CSR dashboards, richer bandits, sapling growth tracker, offline-first refinements.
Later: IoT hooks (smart bins/meters), state-wise pilots with NGC/NGOs, teacher professional development modules.
End-to-End Data Flow Narrative

“Plant a sapling” mission
Assign: system assigns quest Q123 (type photo, geofenced school garden) to user U42; stored in quest_assignments.
Act: student takes photo; TF.js checks “tree-like” presence and rejects obvious spam; EXIF/time/GPS captured.
Upload: media stored at evidence/{school_id}/{user_id}/{submission_id}.jpg; submissions row created with status='pending', meta_json includes exif, gps, phash.
Verify: server TF validates scene; geofence + timestamp pass; trust score 0.78 > auto-approve threshold 0.7 → status='approved'.
Award: trigger writes +25 eco‑points to eco_points_ledger; users.coins increments; pets.stage may advance; event emitted.
Real-time: Supabase Realtime pushes leaderboard delta to class; student sees pet grow; teacher dashboard increments verified impact counter.
Report: school/CSR dashboard aggregates approved actions by tag “tree-planting” for monthly report with media sampling links.
Representative APIs & Jobs

Public (authed)
POST /api/submissions body: quest_id, media_url, meta; returns submission_id.
GET /api/leaderboard?scope=school&period=weekly returns top N with tie-break rules.
Reviewer
POST /api/review/{submission_id}/decision body: approved|rejected, reason?; audits decisions.
Jobs/Edge Functions
Nightly: recompute leaderboards, decay streaks, sample low‑trust approvals for human spot checks.
Gamification Mechanics (Key Rules)

Eco‑points economy: base points per quest × difficulty multiplier; daily cap; streak bonus +min(5, streak_days); anti-grind decay if many low-value repeats.
Pet growth: finite stages (seedling→sapling→young tree→forest guardian); thresholds based on verified points + diversity of quest tags to avoid single-action grinding.
Leaderboards: tie-break by streak length, unique tags count, earliest completion time.
Security & Compliance Highlights

RLS on all student data; JWT embeds school_id, role, user_id.
Audit logs in events for submissions, reviews, policy changes.
Consent: record consent scope/guardian status; honor deletion requests via soft-delete + media purge.
DPDP posture: data minimization, purpose limitation, retention schedules, breach response plan.
What Lives Where (Storage Recap)

IndexedDB: assigned quests, pet snapshot, lesson content cache, last leaderboard view (encrypted at-rest via browser storage where available).
localStorage: Supabase session token, feature flags (non-sensitive).
Postgres: all relational data and analytics events.
Storage: evidence media only; metadata in Postgres; strict signed URL access.
This deep dive connects every design and tech choice to the core problem: moving from theoretical awareness to daily, verified environmental action with measurable, auditable impact at school and national scales.