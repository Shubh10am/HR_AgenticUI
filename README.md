# HR Streamline AI

HR Streamline AI is a multi-tenant HR operations workspace. It combines employee and organization administration, attendance, leave and shifts, approvals, expenses, timesheets, payroll and payslips, performance, 1:1s, learning, rewards, surveys, equipment and app access, policies and letters, offboarding, people reports, recruitment assistance, Google Workspace integration, an organization-scoped knowledge base, a social community feed, an HR Copilot, and a separate platform administration console. It runs in the browser and can be installed on a phone as an app.

This README describes the modules that exist in this repository, how requests move through them, and how to run the application locally.

## Contents

- [Architecture at a glance](#architecture-at-a-glance)
- [Technology](#technology)
- [Repository map](#repository-map)
- [Application sections](#application-sections)
- [HR modules](#hr-modules)
- [Approval engine](#approval-engine)
- [Privacy rules](#privacy-rules)
- [API modules](#api-modules)
- [Authentication and authorization](#authentication-and-authorization)
- [AI and knowledge base](#ai-and-knowledge-base)
- [Google Workspace integration](#google-workspace-integration)
- [Platform administration and audit](#platform-administration-and-audit)
- [Data models](#data-models)
- [Request sequences](#request-sequences)
- [Mobile and installable app](#mobile-and-installable-app)
- [Local development](#local-development)
- [Testing](#testing)
- [Environment variables](#environment-variables)
- [Deployment files](#deployment-files)

## Architecture at a glance

The UI uses the Next.js App Router. JSON endpoints use the Next.js Pages Router under `src/pages/api`; the two routers run in the same Next.js application.

```mermaid
flowchart LR
  Person[Employee, HR, organization admin, platform admin]
  Browser[Browser]
  App[src/app<br/>Next.js App Router]
  SharedUI[src/components<br/>layouts, controls, providers]
  Api[src/pages/api<br/>Next.js API routes]
  Actions[src/ai/flows<br/>server actions / Genkit flows]
  Auth[src/lib<br/>JWT, role, tenant and platform guards]
  Services[src/services<br/>domain and integration services]
  Models[src/models<br/>Mongoose schemas]
  Mongo[(MongoDB)]
  Gemini[Google Gemini<br/>chat and embeddings]
  Google[Google Workspace<br/>Gmail and Calendar]
  Mail[Brevo transactional email]
  Slack[Slack incoming webhook]

  Person --> Browser
  Browser --> App
  App --> SharedUI
  SharedUI --> Api
  SharedUI --> Actions
  Api --> Auth
  Api --> Services
  Actions --> Services
  Actions --> Gemini
  Services --> Models
  Models --> Mongo
  Services --> Google
  Services --> Mail
  Services --> Slack
```

Typical responsibilities are divided as follows:

1. A page or client component in `src/app` collects user input and renders the result.
2. The operation calls an API route or a server action. API routes live in `src/pages/api`; AI actions live in `src/ai/flows`.
3. The handler validates the request and applies the appropriate authentication and organization/platform access checks. Newer modules wrap their handlers in `apiRoute` (`src/lib/api-route.ts`), which verifies the session, builds the signed-in viewer and turns a refused request into the right 4xx.
4. Domain services contain reusable work such as token refresh, document indexing, email rendering, metrics aggregation, and audit event creation.
5. Mongoose models persist application state in MongoDB. Integrations call Google, Gemini, Brevo, or Slack when a feature needs them.

## Technology

- **Application:** Next.js 15, React 18, TypeScript
- **UI:** Tailwind CSS, shadcn/ui-style Radix components, Lucide icons, Recharts
- **Validation and forms:** Zod, React Hook Form
- **Database:** MongoDB Atlas or another MongoDB server, accessed with Mongoose
- **Authentication:** signed JWTs and bcrypt password hashes
- **AI:** Genkit with the Google AI plugin
- **Google Workspace:** Google APIs for Gmail and Calendar
- **Outbound email:** Brevo
- **Optional team notifications:** Slack incoming webhooks
- **Charts and dates:** Recharts and date-fns

## Repository map

```text
HR_AgenticUI/
├── public/                 Static images, sounds, docs screenshots, app icons, manifest, service worker
├── scripts/                One-time operational scripts (for example, token encryption)
├── src/
│   ├── app/                App Router pages, layouts, and route-local components
│   ├── pages/api/           Pages Router JSON endpoints
│   ├── ai/                  Genkit setup, AI flows, schemas, and model selection
│   ├── components/          Shared layouts, application components, and UI primitives
│   ├── contexts/            Client-side providers, including authentication state
│   ├── hooks/               Shared React hooks
│   ├── lib/                 Database, JWT, encryption, access, helpers, and client-safe view types per module
│   ├── models/              Mongoose schemas and model types
│   └── services/            Domain services and external integrations
├── Dockerfile
├── docker-compose.yml
├── k8s/                     Kubernetes deployment and secret templates
├── next.config.ts
├── package.json             Canonical scripts and dependencies for this app
└── README.md
```

The root `package.json` is the application package manifest. Run npm commands from the repository root. A duplicate `src/package.json` is present for historical reasons; it is not a separate deployable application.

### Source directory responsibilities

| Path | Responsibility |
| --- | --- |
| `src/app` | User-facing routes, public content, layouts, and route-specific UI |
| `src/pages/api` | JSON APIs, OAuth callbacks, and server-side request handlers |
| `src/ai` | Genkit configuration, model selection, schemas, and server actions |
| `src/components` | Shared app layouts, navigation, Copilot, tours, and reusable controls |
| `src/components/ui` | Reusable accessible UI primitives built on Radix and Tailwind |
| `src/contexts` | Authentication and other shared client state |
| `src/hooks` | Reusable React hooks, including mobile and toast helpers |
| `src/lib` | Cross-cutting utilities: JWT, encryption, MongoDB, auth, and helpers |
| `src/models` | MongoDB document schemas and domain types |
| `src/services` | Business logic shared by APIs and AI flows; external service clients |
| `public` | Images, sounds, and other static assets |
| `scripts` | Maintenance and migration utilities; not part of a request path |

## Application sections

### Public site and account access

- `/` — product landing page.
- `/contact`, `/book-a-demo` — lead forms backed by contact-submission and demo-request APIs.
- `/login`, `/register`, `/forgot-password`, `/reset-password`, `/login/magic` — account access and recovery.
- `/blog`, `/blog/[slug]` — editorial content from `src/lib/blog`.
- `/docs` — in-app product guides from `src/lib/docs`, one per module with HD screenshots (`public/docs/screenshots`); article slugs are available as hash links (for example `/docs#leave`).
- `/legal/privacy`, `/legal/security`, `/legal/terms` — public legal and security information.
- `/robots.txt`, `/sitemap.xml` — generated by `src/app/robots.ts` and `src/app/sitemap.ts`.

### Signed-in HR workspace

Most signed-in routes use the shared `AppLayout` in `src/components/layout/app-layout.tsx`. It provides the navigation sidebar, user menu, account-status overlay, Copilot sidebar, app tour, and maintenance gate.

| Route | Module |
| --- | --- |
| `/dashboard` | Organization workspace overview |
| `/manage-employees`, `/manage-employees/[id]` | Employee directory and employee records |
| `/employee-onboarding`, `/onboarding/[token]` | Onboarding flows |
| `/employee-hierarchy` | Organization reporting hierarchy |
| `/attendance-management` | Daily attendance board for HR and admins (uses each person's shift to decide lateness) |
| `/attendance-reporting` | Attendance reporting and related HR tools |
| `/tasks` | Kanban-style task board |
| `/recruitment` | Job description generation, resume analysis, and screening interview assistance |
| `/email-assistance`, `/smart-drafting` | AI-assisted email writing |
| `/gmail-inbox` | Gmail inbox, message details, replies, and AI reply drafts |
| `/unified-communications` | Communications workspace |
| `/community` | Social feed: updates, kudos, polls, events, achievements, anonymous posts, announcements with read receipts, celebrations |
| `/knowledge-base` | Organization documents, folders, search, and grounded answers |
| `/support` | Support ticket submission and tracking |
| `/integrations` | Google integration status and connection controls |
| `/settings` | Organization policy, API key, and usage settings |
| `/profile` | User profile and account actions |
| `/audit-log` | User's own audit trail; platform/org-wide scope depends on role |
| `/payroll` | Pay structures, monthly pay runs and payslips |
| `/approvals` | Approvals inbox for leave, expenses, timesheets, resignations and app access |
| `/leave` | Leave balances, requests, team calendar, holidays and leave policy |
| `/timesheets` | Weekly timesheets, projects and the time report |
| `/shifts` | Shift types, assignments and the weekly roster |
| `/expenses` | Expense claims with receipts |
| `/assets` | Equipment register and each person's equipment |
| `/documents` | Policies to sign and letters to request |
| `/offboarding` | Resignations and exits with checklist and exit interview |
| `/performance` | Goals and review cycles |
| `/surveys` | Anonymous pulse surveys |
| `/one-on-ones` | Manager–report 1:1 meetings |
| `/learning` | Courses, mandatory training and certificates |
| `/rewards` | Points from kudos and awards, reward catalogue and redemptions |
| `/apps` | App catalogue, access requests and setup/removal tasks |
| `/reports` | People reports for HR and admins |

### Platform admin console

The platform console has its own layout at `/admin`; it is separate from the signed-in organization workspace. Admin API routes use the platform-admin guard so an organization-level `Admin` does not gain platform-wide access just from the role name.

| Route | Module |
| --- | --- |
| `/admin/login` | Platform-admin entry page |
| `/admin` | Platform overview dashboard |
| `/admin/organizations`, `/admin/organizations/[id]` | Organization directory and detail |
| `/admin/users` | Platform-admin user management |
| `/admin/analytics` | Usage, signup, and action metrics |
| `/admin/logs` | Searchable audit activity, event details, and user tracing |
| `/admin/system-health` | Database, configuration, and recent-failure checks |
| `/admin/community-posts` | Community moderation and post detail |
| `/admin/customer-inquiries` | Contact and demo inquiry review |
| `/admin/support-tickets` | Platform support queue |
| `/admin/content-management` | Subscription plan and email-template configuration |
| `/admin/settings` | Platform settings, maintenance mode, notifications, and integrations |

## HR modules

Each module follows the same shape, so a new one is easy to find your way around:

| Layer | Location | Example (Leave) |
| --- | --- | --- |
| View types (safe for the browser) | `src/lib/<module>.ts` | `src/lib/leave.ts` |
| Mongoose models | `src/models/` | `LeavePolicy.ts`, `Holiday.ts`, `LeaveRequest.ts` |
| Business rules | `src/services/<module>/` | `src/services/leave/index.ts` |
| API routes (thin, via `apiRoute`) | `src/pages/api/<module>/` | `src/pages/api/leave/*` |
| Page and components | `src/app/<module>/` | `src/app/leave/page.tsx` |

Pages call the API through `useOrgApi` (`src/hooks/use-org-api.ts`), which adds the session token and shows a toast if something fails. Every new action is described for the audit log in `src/services/audit/describe.ts`.

| Module | What people can do | Who manages it |
| --- | --- | --- |
| Community | Post updates, kudos, polls, events and achievements; react, comment, save; post anonymously; confirm announcements | HR, managers and admins post announcements and pin posts |
| Approvals | See what waits on them, what they asked for and what they decided | HR and admins set the approval chain per request type |
| Leave | See balances (pro-rated from joining date, with carry-over), request and withdraw leave, see who's away in their team | HR and admins set leave types and holidays |
| Timesheets | Log hours per project each week and submit | HR and admins manage projects; managers see their team's report |
| Shifts | See their shift; attendance uses it for lateness | HR and admins create shifts and assign people |
| Expenses | Claim expenses with a receipt | Approvers review; HR marks claims paid |
| Assets | See equipment they hold | HR and admins keep the register |
| Documents | Sign policies by typing their name; request letters | HR publishes policies and issues letters |
| Offboarding | Resign and fill in an exit interview | Manager, IT and HR complete the checklist |
| Performance | Set goals; write self-reviews | HR runs review cycles; managers review reports |
| Surveys | Answer anonymous surveys | HR creates surveys and reads results |
| 1:1s | Book with their manager or reports; shared agenda, notes and actions; private notes | — |
| Learning | Take courses, mark them complete, get certificates | HR adds courses and mandatory training; managers assign to reports |
| Rewards | Earn points from kudos, redeem rewards | HR awards points, manages the catalogue and delivers rewards |
| Payroll | See and print their payslips | HR sets pay, prepares, checks and publishes each month |
| Apps | Request app access; see their apps | HR and admins set accounts up and remove them, including for joiners and leavers |
| Reports | — | HR and admins see organization-wide totals |

## Approval engine

Leave, expenses, timesheets, resignations and app access all use one engine in `src/services/approvals`.

- **Chains:** each request type has a list of steps — the requester's manager, the HR team or admins — with an optional minimum amount for a step (for example, HR also approves expenses over a threshold). Defaults are in `src/lib/approvals.ts`; HR and admins can change them.
- **Starting:** a module calls `startApproval(...)` when someone submits. Steps that cannot apply (no manager, below the threshold) are skipped; if every step is skipped the request is approved at once.
- **Deciding:** `decide(...)` approves or rejects the current step. Nobody can approve their own request, and a rejection needs a reason. An admin can step in for an absent manager.
- **Settling:** when a request finishes, the engine calls back the owning module (`onLeaveSettled`, `onExpenseSettled`, `onTimesheetSettled`, `onOffboardingSettled`, `onAccessSettled`) so it can update its own record.

## Privacy rules

These rules are built into the services, not just hidden in the UI:

- **Anonymous community posts** never send the author to the browser, including to admins; their audit entries don't name the person.
- **Surveys:** answers are stored apart from who took part, with random ids and no timestamps. Results stay hidden until 5 people answer, and department breakdowns hide groups under 5.
- **Leave:** the team calendar and roster show that someone is away, never the type of leave. Leave notes warn against medical details.
- **Exit interviews** are visible to HR and admins only — not the leaver's manager.
- **1:1 private notes** are returned only to the person who wrote them.
- **Pay:** each person sees only their own published payslips; only HR and admins see everyone's pay. The app does not calculate tax for any country — HR enters those amounts.
- **Reports** show totals only; leave types taken by fewer than 5 people and exit reasons given by one person are grouped as "Other".
- **Copilot** receives a summary of the signed-in person's own records only — never colleagues' data or pay amounts.
- **Letters** are filled from work details only (job title, department, dates).

## API modules

API routes are implemented in `src/pages/api`. Methods and access checks are enforced by the individual handler; authenticated routes commonly use `withAuth`, and platform routes use `requirePlatformAdmin`.

| API path | Purpose |
| --- | --- |
| `/api/auth/*` | Login, registration, password recovery/change, and magic login |
| `/api/employees/*` | Employee CRUD, search, bulk import, and bulk deletion |
| `/api/attendance/*` | Clock in/out, attendance records, and role-scoped dashboard data |
| `/api/leave-requests` | Older leave endpoint; new requests go through the leave service |
| `/api/leave/*` | Balances and requests, team calendar, leave policy and holidays |
| `/api/approvals/*` | Approvals inbox, decisions and approval chains |
| `/api/expenses/*` | Expense claims and receipts |
| `/api/timesheets/*` | Weekly timesheets, projects and the time report |
| `/api/shifts/*` | Shifts, assignments and the roster |
| `/api/assets/*` | Equipment register and movements |
| `/api/documents/*` | Policies, signatures and letters |
| `/api/offboarding/*` | Exits, checklist and exit interviews |
| `/api/performance/*` | Goals, review cycles and reviews |
| `/api/surveys/*` | Surveys, anonymous answers and results |
| `/api/one-on-ones/*` | 1:1 meetings and their agenda, notes and actions |
| `/api/learning/*` | Courses, assignments and progress |
| `/api/rewards/*` | Points, catalogue, awards and redemptions |
| `/api/payroll/*` | Pay structures, pay runs and payslips |
| `/api/apps/*` | App catalogue, access requests and access tasks |
| `/api/reports` | People reports (HR and admins) |
| `/api/hierarchy` | Organization chart and reporting lines |
| `/api/profile/*` | Profile updates and account deletion |
| `/api/settings/*` | Organization AI API key, policy, and usage endpoints |
| `/api/knowledge`, `/api/knowledge/[id]` | List/create folders and documents, rename, move, retry, and delete items |
| `/api/knowledge/search` | Search relevant passages or request a grounded answer |
| `/api/community/posts/*` | Posts, reactions, comments, polls, RSVPs, saves, pins and announcement read receipts |
| `/api/support/tickets` | Organization support-ticket operations |
| `/api/google-auth/*` | Google OAuth connect, callback, status, and disconnect |
| `/api/google/emails/*` | List, view, modify, and send Gmail messages |
| `/api/google/calendars/primary/events` | Read primary Google Calendar events |
| `/api/audit-logs` | Read audit events scoped to the verified user's organization or self |
| `/api/admin/*` | Platform admin APIs for organizations, users, moderation, metrics, logs, health, settings, plans, and templates |
| `/api/plans` | Publicly available active subscription-plan data |
| `/api/platform/status` | Current maintenance-gate state for the workspace |
| `/api/contact-submissions`, `/api/demo-requests` | Public website lead forms |

`/tasks` currently has an App Router page but no dedicated API handler under `src/pages/api`.

## Authentication and authorization

`src/lib/jwt.ts` signs and verifies session tokens. Passwords are checked with bcrypt. The client `AuthProvider` exposes the current session to the UI; this client state improves navigation but is not the server-side authorization boundary.

There are two server-side access patterns:

- **Organization/workspace APIs:** `withAuth` (and the `apiRoute` wrapper built on it) verifies the JWT, checks the account and organization status, applies role restrictions where requested, checks maintenance mode, and attaches the verified actor to `req.user`. The handler must still scope database operations to that actor's organization.
- **Platform-admin APIs:** `requirePlatformAdmin` verifies the JWT and requires a platform role with no organization association. This distinction is important because both platform and organization administrators can have an `Admin` role.
- **Self-authenticating handlers:** a few flows such as OAuth callbacks and public account recovery validate their own token or request state instead of using `withAuth`.

Inside a module, permissions are checked in the service: `requireRole(viewer, ['Admin', 'HR'])` for HR-only actions, manager checks through `managerId`, and ownership checks so people only change their own records. Records are always looked up by the viewer's organization, so one tenant can never read another's data.

`src/lib/encryption.ts` uses AES-256-GCM for secrets stored by the application. Google OAuth tokens use a versioned encrypted format via `src/services/google-token-crypto.ts`; legacy plain-text tokens can be converted using `scripts/encrypt-google-tokens.ts`.

## AI and knowledge base

### AI flows

Genkit is initialized in `src/ai/genkit.ts`. The shared model identifier is in `src/ai/models.ts`. Each flow has a Zod input/output schema in `src/ai/schemas` and a server action in `src/ai/flows`.

| Flow | Feature |
| --- | --- |
| `generate-job-description` | Create a job description from role requirements |
| `analyze-resume-flow` | Summarize a resume, extract strengths and keywords, and produce an ATS-style assessment |
| `ai-interviewer` | Generate structured initial interview questions/assessment |
| `draft-email-response` | Draft or revise HR email responses |
| `copilot-chat-flow` | Conversational HR Copilot, enriched by organization knowledge and the person's own HR summary |
| `summarize-github-activity` | Summarize GitHub activity |

Admins choose the AI provider and model for their organization in **Settings → AI Provider** (Gemini, Claude, OpenAI, Grok, Qwen, DeepSeek, Mistral, Groq, OpenRouter or any OpenAI-compatible endpoint) and can bring their own key; keys are encrypted and never sent back to the browser. Without one, flows use the server-configured `GOOGLE_API_KEY`.

**Copilot and your own HR data:** before answering, `src/services/copilot/context.ts` builds a short summary of the signed-in person's own records — leave left, approvals waiting on them, their open requests, upcoming 1:1s, unfinished courses, reward points, app requests and the latest payslip month (no amounts). This lets Copilot answer questions like "How much leave do I have left?" accurately. The identity comes from the verified token, never from the browser. Usage is recorded by `src/services/usageService.ts` when the flow has the required employee and organization context.

### Knowledge base modules

- **UI:** `src/app/knowledge-base` and its upload, folder, document preview, and ask components.
- **Client API wrapper:** `src/lib/knowledge-client.ts`.
- **Endpoints:** `src/pages/api/knowledge`.
- **Access and validation:** `src/services/knowledge/access.ts`; organization scope comes from the verified token.
- **Indexing:** `chunking.ts`, `embeddings.ts`, and `indexer.ts` split document text, create embeddings, and save chunks.
- **Retrieval and answers:** `search.ts`, `prompt.ts`, and `answer.ts` find relevant passages and produce cited answers. Company policies are searchable alongside uploaded documents.
- **Persistence:** `KnowledgeItem` stores folder/document metadata and source text; `KnowledgeChunk` stores passages and embeddings.

The browser extracts readable text from supported documents before upload; the server stores the document and indexes its text. Search is tenant-scoped. Semantic retrieval uses embeddings and falls back to keyword scoring if the embedding service is unavailable.

## Google Workspace integration

`src/services/google.ts` creates Gmail and Calendar clients using per-employee credentials from `GoogleApiCredential`. The OAuth flow starts in `/api/google-auth/connect`, returns through `/api/google-auth/callback`, stores encrypted tokens, and refreshes access tokens when needed. Gmail and Calendar endpoints in `src/pages/api/google` use the authenticated employee identity.

The OAuth consent screen requests Gmail read/send/compose/modify scopes and read-only Calendar access. Register the matching callback URL with the Google OAuth client:

```text
http://localhost:9002/api/google-auth/callback
```

## Platform administration and audit

- `src/lib/platform-admin.ts` centralizes the platform-admin JWT check.
- `src/services/platform/settings.ts` reads and updates the singleton platform settings record; reads are cached in memory for 15 seconds.
- `src/services/platform/plans.ts`, `email-templates.ts`, and `slack.ts` handle platform configuration and notifications.
- `src/services/admin/platform-metrics.ts`, `system-health.ts`, and `log-query.ts` implement dashboard and observability queries.
- `src/services/audit` describes and writes audit events. Mutating requests wrapped with `withAuth` are recorded after their response finishes; selected login and platform-admin actions record events directly.
- `AuditLog` records actor, action, result, request metadata, and optional duration. MongoDB expires audit records after the configured retention period. The log viewer scopes organization admins to their organization and other users to their own events.
- `src/components/layout/maintenance-gate.tsx` reads `/api/platform/status`; the API guard also enforces maintenance mode on protected workspace requests. Platform administrators remain able to access the platform console.

The settings screen exposes whether server-side environment secrets are configured, not their values. Keep actual credentials in local environment files or a deployment secret manager.

## Data models

Mongoose schemas live in `src/models`. Main collections include:

| Model | Data |
| --- | --- |
| `Organization` | Tenant identity, settings, status, and organization-level policy |
| `Employee`, `Admin` | Workspace users and platform administrators |
| `AttendanceRecord`, `LeaveRequest`, `LeavePolicy`, `Holiday` | Attendance, leave requests, leave types and holidays |
| `Shift`, `ShiftAssignment` | Shift types and who works which shift |
| `ApprovalPolicy`, `ApprovalRequest` | Approval chains and the requests moving through them |
| `Expense` | Expense claims and receipts |
| `Project`, `TimeEntry`, `Timesheet` | Projects, hours and weekly timesheets |
| `Asset` | Equipment and its history |
| `PolicyDocument`, `PolicyAcknowledgement`, `Letter` | Policies, signatures and letters |
| `Offboarding` | Exits, checklist and exit interview |
| `Goal`, `ReviewCycle`, `Review` | Goals and performance reviews |
| `Survey`, `SurveyResponse`, `SurveyParticipation` | Surveys; answers kept apart from who answered |
| `OneOnOne` | 1:1 meetings |
| `Course`, `Enrollment` | Courses and each person's progress |
| `RewardItem`, `RewardTxn` | Reward catalogue and the points ledger |
| `PayStructure`, `PayRun`, `Payslip` | Monthly pay, pay runs and payslips |
| `App`, `AppAccess` | App catalogue and who has access |
| `Post`, `Comment` | Community posts (with reactions, polls, events, kudos and read receipts) and comments |
| `SupportTicket` | Support requests |
| `CompanyPolicy` | Organization policy documents |
| `KnowledgeItem`, `KnowledgeChunk` | Knowledge folders, source documents, passages, and embeddings |
| `GoogleApiCredential` | Per-user Google OAuth credentials |
| `TokenUsageLog` | AI feature token-usage data |
| `AuditLog` | Security and administrative activity |
| `PlatformSettings`, `SubscriptionPlan`, `EmailTemplate` | Global platform configuration |
| `ContactSubmission`, `DemoRequest` | Public-site inquiries |

`src/lib/mongodb.ts` caches the Mongoose connection during development hot reloads and serverless invocations. Services and handlers should use the shared connection helper rather than creating a new connection per operation.

## Request sequences

The diagrams below show the main end-to-end paths. Individual endpoints can have additional validation and error branches.

### Sign in and call a protected workspace API

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant UI as Login / workspace UI
  participant Login as POST /api/auth/login
  participant DB as MongoDB
  participant JWT as JWT helper
  participant API as Workspace API route
  participant Guard as withAuth
  participant Service as Domain handler/service
  participant Audit as Audit service

  User->>UI: Submit email and password
  UI->>Login: Credentials
  Login->>DB: Find Admin or Employee
  DB-->>Login: Account and password hash
  Login->>Login: Compare password with bcrypt
  alt Platform administrator
    Login->>JWT: Sign one-day platform session (organizationId=null)
  else Organization employee
    Login->>DB: Load organization and current maintenance settings
    Login->>JWT: Sign one-day organization session
  end
  JWT-->>Login: Signed token
  Login-->>UI: Token and user summary
  UI->>API: Request with Bearer token
  API->>Guard: Verify session and access
  Guard->>JWT: Verify token signature and expiry
  Guard->>DB: Load account and organization status
  Guard->>Guard: Apply role and maintenance checks
  Guard-->>API: Attach verified actor to request
  API->>Service: Validate operation and tenant scope
  Service->>DB: Read or write domain records
  DB-->>Service: Result
  Service-->>API: Response data
  API-->>UI: HTTP response
  opt Successful or failed mutation wrapped by withAuth
    API->>Audit: Record actor, route, status and duration after response
    Audit->>DB: Insert AuditLog
  end
```

Some handlers verify JWTs directly rather than using `withAuth`. For those, use the handler itself as the source of truth for its authorization behavior.

### Upload a knowledge document and ask a question

```mermaid
sequenceDiagram
  autonumber
  actor HR as Organization admin
  participant UI as Knowledge Base UI
  participant API as /api/knowledge
  participant Guard as withAuth + organization access
  participant Index as Knowledge indexer
  participant Embed as Google embedding model
  participant DB as MongoDB
  participant Search as /api/knowledge/search
  participant Answer as Knowledge answer service
  participant Gemini as Gemini chat model

  HR->>UI: Choose file and destination folder
  UI->>UI: Extract readable text in browser
  UI->>API: POST document metadata and text
  API->>Guard: Verify token, role, and tenant
  Guard-->>API: Verified organization and actor
  API->>DB: Save KnowledgeItem as processing
  API->>Index: Split text and index document
  Index->>Embed: Create passage embeddings
  Embed-->>Index: Embedding vectors
  Index->>DB: Replace KnowledgeChunk records
  Index->>DB: Mark item ready or failed
  API-->>UI: Document status
  HR->>UI: Ask a question
  UI->>Search: POST query and answer=true
  Search->>Guard: Verify token and organization
  Search->>DB: Load this organization's chunks and policies
  Search->>Embed: Embed query
  Embed-->>Search: Query vector
  Search->>Search: Rank relevant passages (keyword fallback if needed)
  Search->>Answer: Question and selected passages
  Answer->>Gemini: Request concise answer with passage citations
  Gemini-->>Answer: Structured answer
  Answer-->>UI: Answer, coverage flag, and source passages
```

### Generate an AI result

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant Page as Recruitment, email, or Copilot page
  participant Flow as src/ai/flows server action
  participant Schema as Zod input/output schema
  participant Runner as Genkit runner
  participant Gemini as Google Gemini
  participant Usage as Usage service
  participant DB as MongoDB

  User->>Page: Submit prompt, resume, message, or question
  Page->>Flow: Call the feature server action
  Flow->>Schema: Validate structured input
  Flow->>Runner: Select organization key or server fallback
  opt Copilot/email asks for HR-specific context
    Flow->>DB: Retrieve organization-scoped knowledge passages
    DB-->>Flow: Relevant passages
  end
  Runner->>Gemini: Prompt and output schema
  Gemini-->>Runner: Structured model response
  Runner-->>Flow: Validated output and usage
  Flow->>Usage: Record token usage when actor context is available
  Usage->>DB: Insert TokenUsageLog
  Flow-->>Page: Result for user review
```

### Manage employees, attendance, and leave

```mermaid
sequenceDiagram
  autonumber
  actor HR as HR / organization admin
  actor Employee
  participant UI as Employee / attendance UI
  participant EmployeeAPI as /api/employees
  participant Guard as withAuth
  participant AttendanceAPI as /api/attendance/*
  participant LeaveAPI as /api/leave-requests
  participant DB as MongoDB

  HR->>UI: Add or update an employee
  UI->>EmployeeAPI: Send employee fields with Bearer token
  EmployeeAPI->>Guard: Verify JWT and Admin role
  Guard-->>EmployeeAPI: Verified actor and organization
  EmployeeAPI->>DB: Validate and write employee in that organization
  DB-->>EmployeeAPI: Updated employee record
  EmployeeAPI-->>UI: Employee result
  Employee->>UI: Clock in
  UI->>AttendanceAPI: POST clock-in with Bearer token
  AttendanceAPI->>Guard: Verify session, organization status, and maintenance mode
  Guard-->>AttendanceAPI: Verified employee identity
  AttendanceAPI->>DB: Check today's record, then create clock-in record
  DB-->>AttendanceAPI: Attendance record
  AttendanceAPI-->>UI: Clock-in result
  Employee->>UI: Submit leave dates and reason
  UI->>LeaveAPI: POST leave request with Bearer token
  LeaveAPI->>LeaveAPI: Verify JWT and validate dates / required fields
  LeaveAPI->>DB: Check overlap and save Pending request for verified employee/org
  DB-->>LeaveAPI: Leave request
  LeaveAPI-->>UI: Submission result
```

Employee CRUD endpoints use role checks for administrative operations. Attendance routes use `withAuth`. The leave-request route verifies its JWT directly and currently defaults reads to the authenticated employee's own requests.

### Request leave and get it approved

```mermaid
sequenceDiagram
  autonumber
  actor Employee
  participant Page as /leave
  participant API as /api/leave
  participant Leave as Leave service
  participant Engine as Approval engine
  participant DB as MongoDB
  actor Manager
  participant Inbox as /approvals

  Employee->>Page: Choose type and dates
  Page->>API: POST request (Bearer token)
  API->>Leave: submitLeave(viewer, input)
  Leave->>Leave: Count working days, skip weekends and holidays, check balance and overlaps
  Leave->>DB: Save request (Pending)
  Leave->>Engine: startApproval(kind: leave)
  Engine->>DB: Save approval with the manager as the first step
  Manager->>Inbox: Open "Waiting on me"
  Inbox->>Engine: decide(approve)
  Engine->>Leave: onLeaveSettled(approved)
  Leave->>DB: Mark request Approved; balance updates
  Employee->>Page: Sees Approved and the new balance
```

### Connect Google and send a Gmail message

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant UI as Integrations / Gmail UI
  participant Connect as /api/google-auth/connect
  participant Google as Google OAuth
  participant Callback as /api/google-auth/callback
  participant Crypto as Google token crypto
  participant DB as MongoDB
  participant API as /api/google/emails/send
  participant Client as Google client service
  participant Gmail as Gmail API

  User->>UI: Connect Google account
  UI->>Connect: Request OAuth redirect
  Connect->>Connect: Verify session token
  Connect-->>User: Redirect to Google consent
  User->>Google: Approve requested scopes
  Google-->>Callback: Authorization code and signed state
  Callback->>Callback: Verify state JWT
  Callback->>Google: Exchange code for tokens
  Google-->>Callback: Access and refresh tokens
  Callback->>Crypto: Encrypt tokens with ENCRYPTION_KEY
  Callback->>DB: Upsert GoogleApiCredential
  Callback-->>UI: Redirect with success status
  User->>API: Send message with workspace Bearer token
  API->>Client: Load employee credentials
  Client->>DB: Read encrypted GoogleApiCredential
  Client->>Crypto: Decrypt and refresh if expired
  Client->>Gmail: Send through authenticated Gmail client
  Gmail-->>API: Message id and result
  API-->>UI: Success or error
```

### Record and inspect audit activity

```mermaid
sequenceDiagram
  autonumber
  actor Employee
  participant Feature as Workspace mutation
  participant Guard as withAuth
  participant Handler as API handler
  participant DB as MongoDB
  participant Audit as AuditLog collection
  actor Admin as Platform admin
  participant Viewer as /admin/logs
  participant Query as /api/admin/logs

  Employee->>Feature: Update data
  Feature->>Guard: Authenticated mutation
  Guard->>Handler: Attach verified actor
  Handler->>DB: Save tenant-scoped change
  Handler-->>Feature: HTTP response
  Guard->>Audit: Store actor, action, status, duration, IP and device
  Admin->>Viewer: Open Logs and choose filters
  Viewer->>Query: Request page, date, category, or result filter
  Query->>Query: Verify platform-admin JWT
  Query->>Audit: Query and aggregate matching events
  Audit-->>Query: Events and totals
  Query-->>Viewer: Page data and permitted user tracing
```

### Change platform-wide settings or content

```mermaid
sequenceDiagram
  autonumber
  actor PlatformAdmin
  participant Console as /admin/settings or /admin/content-management
  participant API as /api/admin/settings, /api/admin/plans, or /api/admin/email-templates
  participant Guard as requirePlatformAdmin
  participant Service as Platform settings / plans / templates service
  participant DB as MongoDB
  participant Audit as AuditLog
  participant Gate as Workspace MaintenanceGate
  participant Status as /api/platform/status
  participant WorkspaceAPI as Protected workspace API
  participant WorkspaceGuard as withAuth

  PlatformAdmin->>Console: Edit a global setting, plan, or email template
  Console->>API: Send change with platform-admin Bearer token
  API->>Guard: Verify JWT and platform role with no organization
  Guard-->>API: Verified platform administrator
  API->>Service: Validate and apply requested change
  Service->>DB: Upsert global settings or create/update/deactivate record
  DB-->>Service: Saved configuration
  Service-->>API: Sanitized result
  API->>Audit: Record selected administrative changes
  API-->>Console: Updated values and status
  Gate->>Status: Read current maintenance state
  Status-->>Gate: Maintenance state and public message
  opt A workspace API call while maintenance is enabled
    WorkspaceAPI->>WorkspaceGuard: Verify session and read current settings
    WorkspaceGuard-->>WorkspaceAPI: 503 maintenance response
  end
```

### Send a public-form notification

```mermaid
sequenceDiagram
  autonumber
  actor Visitor
  participant Form as Contact / demo form
  participant API as Public form API
  participant DB as MongoDB
  participant Mailer as mailerService
  participant Config as Platform settings + templates
  participant Brevo as Brevo
  participant Slack as Optional Slack webhook

  Visitor->>Form: Submit contact or demo request
  Form->>API: Validated form fields
  API->>DB: Save inquiry
  API->>Mailer: Send confirmation and team notification
  Mailer->>Config: Read sender, notification and template settings
  Config-->>Mailer: Effective values or defaults
  Mailer->>Brevo: Send email when BREVO_API_KEY is configured
  opt Slack notification enabled and webhook configured
    Mailer->>Slack: Post platform notification
  end
  API-->>Form: Accepted or error response
```

## Mobile and installable app

- **Installable:** `public/manifest.webmanifest`, icons in `public/icons/`, and the head tags in `src/app/layout.tsx` let people add the app to a phone or desktop home screen. Shortcuts open Leave, Approvals and Payslips.
- **Offline page:** `public/sw.js` shows `public/offline.html` when there is no connection. It never caches API responses or signed-in pages, so personal data isn't stored on the device. It is registered only in production builds (`src/components/pwa-register.tsx`).
- **Phone layout:** below 768px a bottom tab bar (`src/components/layout/mobile-tab-bar.tsx`) gives Home, Leave, Approvals, Community and Copilot; the menu button opens the full sidebar over the page.

## Local development

Use the repository root (the directory containing the root `package.json`):

```bash
npm install
```

Create `.env.local` in that same directory and fill in the required values below. Do not commit this file or paste production credentials into the README.

Start the web application:

```bash
npm run dev
```

The development server uses port **9002**: [http://localhost:9002](http://localhost:9002).

Optional project commands:

```bash
npm run genkit:dev    # Start the Genkit development UI/runtime
npm run genkit:watch  # Start Genkit with flow-file watching
npm run build         # Build the Next.js app
npm start             # Serve a production build
npm run lint          # Run the configured Next.js lint command
npm run typecheck     # Run tsc --noEmit
```

The AI flows are called as server actions from the application. The separate Genkit commands are for flow development and inspection.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Signs and verifies user session JWTs; use a long random secret |
| `ENCRYPTION_KEY` | Yes for encrypted secrets | Base64-encoded 32-byte key for AES-256-GCM encryption |
| `NEXT_PUBLIC_BASE_URL` | Yes for Google OAuth | Public app origin used to construct the OAuth callback; local value is `http://localhost:9002` |
| `GOOGLE_CLIENT_ID` | For Google integration | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | For Google integration | Google OAuth client secret |
| `GOOGLE_API_KEY` | Optional fallback | Server-side Gemini key used when no organization-specific key is supplied |
| `BREVO_API_KEY` | Optional | Enables transactional email delivery; without it outbound notifications are disabled |

Generate a suitable encryption key with:

```bash
openssl rand -base64 32
```

Keep `JWT_SECRET`, `ENCRYPTION_KEY`, API keys, OAuth credentials, and the database URI private. Changing the encryption key makes previously encrypted values unreadable. Google OAuth credentials also need the callback URL shown in [Google Workspace integration](#google-workspace-integration) allow-listed in the Google Cloud Console.

### Local database

Use a MongoDB instance you control and put its URI in `MONGODB_URI`. Collections are created by Mongoose as features write data. Keep development and production databases separate.

## Testing

```bash
npm run typecheck     # TypeScript check
npm run lint          # Next.js lint
```

End-to-end checks are run against the local dev server with test accounts in a test organization:

- **API end to end:** real HTTP calls as five roles (admin, HR, manager, two employees) cover every module — community, approvals, leave, timesheets, offboarding, performance, surveys, assets, documents, shifts, 1:1s, learning, rewards, payroll, apps, reports and the audit log — including permission refusals and the privacy rules above. Test records are tagged `E2E` and removed afterwards.
- **Browser smoke test:** every signed-in page is opened as admin, manager and employee in headless Chrome, failing on JavaScript errors, console errors, failed API calls or error toasts.

Use fictional test data only, and keep test organizations separate from real ones.

## Deployment files

- **Docker:** `Dockerfile` builds the Next.js application and serves it on port 3000. `docker-compose.yml` provides a container configuration and loads `.env.local`.
- **Kubernetes:** `k8s/deployment.yaml`, `k8s/service.yaml`, and `k8s/secret.yaml` are starter templates. Replace the image and secret placeholders before use; do not commit real secrets.
- **Next.js hosting:** the app can also be deployed to a Next.js-compatible host. Configure the same environment variables in the host's secret/environment settings.

The local npm development server runs on port 9002; the container and Kubernetes manifests use port 3000.
