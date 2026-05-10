# CompanyIQ — Full System Design & Architecture Document
> A SaaS platform that lets job seekers research, analyze, and compare companies using aggregated data and LLM-powered insights.
> Prepared for handoff to senior developer / architect.

---

## Table of Contents
1. Product Vision & Goals
2. User Stories
3. System Architecture Overview
4. Tech Stack (All Free / Open Source)
5. Authentication Strategy
6. Data Sources & Aggregation Strategy
7. LLM Integration Strategy (Groq → OpenAI migration path)
8. Database Design
9. API Design (Backend)
10. Frontend Architecture
11. File & Folder Structure
12. UI/UX Design System (Apple-inspired)
13. Feature Roadmap (MVP → V2 → V3)
14. Deployment Strategy (Free Tier)
15. Security Considerations
16. Key Developer Notes

---

## 1. Product Vision & Goals

### What is CompanyIQ?
CompanyIQ is a one-stop SaaS platform where job seekers can search any company — startup, FAANG, listed or unlisted, Indian or global — and get a comprehensive, LLM-synthesized profile including:
- Company history & overview
- Financial performance timeline
- Salary benchmarks by role
- Employee experience & culture scores
- Pros & cons (LLM-generated from aggregated data)
- Trending news
- Similar companies
- Side-by-side comparison of multiple companies

### Core Problem Solved
Job seekers currently need 5+ tabs (AmbitionBox, Glassdoor, Crunchbase, Screener, LinkedIn, Google News) to piece together one company picture. CompanyIQ does all of this in one search, in one place, synthesized intelligently by an LLM.

### Design Philosophy
- Apple-inspired: clean, minimal, premium
- Every screen should feel like it belongs in a keynote
- Data should feel beautiful, not overwhelming
- Mobile-first, but stunning on desktop

---

## 2. User Stories

### Guest (Not Logged In)
- As a guest, I can search for a company and see a limited preview (name, founding date, brief overview)
- As a guest, I am prompted to sign up to see the full profile

### Free Tier User
- As a user, I can search any company and see its full profile
- As a user, I can see company history, financial performance, culture scores, pros/cons, and news
- As a user, I can add companies to a comparison list (max 2)
- As a user, I can see similar companies in a right panel
- As a user, I can bookmark companies for later

### Pro Tier User (Future)
- As a pro user, I can compare up to 5 companies side by side
- As a pro user, I can export comparison reports as PDF
- As a pro user, I can set alerts for company news
- As a pro user, I can see detailed salary breakdowns by city and experience level

### Admin
- As an admin, I can see usage analytics
- As an admin, I can manage data sources and API keys
- As an admin, I can moderate user-submitted reviews

---

## 3. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│   React (Vite) + Tailwind CSS + Framer Motion                   │
│   Apple-inspired UI, Mobile-first, Dark/Light mode              │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
│   Next.js API Routes (or Express.js)                             │
│   Rate Limiting · Auth Middleware · Request Validation           │
└────────┬──────────────────────┬───────────────────────────────┬─┘
         │                      │                               │
┌────────▼──────┐    ┌──────────▼──────────┐    ┌─────────────▼──┐
│  AUTH SERVICE │    │  COMPANY DATA SERVICE│    │  LLM SERVICE   │
│  Clerk (Free) │    │  Data Aggregator     │    │  Groq API      │
│               │    │  + Cache Layer       │    │  (→ OpenAI     │
└───────────────┘    └──────────┬───────────┘    │  later)        │
                                │                └────────────────┘
               ┌────────────────▼────────────────────────┐
               │         EXTERNAL DATA SOURCES            │
               │                                          │
               │  ┌─────────────┐  ┌──────────────────┐  │
               │  │ Wikipedia   │  │ Crunchbase API   │  │
               │  │ API         │  │ (startup data)   │  │
               │  └─────────────┘  └──────────────────┘  │
               │  ┌─────────────┐  ┌──────────────────┐  │
               │  │ NewsAPI     │  │ MCA / OpenCorp   │  │
               │  │ (news feed) │  │ (India registry) │  │
               │  └─────────────┘  └──────────────────┘  │
               │  ┌─────────────┐  ┌──────────────────┐  │
               │  │ Yahoo Fin.  │  │ Wikidata API     │  │
               │  │ (financials)│  │ (structured data)│  │
               │  └─────────────┘  └──────────────────┘  │
               └─────────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                        DATABASE LAYER                             │
│   PostgreSQL (via Supabase — Free Tier)                          │
│   Redis (via Upstash — Free Tier) for Caching                   │
└─────────────────────────────────────────────────────────────────┘
```

### How a Search Works (Step by Step)
```
1. User types "Infosys" → hits Enter
2. Frontend sends GET /api/company/search?q=Infosys
3. API Gateway checks auth (is user logged in?)
4. API checks Redis cache → if cached, return immediately (fast!)
5. If not cached:
   a. Call Wikipedia API → get company history & overview
   b. Call Crunchbase API → get funding & founding info
   c. Call NewsAPI → get last 10 news articles
   d. Call Yahoo Finance → get financial data (if listed)
   e. Call Wikidata → get structured facts
6. All data merged into one unified CompanyProfile object
7. CompanyProfile sent to Groq LLM with a prompt:
   "Based on this data, write a company summary, pros, cons,
    culture assessment, and growth trajectory analysis."
8. LLM returns synthesized insights
9. Final merged result cached in Redis for 6 hours
10. Response returned to frontend
11. Frontend renders beautiful Apple-style company profile page
```

---

## 4. Tech Stack (All Free / Open Source)

### Frontend
| Technology | Purpose | Why This? |
|---|---|---|
| React 18 + Vite | UI framework | Fast, modern, huge ecosystem |
| Tailwind CSS v3 | Styling | Perfect for Apple-style minimalism |
| Framer Motion | Animations | Smooth, Apple-like transitions |
| React Query (TanStack) | Data fetching & caching | Auto loading states, caching |
| Zustand | Global state management | Lightweight, simple |
| React Router v6 | Client-side routing | Standard |
| Recharts | Charts & timelines | Free, React-native charts |
| Lucide React | Icons | Clean, minimal icons (Apple-like) |
| React Hot Toast | Notifications | Minimal, clean toasts |

### Backend
| Technology | Purpose | Why This? |
|---|---|---|
| Next.js 14 (App Router) | Full-stack framework | Frontend + API in one project |
| Prisma ORM | Database queries | Type-safe, clean syntax |
| Zod | Input validation | Type-safe request validation |
| Axios | HTTP client for external APIs | Reliable, interceptor support |
| node-cache / Redis | Caching API responses | Avoid hitting rate limits |

> **Note for architect**: We use Next.js as a monorepo — frontend pages AND backend API routes live together. This simplifies deployment (single Vercel project) and removes the need for a separate Express server in MVP. If the app scales, the API can be extracted to a standalone service later.

### Database & Infrastructure
| Technology | Purpose | Free Tier |
|---|---|---|
| Supabase | PostgreSQL database | 500MB free, generous limits |
| Upstash Redis | Caching layer | 10,000 commands/day free |
| Vercel | Hosting & deployment | Free for hobby projects |
| Clerk | Authentication | 10,000 MAU free |

### LLM
| Phase | Provider | Cost |
|---|---|---|
| MVP | Groq API (LLaMA 3 70B) | Free tier available |
| Growth | OpenAI GPT-4o | Pay as you go |
| Scale | OpenAI + fine-tuned model | Custom |

---

## 5. Authentication Strategy

### Recommendation: Use Clerk (Free Tier)

**Why Clerk over building your own auth?**

Building your own auth means handling:
- Password hashing (bcrypt)
- JWT token generation & refresh
- Session management
- Email verification flows
- Password reset flows
- OAuth (Google, GitHub login)
- Security vulnerabilities

This is 2-3 weeks of work minimum, and security mistakes can be catastrophic. Clerk handles all of this, is free for up to 10,000 monthly active users, and integrates with Next.js in under 1 hour.

**When to build your own auth:**
Only if you have 100,000+ users and Clerk's paid plan is too expensive. Not at MVP stage.

**Clerk Integration Points:**
```
Sign Up → Clerk UI component (pre-built, Apple-style customizable)
Sign In → Clerk UI component
Protected routes → Clerk middleware (one line of code)
User object → Available in every API route automatically
Webhooks → Clerk notifies your DB when user signs up
```

**Auth Flow:**
```
User clicks "Sign Up"
→ Clerk modal appears (email/password or Google/GitHub OAuth)
→ Clerk sends verification email
→ User verifies
→ Clerk webhook fires → your DB creates a User record
→ User is now authenticated
→ All subsequent API calls include a Clerk session token
→ Your API middleware validates the token (one line)
```

---

## 6. Data Sources & Aggregation Strategy

### Source Map by Data Type

```
COMPANY BASICS (name, founded, HQ, description)
  Primary: Wikipedia API (free, no key needed)
  Secondary: Wikidata API (structured, machine-readable)
  Tertiary: OpenCorporates API (global company registry)

STARTUP & FUNDING DATA
  Primary: Crunchbase Basic API (free tier)
  Secondary: Manual/user-contributed

INDIAN COMPANY REGISTRATION
  Primary: MCA (Ministry of Corporate Affairs) — data.gov.in
  Fields: CIN, registration date, registered address, directors

FINANCIAL PERFORMANCE (listed companies)
  Primary: Yahoo Finance API (via yahoo-finance2 npm package — free)
  Data: Revenue, profit, stock price history, market cap
  Indian Listed: BSE/NSE data via Yahoo Finance ticker (e.g., INFY.NS)

NEWS & TRENDING
  Primary: NewsAPI.org (free tier: 100 requests/day)
  Secondary: Google News RSS (free, no key)
  Tertiary: Bing News API (free tier via Azure)

EMPLOYEE REVIEWS & SALARIES (the hard part)
  Phase 1 MVP: Not included, replaced by LLM-generated culture assessment
  Phase 2: User-submitted reviews (your own system)
  Phase 3: Potential partnerships with AmbitionBox/Glassdoor

SIMILAR COMPANIES
  Generated by LLM based on: same industry, same size, same region
```

### Data Aggregation Pipeline

```javascript
// Pseudocode for the aggregation pipeline

async function aggregateCompanyData(companyName) {

  // Step 1: Run all API calls in PARALLEL (not one by one)
  const [wikipedia, crunchbase, news, financials, wikidata] = await Promise.allSettled([
    fetchWikipedia(companyName),
    fetchCrunchbase(companyName),
    fetchNews(companyName),
    fetchFinancials(companyName),
    fetchWikidata(companyName),
  ]);

  // Step 2: Merge all results, handle failures gracefully
  const mergedData = {
    name: wikipedia?.name || crunchbase?.name || companyName,
    founded: crunchbase?.founded || wikipedia?.founded,
    description: wikipedia?.description,
    funding: crunchbase?.funding_rounds,
    revenue: financials?.revenue_history,
    news: news?.articles?.slice(0, 10),
    headquarters: wikidata?.hq || wikipedia?.hq,
    employeeCount: wikidata?.employees || crunchbase?.employees,
    industry: crunchbase?.industry || wikidata?.industry,
  };

  // Step 3: Send merged data to LLM for synthesis
  const insights = await generateLLMInsights(mergedData);

  return { ...mergedData, insights };
}
```

### Caching Strategy
```
Search result → cache in Redis for 6 hours
  Why 6 hours? Company data doesn't change hourly.
  This saves API quota and makes the app feel instant on repeat searches.

News → cache for 1 hour
  Why 1 hour? News is more time-sensitive.

If cache miss → fetch fresh → store in cache → return to user
If cache hit → return immediately (< 50ms response time)
```

### Handling Missing Data Gracefully
Not every company will have data from every source. The UI should:
- Show available data beautifully
- Show "Data not available" cards for missing sections (not broken UI)
- LLM should acknowledge when data is limited: "Limited public data available for this company. Here's what we know..."

---

## 7. LLM Integration Strategy

### Groq API Setup (MVP)
```javascript
// lib/llm/groq.js

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateCompanyInsights(companyData) {
  const prompt = buildPrompt(companyData);

  const response = await groq.chat.completions.create({
    model: "llama3-70b-8192",  // Groq's free LLaMA 3 70B
    messages: [
      {
        role: "system",
        content: `You are CompanyIQ's AI analyst. You synthesize company data into 
        clear, honest, job-seeker-focused insights. Be factual, balanced, and concise.
        Format your response as valid JSON only.`
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.3,  // Low temperature = more factual, less creative
    max_tokens: 1500,
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content);
}
```

### Prompt Design
```javascript
function buildPrompt(data) {
  return `
    Analyze this company and return a JSON object with these exact keys:

    {
      "summary": "2-3 sentence company overview for a job seeker",
      "growth_trajectory": "Assessment of company growth over time (growing/stable/declining)",
      "culture_score": number between 1-10 based on available signals,
      "pros": ["pro1", "pro2", "pro3"],
      "cons": ["con1", "con2", "con3"],
      "salary_range_note": "General note about compensation based on available data",
      "job_seeker_verdict": "Should a job seeker consider this company? One honest paragraph.",
      "similar_companies": ["Company A", "Company B", "Company C"],
      "data_confidence": "high/medium/low based on how much data was available"
    }

    Company Data:
    Name: ${data.name}
    Founded: ${data.founded}
    Industry: ${data.industry}
    Headquarters: ${data.headquarters}
    Description: ${data.description}
    Employee Count: ${data.employeeCount}
    Funding History: ${JSON.stringify(data.funding)}
    Revenue History: ${JSON.stringify(data.revenue)}
    Recent News Headlines: ${data.news?.map(n => n.title).join(', ')}
  `;
}
```

### Migration Path: Groq → OpenAI
The LLM layer is fully abstracted. To switch from Groq to OpenAI:
```javascript
// lib/llm/index.js — the only file that needs to change

// MVP: Using Groq
export { generateCompanyInsights } from './groq.js';

// Later: Just change this one line
export { generateCompanyInsights } from './openai.js';
```
No other file in the codebase needs to change. The rest of the app just calls `generateCompanyInsights(data)` and doesn't care which LLM is behind it.

---

## 8. Database Design

### Tables

```sql
-- Users (synced from Clerk via webhook)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  plan VARCHAR(50) DEFAULT 'free',  -- 'free' | 'pro'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Companies (cached profiles from aggregated data)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,  -- e.g., "infosys", "tata-consultancy"
  data JSONB NOT NULL,                -- Full aggregated data blob
  llm_insights JSONB,                 -- LLM-generated insights
  last_fetched_at TIMESTAMP,          -- When was this data last refreshed?
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Bookmarks
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- Compare Lists (what companies a user added to compare)
CREATE TABLE compare_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_ids UUID[] NOT NULL,         -- Array of company IDs
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Reviews (Phase 2 — user-submitted data)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role VARCHAR(255),
  rating_overall INTEGER CHECK (rating_overall BETWEEN 1 AND 5),
  rating_worklife INTEGER CHECK (rating_worklife BETWEEN 1 AND 5),
  rating_growth INTEGER CHECK (rating_growth BETWEEN 1 AND 5),
  rating_management INTEGER CHECK (rating_management BETWEEN 1 AND 5),
  pros TEXT,
  cons TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  is_anonymous BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Search History (for analytics & personalization)
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  query VARCHAR(255) NOT NULL,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 9. API Design (Backend Routes)

All routes prefixed with `/api/`

### Company Routes
```
GET  /api/company/search?q={query}
  → Search for companies by name
  → Returns: array of matching company stubs
  → Auth: optional (guests see limited results)

GET  /api/company/{slug}
  → Get full company profile
  → Returns: full CompanyProfile with LLM insights
  → Auth: required for full data

GET  /api/company/{slug}/news
  → Get latest news for a company
  → Returns: array of news articles
  → Auth: required

GET  /api/company/{slug}/similar
  → Get similar companies
  → Returns: array of company stubs
  → Auth: required
```

### Compare Routes
```
POST /api/compare
  → Body: { company_ids: ["id1", "id2"] }
  → Returns: side-by-side comparison object
  → Auth: required

GET  /api/compare/saved
  → Get user's saved compare lists
  → Auth: required
```

### User Routes
```
GET  /api/user/bookmarks
  → Get all bookmarked companies
  → Auth: required

POST /api/user/bookmarks
  → Body: { company_id: "uuid" }
  → Add a bookmark
  → Auth: required

DELETE /api/user/bookmarks/{company_id}
  → Remove a bookmark
  → Auth: required

GET  /api/user/history
  → Get search history
  → Auth: required
```

### Review Routes (Phase 2)
```
POST /api/reviews
  → Submit a company review
  → Auth: required

GET  /api/reviews/{company_id}
  → Get reviews for a company
  → Auth: required
```

### Response Format (Consistent Across All Routes)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "cached": true,
    "cache_age_seconds": 3420,
    "data_confidence": "high"
  },
  "error": null
}
```

---

## 10. Frontend Architecture

### Page Structure
```
/ (Home)
  → Hero with search bar
  → Trending companies section
  → How it works section

/company/{slug} (Company Profile Page)
  → Left: Main content (overview, timeline, financials, culture)
  → Right: Similar companies panel
  → Bottom: Compare button / Floating compare bar

/compare (Comparison Page)
  → Side-by-side table of selected companies
  → Radar chart comparison

/bookmarks (Saved Companies)
  → Grid of bookmarked company cards

/search?q={query} (Search Results Page)
  → List of matching companies

/sign-in → Clerk sign-in page
/sign-up → Clerk sign-up page
/dashboard → User's personal dashboard (history, bookmarks)
```

### State Management
```
Global State (Zustand):
  - currentUser: User object from Clerk
  - compareList: Array of companies added to compare (max 2 free, 5 pro)
  - theme: 'light' | 'dark'

Server State (React Query):
  - Company profiles (cached, auto-invalidated)
  - Search results
  - News feeds
  - Bookmarks
```

### Component Hierarchy
```
App
├── Layout
│   ├── Navbar
│   │   ├── Logo
│   │   ├── SearchBar (global)
│   │   ├── ThemeToggle
│   │   └── UserMenu (Clerk)
│   ├── CompareBar (floating, shows when 2+ companies selected)
│   └── Footer
│
├── Pages
│   ├── HomePage
│   │   ├── HeroSection
│   │   │   └── HeroSearchBar
│   │   ├── TrendingCompanies
│   │   │   └── CompanyCard (×6)
│   │   └── HowItWorksSection
│   │
│   ├── CompanyProfilePage
│   │   ├── CompanyHero (name, logo, tags, bookmark/compare buttons)
│   │   ├── MainContent
│   │   │   ├── OverviewSection
│   │   │   ├── TimelineSection (founding → key milestones)
│   │   │   ├── FinancialsSection (revenue chart)
│   │   │   ├── CultureSection (scores + LLM analysis)
│   │   │   ├── ProsConsSection
│   │   │   ├── SalarySection
│   │   │   └── NewsSection
│   │   └── RightPanel
│   │       └── SimilarCompanies (×5 cards)
│   │
│   ├── ComparePage
│   │   ├── CompareHeader (company logos side by side)
│   │   └── CompareTable (row by row comparison)
│   │
│   └── SearchResultsPage
│       └── CompanyCard (×n)
│
└── Shared Components
    ├── CompanyCard
    ├── ScoreRing (circular score display)
    ├── TimelineChart
    ├── RevenueChart
    ├── NewsCard
    ├── LoadingSkeleton
    ├── EmptyState
    └── ErrorState
```

---

## 11. File & Folder Structure

```
companyiq/
│
├── public/
│   ├── favicon.ico
│   ├── og-image.png                    # Open Graph image for social sharing
│   └── icons/                          # App icons
│
├── src/
│   │
│   ├── app/                            # Next.js App Router pages
│   │   ├── layout.tsx                  # Root layout (fonts, providers)
│   │   ├── page.tsx                    # Home page
│   │   ├── (auth)/                     # Auth route group
│   │   │   ├── sign-in/page.tsx
│   │   │   └── sign-up/page.tsx
│   │   ├── company/
│   │   │   └── [slug]/
│   │   │       └── page.tsx            # Company profile page
│   │   ├── compare/
│   │   │   └── page.tsx                # Compare page
│   │   ├── search/
│   │   │   └── page.tsx                # Search results page
│   │   ├── bookmarks/
│   │   │   └── page.tsx                # Bookmarks page
│   │   └── dashboard/
│   │       └── page.tsx                # User dashboard
│   │
│   ├── api/                            # Next.js API Routes (backend)
│   │   ├── company/
│   │   │   ├── search/route.ts         # GET /api/company/search
│   │   │   └── [slug]/
│   │   │       ├── route.ts            # GET /api/company/{slug}
│   │   │       ├── news/route.ts       # GET /api/company/{slug}/news
│   │   │       └── similar/route.ts   # GET /api/company/{slug}/similar
│   │   ├── compare/
│   │   │   └── route.ts                # POST /api/compare
│   │   ├── user/
│   │   │   ├── bookmarks/route.ts
│   │   │   └── history/route.ts
│   │   ├── reviews/
│   │   │   └── route.ts
│   │   └── webhooks/
│   │       └── clerk/route.ts          # Clerk webhook (user sync to DB)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── CompareBar.tsx          # Floating compare bar
│   │   ├── company/
│   │   │   ├── CompanyHero.tsx
│   │   │   ├── OverviewSection.tsx
│   │   │   ├── TimelineSection.tsx
│   │   │   ├── FinancialsSection.tsx
│   │   │   ├── CultureSection.tsx
│   │   │   ├── ProsConsSection.tsx
│   │   │   ├── SalarySection.tsx
│   │   │   ├── NewsSection.tsx
│   │   │   └── SimilarCompanies.tsx
│   │   ├── compare/
│   │   │   ├── CompareHeader.tsx
│   │   │   └── CompareTable.tsx
│   │   ├── search/
│   │   │   ├── SearchBar.tsx
│   │   │   └── SearchResults.tsx
│   │   └── ui/                         # Reusable atomic components
│   │       ├── CompanyCard.tsx
│   │       ├── ScoreRing.tsx
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       ├── Skeleton.tsx
│   │       ├── EmptyState.tsx
│   │       ├── ErrorState.tsx
│   │       └── Toast.tsx
│   │
│   ├── lib/
│   │   ├── llm/
│   │   │   ├── index.ts                # Exports generateCompanyInsights()
│   │   │   ├── groq.ts                 # Groq implementation
│   │   │   ├── openai.ts               # OpenAI implementation (future)
│   │   │   └── prompts.ts              # All LLM prompts defined here
│   │   ├── data-sources/
│   │   │   ├── index.ts                # Main aggregator — calls all sources
│   │   │   ├── wikipedia.ts            # Wikipedia API client
│   │   │   ├── crunchbase.ts           # Crunchbase API client
│   │   │   ├── news.ts                 # NewsAPI + Google RSS client
│   │   │   ├── financials.ts           # Yahoo Finance client
│   │   │   └── wikidata.ts             # Wikidata API client
│   │   ├── cache/
│   │   │   └── redis.ts                # Upstash Redis client + helpers
│   │   ├── db/
│   │   │   └── prisma.ts               # Prisma client singleton
│   │   └── utils/
│   │       ├── slugify.ts              # Convert company name to URL slug
│   │       ├── formatters.ts           # Currency, date, number formatters
│   │       └── cn.ts                   # Tailwind classname merger (clsx)
│   │
│   ├── hooks/
│   │   ├── useCompany.ts               # React Query hook for company data
│   │   ├── useSearch.ts                # Search with debounce
│   │   ├── useCompare.ts               # Compare list management
│   │   ├── useBookmarks.ts             # Bookmark CRUD
│   │   └── useTheme.ts                 # Dark/light mode
│   │
│   ├── store/
│   │   └── index.ts                    # Zustand global store
│   │
│   ├── types/
│   │   ├── company.ts                  # CompanyProfile, CompanyStub types
│   │   ├── user.ts                     # User type
│   │   ├── review.ts                   # Review type
│   │   └── api.ts                      # API response wrapper types
│   │
│   └── styles/
│       └── globals.css                 # Tailwind directives + CSS variables
│
├── prisma/
│   ├── schema.prisma                   # Database schema
│   └── migrations/                     # DB migration files
│
├── .env.local                          # Environment variables (never commit)
├── .env.example                        # Template for env variables
├── next.config.js                      # Next.js config
├── tailwind.config.js                  # Tailwind config + design tokens
├── tsconfig.json                       # TypeScript config
├── package.json
└── README.md
```

---

## 12. UI/UX Design System (Apple-Inspired)

### Color Palette
```css
/* globals.css */
:root {
  /* Backgrounds */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F5F7;       /* Apple's light gray */
  --bg-tertiary: #E8E8ED;

  /* Text */
  --text-primary: #1D1D1F;       /* Apple's near-black */
  --text-secondary: #6E6E73;     /* Apple's secondary gray */
  --text-tertiary: #AEAEB2;

  /* Accent */
  --accent: #0071E3;             /* Apple blue */
  --accent-hover: #0077ED;
  --accent-light: #E8F1FD;

  /* Semantic */
  --success: #34C759;            /* Apple green */
  --warning: #FF9F0A;            /* Apple orange */
  --danger: #FF3B30;             /* Apple red */

  /* Borders */
  --border: rgba(0, 0, 0, 0.08);
  --border-strong: rgba(0, 0, 0, 0.15);

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.10);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.12);
}

[data-theme="dark"] {
  --bg-primary: #000000;
  --bg-secondary: #1C1C1E;
  --bg-tertiary: #2C2C2E;
  --text-primary: #F5F5F7;
  --text-secondary: #98989D;
  --text-tertiary: #636366;
  --border: rgba(255, 255, 255, 0.08);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.4);
}
```

### Typography
```javascript
// tailwind.config.js — font setup
// Use SF Pro (Apple's font) via system stack
fontFamily: {
  sans: [
    "-apple-system",
    "BlinkMacSystemFont",
    "SF Pro Display",
    "Segoe UI",
    "sans-serif"
  ],
}
```

### Spacing & Radius
```
Radius: 12px (cards), 8px (buttons), 999px (pills/tags)
Spacing: Follow 8pt grid (8, 16, 24, 32, 48, 64)
Max content width: 1200px
```

### Key UI Patterns
- **Cards**: Rounded corners (12px), subtle shadow, white background, no harsh borders
- **Buttons**: Filled (blue for primary), ghost for secondary, always rounded
- **Search bar**: Large, centered, SF Pro font, subtle shadow — like Apple.com's search
- **Sections**: Separated by generous whitespace, not dividers
- **Data visualization**: Clean Recharts with Apple color palette
- **Loading**: Skeleton screens (not spinners) for perceived performance
- **Animations**: Framer Motion — smooth fade + slide in, 200-300ms duration

---

## 13. Feature Roadmap

### MVP (Month 1-2) — Validate the Idea
- [ ] User auth (Clerk)
- [ ] Company search
- [ ] Company profile page (overview, history, news, LLM summary, pros/cons)
- [ ] Similar companies panel
- [ ] Basic bookmarking
- [ ] Compare 2 companies side by side
- [ ] Dark/light mode
- [ ] Mobile responsive

### V2 (Month 3-4) — Add Depth
- [ ] User-submitted reviews & salaries
- [ ] Financial charts for listed companies (Yahoo Finance)
- [ ] Company timeline visualization
- [ ] Culture score (from aggregated signals)
- [ ] Compare up to 5 companies (Pro tier)
- [ ] PDF export of comparison report
- [ ] Company news alerts

### V3 (Month 5-6) — Scale & Monetize
- [ ] Pro subscription (Stripe integration)
- [ ] Advanced salary benchmarking
- [ ] Industry-level analytics ("Top 10 IT companies to work for in Pune")
- [ ] Browser extension (research company while on LinkedIn)
- [ ] API access for recruitment agencies
- [ ] College/campus placement cell B2B plans

---

## 14. Deployment Strategy (Free Tier)

```
Frontend + API Routes → Vercel (free hobby plan)
  Deploy: git push → auto-deploy via GitHub integration

Database → Supabase (free: 500MB, 50k rows)
  Access: Prisma ORM via DATABASE_URL env variable

Redis Cache → Upstash (free: 10k commands/day)
  Access: REST API via @upstash/redis package

Auth → Clerk (free: 10k MAU)

LLM → Groq API (free tier)

Domain → Vercel provides free .vercel.app subdomain
  Later: Buy a .com domain (~₹800/year) and point to Vercel
```

### Environment Variables (.env.local)
```bash
# Database
DATABASE_URL="postgresql://..."          # From Supabase

# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# LLM
GROQ_API_KEY="gsk_..."

# Data Sources
CRUNCHBASE_API_KEY="..."
NEWS_API_KEY="..."                        # From newsapi.org

# Cache
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 15. Security Considerations

### API Key Protection
- All API keys live in `.env.local` — NEVER in frontend code
- All external API calls happen in Next.js API routes (server-side), never in browser
- `.env.local` is in `.gitignore` — never committed to GitHub

### Rate Limiting
- Use `upstash/ratelimit` to limit: 10 searches/minute per user, 100/day for guests
- Prevents abuse and protects your free API quotas

### Input Validation
- All user inputs validated with Zod before processing
- Prevents SQL injection, XSS, prompt injection attacks
- Sanitize company names before sending to LLM

### Auth
- Clerk handles all auth security
- All `/api/user/*` and `/api/compare` routes require valid Clerk session
- Company search: rate-limited for guests, full access for authenticated users

---

## 16. Key Developer Notes

1. **Start with the data pipeline first**, not the UI. Prove you can get good data for 10 companies before building any frontend.

2. **The LLM prompt is everything.** Spend serious time on prompt engineering. A bad prompt gives generic, useless output. A good prompt makes the app feel magical.

3. **Handle API failures gracefully.** External APIs WILL fail. Use `Promise.allSettled()` (not `Promise.all()`) so one failing source doesn't break the whole response.

4. **Cache aggressively.** You're on free API tiers. Every cache hit saves your quota. Cache company profiles for 6 hours minimum.

5. **Mobile first.** A significant portion of Indian job seekers use mobile. Design for 375px width first, then scale up.

6. **The compare feature is your hero feature.** Make it feel delightful — smooth animations when adding a company, a clear floating bar showing selected companies.

7. **LLM abstraction is critical.** Never call Groq directly from a component or API route. Always go through `lib/llm/index.ts`. This is what makes the Groq → OpenAI migration a 1-line change.

8. **Use TypeScript strictly.** Define all types in `src/types/`. Strong typing will save you hours of debugging.

9. **Start with 20 well-known companies hardcoded** for the demo/MVP. This ensures the demo always works perfectly even if APIs fail. Expand to live search after.

10. **The company slug** (e.g., "infosys", "tata-consultancy-services") is your primary URL-friendly identifier. Generate it from the company name using the `slugify` utility.

---

*Document Version: 1.0*
*Prepared for: CompanyIQ Project*
*Target Audience: Senior Developer / Architect handoff*
*Stack: Next.js 14 · Tailwind · Prisma · Supabase · Upstash · Clerk · Groq*
