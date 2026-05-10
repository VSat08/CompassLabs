# CompanyIQ — Full System Design & Architecture Document
> A SaaS platform that lets job seekers research, analyze, and compare companies using aggregated data and LLM-powered insights.
> Prepared for handoff to senior developer / architect.

**Document Version: 2.0**
**Last Updated: Post Team Discussion — Round 2**
**Change Log from v1.0:**
- ❌ Removed: Clerk (third-party auth) → ✅ Replaced with: Custom JWT Auth (built from scratch)
- ❌ Removed: Next.js API Routes as backend → ✅ Replaced with: FastAPI (Python)
- ❌ Removed: Prisma ORM → ✅ Replaced with: SQLAlchemy (Python ORM)
- ✅ Confirmed: PostgreSQL via Supabase (unchanged)
- ✅ Confirmed: Redis via Upstash (unchanged, dual-DB architecture justified)
- ✅ Confirmed: React + Vite frontend (unchanged)
- ✅ Confirmed: Groq → OpenAI migration path (unchanged)
- 🔄 Updated: Deployment — Vercel (frontend) + Render.com (FastAPI backend)
- 🔄 Updated: All folder structures, env variables, API design to reflect FastAPI

---

## Table of Contents
1. Product Vision & Goals
2. User Stories
3. System Architecture Overview
4. Tech Stack (All Free / Open Source)
5. Authentication Strategy (Custom JWT — Built From Scratch)
6. Data Sources & Aggregation Strategy
7. LLM Integration Strategy (Groq → OpenAI migration path)
8. Database Design (PostgreSQL + Redis — Why Both)
9. API Design (FastAPI Backend)
10. Frontend Architecture (React + Vite)
11. File & Folder Structure (Frontend + Backend Separated)
12. UI/UX Design System (Apple-Inspired)
13. Feature Roadmap (MVP → V2 → V3)
14. Deployment Strategy (Free Tier)
15. Security Considerations
16. Key Developer Notes & Learning Path

---

## 1. Product Vision & Goals

### What is CompanyIQ?
CompanyIQ is a one-stop SaaS platform where job seekers can search any company — startup, FAANG, listed or unlisted, Indian or global — and get a comprehensive, LLM-synthesized profile including:
- Company history & overview
- Financial performance over a timeline
- Salary benchmarks by role and city
- Employee experience & culture scores
- Pros & cons (LLM-generated from aggregated real data)
- Trending news about the company
- Similar companies recommendation
- Side-by-side comparison of multiple companies

### Core Problem Solved
Job seekers currently need 5+ tabs (AmbitionBox, Glassdoor, Crunchbase, Screener, LinkedIn, Google News) to piece together one complete company picture. CompanyIQ aggregates all of this into one search, one place, synthesized intelligently by an LLM.

### What Makes It "Out of the Box"
The innovation is NOT the number of companies covered — it is:
1. **LLM synthesis layer** — raw data from 6 sources becomes one human-readable, honest summary
2. **Timeline visualization** — a company's arc plotted visually over years
3. **Side-by-side comparison** — the hero feature no existing tool does well
4. **Data flywheel** — user-submitted reviews + salary data grows over time, becoming a proprietary moat
5. **Everything in one place** — the aggregation itself is the product

### Design Philosophy
- Apple-inspired: clean, minimal, premium
- Every screen should feel like it belongs in an Apple Keynote
- Data should feel beautiful, not overwhelming
- Mobile-first, but stunning on desktop
- Minimalist typography, generous whitespace, subtle animations

---

## 2. User Stories

### Guest (Not Logged In)
- As a guest, I can search for a company and see a limited preview (name, founding date, brief overview)
- As a guest, I am prompted to sign up to see the full profile

### Free Tier User
- As a user, I can search any company and see its full profile
- As a user, I can see company history, financial performance, culture scores, pros/cons, and news
- As a user, I can add up to 2 companies to a comparison list
- As a user, I can see similar companies in a right panel
- As a user, I can bookmark companies for later
- As a user, I can submit my own salary and review anonymously

### Pro Tier User (Future Paid)
- As a pro user, I can compare up to 5 companies side by side
- As a pro user, I can export comparison reports as PDF
- As a pro user, I can set alerts for company news
- As a pro user, I can see detailed salary breakdowns by city and experience level

### Admin
- As an admin, I can see usage analytics
- As an admin, I can manage data source API keys
- As an admin, I can moderate user-submitted reviews

---

## 3. System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                              │
│   React 18 + Vite + Tailwind CSS + Framer Motion                 │
│   Apple-inspired UI · Mobile-first · Dark/Light mode             │
│   Deployed on: Vercel                                             │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTPS / REST API calls
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                     API GATEWAY LAYER                             │
│   FastAPI (Python) — Deployed on Render.com (free tier)          │
│   Rate Limiting · JWT Auth Middleware · Request Validation        │
│   CORS configured to allow only our React frontend               │
└────────┬─────────────────────┬────────────────────────┬──────────┘
         │                     │                        │
┌────────▼──────┐   ┌──────────▼──────────┐   ┌────────▼────────┐
│  AUTH MODULE  │   │  COMPANY DATA MODULE │   │   LLM MODULE    │
│               │   │                      │   │                 │
│  Custom JWT   │   │  Data Aggregator     │   │  Groq API       │
│  bcrypt hash  │   │  Parallel API calls  │   │  (→ OpenAI)     │
│  HTTP cookies │   │  Redis Cache Layer   │   │  LLaMA 3 70B    │
└───────────────┘   └──────────┬───────────┘   └─────────────────┘
                               │
              ┌────────────────▼──────────────────────┐
              │         EXTERNAL DATA SOURCES          │
              │  (all called in parallel via asyncio)  │
              │                                        │
              │  Wikipedia API   → history, overview   │
              │  Crunchbase API  → funding, investors  │
              │  NewsAPI         → trending news       │
              │  Yahoo Finance   → financials, stock   │
              │  Wikidata API    → structured facts    │
              │  MCA / OpenCorp  → India registration  │
              └────────────────┬──────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                        DATABASE LAYER                             │
│                                                                   │
│  PostgreSQL (Supabase — Free)     Redis (Upstash — Free)         │
│  Permanent storage                Temporary cache (6hr TTL)      │
│  Users, reviews, bookmarks        Company profile cache          │
│  Company metadata                 Search result cache            │
│  SQLAlchemy ORM                   redis-py / httpx client        │
└──────────────────────────────────────────────────────────────────┘
```

### How a Search Request Flows (Step by Step)

```
1.  User types "Infosys" → presses Enter
2.  React frontend sends: GET https://api.companyiq.app/company/search?q=Infosys
    Headers: { Authorization: "Bearer <jwt_token>" }

3.  FastAPI receives request
4.  JWT Middleware verifies token → extracts user_id
5.  Rate limiter checks: has this user exceeded 10 searches/min?

6.  Cache check: Redis.get("company:infosys")
    → If HIT: return cached data immediately (< 50ms) ✅
    → If MISS: proceed to fetch

7.  Aggregator fires ALL external API calls simultaneously (asyncio):
    ├── Wikipedia API    → company history & description
    ├── Crunchbase API   → founding year, funding rounds, investors
    ├── NewsAPI          → last 10 news headlines
    ├── Yahoo Finance    → revenue, profit, stock price history
    ├── Wikidata API     → HQ, employee count, CEO
    └── MCA API          → India registration data (CIN, directors)

8.  All results merged into one CompanyProfile dict
    (failures handled gracefully — one failed source ≠ broken result)

9.  CompanyProfile sent to Groq LLM with structured prompt
    → LLM returns: summary, pros, cons, culture_score, verdict, similar_companies

10. Final result = merged data + LLM insights

11. Store in Redis with 6-hour TTL:
    Redis.setex("company:infosys", 21600, result_json)

12. Save/update company record in PostgreSQL (for analytics)

13. Return JSON response to React frontend

14. React renders beautiful Apple-style company profile page
    with skeleton loading, smooth animations, charts
```

---

## 4. Tech Stack (All Free / Open Source)

### Frontend
| Technology | Purpose | Why This? |
|---|---|---|
| React 18 + Vite | UI framework | Fast HMR, modern, huge ecosystem |
| Tailwind CSS v3 | Styling | Perfect for Apple-style minimalism |
| Framer Motion | Animations | Smooth, Apple-like page transitions |
| TanStack Query (React Query) | Data fetching & server state | Auto loading/error states, caching |
| Zustand | Global client state | Lightweight, simple, no boilerplate |
| React Router v6 | Client-side routing | Standard, clean |
| Recharts | Charts & timeline graphs | Free, composable, React-native |
| Lucide React | Icons | Clean, minimal, Apple-like icons |
| React Hot Toast | Notifications | Minimal, elegant toasts |
| Axios | HTTP client | Clean API calls with interceptors |

### Backend
| Technology | Purpose | Why This? |
|---|---|---|
| FastAPI (Python 3.11+) | API framework | Fast, async, auto-docs, perfect for data-heavy work |
| SQLAlchemy 2.0 | ORM for PostgreSQL | Pythonic, powerful, industry standard |
| Alembic | Database migrations | Works with SQLAlchemy, clean migration history |
| Pydantic v2 | Request/response validation | Built into FastAPI, type-safe |
| python-jose | JWT token handling | Industry standard JWT for Python |
| bcrypt (passlib) | Password hashing | Secure, one-way password storage |
| httpx | Async HTTP client | Async external API calls (replaces requests) |
| asyncio | Parallel API calls | Call 6 data sources simultaneously |
| redis-py | Redis client | Cache read/write |
| python-dotenv | Environment variables | Load .env file |
| uvicorn | ASGI server | Runs FastAPI in production |

### Database & Infrastructure
| Technology | Purpose | Free Tier |
|---|---|---|
| Supabase | PostgreSQL hosting | 500MB, 50k rows, free forever |
| Upstash | Redis hosting | 10,000 commands/day free |
| Vercel | Frontend hosting | Free for hobby/personal projects |
| Render.com | FastAPI backend hosting | Free tier (750 hrs/month) |

### LLM
| Phase | Provider | Model | Cost |
|---|---|---|---|
| MVP | Groq API | LLaMA 3 70B | Free tier |
| Growth | OpenAI | GPT-4o mini | ~$0.15/1M tokens |
| Scale | OpenAI | GPT-4o + fine-tune | Custom |

> **Migration note**: The LLM layer is fully abstracted in `backend/app/services/llm/`. Switching from Groq to OpenAI is a single line change in `backend/app/services/llm/__init__.py`. No other file changes.

---

## 5. Authentication Strategy — Custom JWT (Built From Scratch)

### Decision: Build Our Own Auth

We are building our own authentication system instead of using a third-party service like Clerk. This decision is made for three reasons:
1. **Full data ownership** — all user data stays in our own PostgreSQL database
2. **No third-party dependency** — no vendor lock-in, no pricing risk
3. **Learning** — understanding auth deeply is a core developer skill

### What We Are Building

```
Sign Up  → user submits email + password
         → bcrypt hashes the password (never stored plain)
         → user saved to PostgreSQL users table
         → JWT access token generated (expires: 15 min)
         → JWT refresh token generated (expires: 7 days)
         → both tokens returned as HTTP-only cookies

Sign In  → user submits email + password
         → bcrypt verifies password against stored hash
         → if match: new JWT tokens issued in HTTP-only cookies
         → if no match: 401 Unauthorized

Protected Route → React sends request with JWT cookie
               → FastAPI middleware intercepts
               → Decodes + verifies JWT signature
               → Extracts user_id, attaches to request
               → Route handler receives verified user

Token Refresh → access token expires after 15 min
             → React detects 401 response
             → Automatically calls POST /auth/refresh
             → FastAPI verifies refresh token
             → Issues new access token
             → Original request retried transparently

Sign Out → HTTP-only cookies cleared on server side
         → refresh token invalidated in DB
```

### Why HTTP-only Cookies (Not localStorage)

This is a critical security decision:

| | localStorage | HTTP-only Cookie |
|---|---|---|
| XSS Attack | ❌ Vulnerable — JS can read it | ✅ Safe — JS cannot access it |
| CSRF Attack | ✅ Safe | ⚠️ Needs CSRF token (we add this) |
| Auto-sent with requests | ❌ Must add manually | ✅ Browser sends automatically |
| **Our choice** | ❌ | ✅ |

### Auth File Structure (Backend)
```
backend/app/
├── routers/
│   └── auth.py              # POST /auth/signup, /auth/signin, /auth/signout, /auth/refresh
├── services/
│   └── auth_service.py      # Business logic: hash password, verify, generate tokens
├── middleware/
│   └── auth_middleware.py   # JWT verification on every protected request
├── models/
│   └── user.py              # SQLAlchemy User model
└── schemas/
    └── auth.py              # Pydantic schemas: SignUpRequest, SignInRequest, TokenResponse
```

### Key Auth Code Concepts (What You Will Learn & Code)

**1. Password Hashing (auth_service.py)**
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)
    # "mysecret123" → "$2b$12$KIXfg3..."  (one-way, can never be reversed)

def verify_password(plain_password: str, hashed: str) -> bool:
    return pwd_context.verify(plain_password, hashed)
    # Returns True if password matches hash, False otherwise
```

**2. JWT Token Generation (auth_service.py)**
```python
from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "your-super-secret-key"  # from environment variable
ALGORITHM = "HS256"

def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,              # subject = who this token belongs to
        "exp": datetime.utcnow() + timedelta(minutes=15),  # expires in 15 min
        "type": "access"
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(days=7),  # expires in 7 days
        "type": "refresh"
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
```

**3. JWT Verification Middleware (middleware/auth_middleware.py)**
```python
from jose import jwt, JWTError
from fastapi import Request, HTTPException

async def verify_token(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        request.state.user_id = payload["sub"]  # attach user_id to request
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

**4. Sign Up Route (routers/auth.py)**
```python
@router.post("/auth/signup")
async def signup(data: SignUpRequest, response: Response, db: Session = Depends(get_db)):
    # 1. Check if email already exists
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(400, "Email already registered")

    # 2. Hash password
    hashed = hash_password(data.password)

    # 3. Save user to PostgreSQL
    user = User(email=data.email, name=data.name, password_hash=hashed)
    db.add(user)
    db.commit()

    # 4. Generate tokens
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    # 5. Set HTTP-only cookies
    response.set_cookie("access_token", access_token, httponly=True, secure=True, samesite="lax")
    response.set_cookie("refresh_token", refresh_token, httponly=True, secure=True, samesite="lax")

    return {"message": "Account created successfully", "user": {"id": user.id, "email": user.email}}
```

### Frontend Auth Flow (React)
```
AuthContext (Zustand store)
├── user: null | UserObject
├── isAuthenticated: boolean
├── login(email, password) → calls POST /auth/signin → updates store
├── signup(name, email, password) → calls POST /auth/signup → updates store
├── logout() → calls POST /auth/signout → clears store
└── checkAuth() → calls GET /auth/me on app load → restores session

Protected Route Component:
→ Checks isAuthenticated from store
→ If false → redirect to /sign-in
→ If true → render the protected page
```

---

## 6. Data Sources & Aggregation Strategy

### Source Map by Data Type

```
COMPANY BASICS (name, founded, HQ, description, CEO)
  Primary:   Wikipedia API     → free, no key, rich text
  Secondary: Wikidata API      → structured JSON facts
  Tertiary:  OpenCorporates    → global company registry

STARTUP & FUNDING DATA
  Primary:   Crunchbase Basic API → free tier, funding rounds, investors
  Fields:    founded_on, total_funding, last_funding_round, investors

INDIAN COMPANY REGISTRATION
  Primary:   MCA (data.gov.in)   → CIN, registration date, directors
  Fields:    company_type, registered_state, date_of_incorporation

FINANCIAL PERFORMANCE (listed companies only)
  Primary:   Yahoo Finance (yahoo-finance2 / yfinance Python lib — free)
  Fields:    revenue_history, net_profit, stock_price, market_cap
  Indian:    Use ticker format "INFY.NS", "TCS.NS", "WIPRO.NS"

NEWS & TRENDING
  Primary:   NewsAPI.org         → free tier: 100 requests/day
  Secondary: Google News RSS     → free, no key needed
  Format:    title, source, published_at, url

EMPLOYEE REVIEWS & SALARIES
  Phase 1 MVP: User-submitted anonymously through CompanyIQ itself
  Phase 2:     Potential data partnerships

SIMILAR COMPANIES
  Generated entirely by LLM based on: industry, size, geography, stage
```

### Aggregation Service (Python asyncio)

```python
# backend/app/services/aggregator.py

import asyncio
import httpx

async def aggregate_company_data(company_name: str) -> dict:

    async with httpx.AsyncClient(timeout=10.0) as client:

        # Fire ALL requests simultaneously — not one by one
        results = await asyncio.gather(
            fetch_wikipedia(client, company_name),
            fetch_crunchbase(client, company_name),
            fetch_news(client, company_name),
            fetch_financials(client, company_name),
            fetch_wikidata(client, company_name),
            return_exceptions=True   # ← CRITICAL: one failure won't crash all
        )

    wikipedia, crunchbase, news, financials, wikidata = results

    # Merge — handle each source gracefully if it failed
    merged = {
        "name":           _safe(crunchbase, "name") or _safe(wikipedia, "name") or company_name,
        "founded":        _safe(crunchbase, "founded_on") or _safe(wikipedia, "founded"),
        "description":    _safe(wikipedia, "description"),
        "headquarters":   _safe(wikidata, "hq") or _safe(wikipedia, "hq"),
        "employee_count": _safe(wikidata, "employees") or _safe(crunchbase, "employees"),
        "industry":       _safe(crunchbase, "industry") or _safe(wikidata, "industry"),
        "funding":        _safe(crunchbase, "funding_rounds", default=[]),
        "revenue":        _safe(financials, "revenue_history", default=[]),
        "news":           _safe(news, "articles", default=[])[:10],
        "ceo":            _safe(wikidata, "ceo"),
        "website":        _safe(crunchbase, "website") or _safe(wikipedia, "website"),
    }

    return merged

def _safe(source, key, default=None):
    """Safely extract from a source that might be an Exception"""
    if isinstance(source, Exception) or source is None:
        return default
    return source.get(key, default)
```

### Caching Strategy (Redis)

```
KEY FORMAT:    "company:{slug}"          e.g. "company:infosys"
TTL:           21600 seconds (6 hours)   company data is stable
NEWS TTL:      3600 seconds (1 hour)     news changes faster

FLOW:
  Request arrives for "Infosys"
      ↓
  Redis GET "company:infosys"
      ↓
  HIT  → return JSON immediately (< 50ms) ✅
  MISS → fetch all sources → merge → LLM → Redis SET → return

WHY 6 HOURS?
  Company founding date, revenue, culture don't change hourly.
  6 hours protects our free API quotas.
  If data feels stale, admin can manually bust the cache.
```

### Handling Missing Data — UI Rules
- Show sections with available data beautifully
- Show "Data unavailable" placeholder card for missing sections — never a broken UI
- LLM prompt instructs: "If data is limited, acknowledge it honestly"
- `data_confidence` field in response: "high" / "medium" / "low"

---

## 7. LLM Integration Strategy

### Provider: Groq (MVP) → OpenAI (Growth)

**Why Groq for MVP?**
- Free tier available
- LLaMA 3 70B is capable enough for summarization tasks
- Very fast inference (Groq's hardware is purpose-built)

### LLM Service (Fully Abstracted)

```python
# backend/app/services/llm/__init__.py
# THIS IS THE ONLY FILE THAT CHANGES WHEN SWITCHING PROVIDERS

from .groq import generate_company_insights   # MVP: Groq
# from .openai import generate_company_insights  # Later: just swap this line
```

```python
# backend/app/services/llm/groq.py

from groq import Groq
import json

client = Groq(api_key=settings.GROQ_API_KEY)

async def generate_company_insights(company_data: dict) -> dict:
    prompt = build_prompt(company_data)

    response = client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[
            {
                "role": "system",
                "content": """You are CompanyIQ's AI analyst. You synthesize company data
                into clear, honest, job-seeker-focused insights. Be factual, balanced, concise.
                Never invent data. If data is missing, say so.
                Respond ONLY with valid JSON. No preamble. No markdown."""
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=1500,
    )

    raw = response.choices[0].message.content
    return json.loads(raw)


def build_prompt(data: dict) -> str:
    return f"""
    Analyze this company from a job seeker's perspective.
    Return a JSON object with EXACTLY these keys:

    {{
      "summary": "2-3 sentence company overview",
      "growth_trajectory": "growing | stable | declining — with brief reason",
      "culture_score": <integer 1-10>,
      "pros": ["pro1", "pro2", "pro3"],
      "cons": ["con1", "con2", "con3"],
      "salary_insight": "general note on compensation based on available signals",
      "job_seeker_verdict": "honest one-paragraph assessment for someone considering joining",
      "similar_companies": ["Company A", "Company B", "Company C"],
      "data_confidence": "high | medium | low"
    }}

    COMPANY DATA:
    Name: {data.get('name')}
    Founded: {data.get('founded')}
    Industry: {data.get('industry')}
    Headquarters: {data.get('headquarters')}
    Employees: {data.get('employee_count')}
    CEO: {data.get('ceo')}
    Description: {data.get('description', '')[:500]}
    Funding: {json.dumps(data.get('funding', []))}
    Revenue History: {json.dumps(data.get('revenue', []))}
    Recent News: {', '.join([n.get('title','') for n in data.get('news', [])])}
    """
```

---

## 8. Database Design

### Why Two Databases? (PostgreSQL + Redis)

This is a very common question. They are NOT redundant — they solve completely different problems:

| | PostgreSQL | Redis |
|---|---|---|
| Type | Relational database | In-memory key-value store |
| Storage | Disk (permanent) | RAM (temporary) |
| Purpose | Store everything forever | Cache hot data for speed |
| Speed | ~5-50ms per query | < 1ms per operation |
| Use in CompanyIQ | Users, reviews, bookmarks | Company profiles, search cache |
| Cost if only one | Slow + high DB load | Can't store permanent data |

**The analogy**: PostgreSQL is your filing cabinet (permanent). Redis is your desktop notepad (fast, temporary). You need both.

### PostgreSQL Schema (SQLAlchemy Models)

```python
# backend/app/models/

# --- users table ---
class User(Base):
    __tablename__ = "users"

    id            = Column(UUID, primary_key=True, default=uuid4)
    email         = Column(String(255), unique=True, nullable=False, index=True)
    name          = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)   # bcrypt hash, never plain
    plan          = Column(String(50), default="free")    # "free" | "pro"
    is_verified   = Column(Boolean, default=False)
    created_at    = Column(DateTime, default=datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    bookmarks     = relationship("Bookmark", back_populates="user")
    reviews       = relationship("Review", back_populates="user")


# --- companies table (cached aggregated data) ---
class Company(Base):
    __tablename__ = "companies"

    id              = Column(UUID, primary_key=True, default=uuid4)
    name            = Column(String(255), nullable=False)
    slug            = Column(String(255), unique=True, nullable=False, index=True)
    data            = Column(JSONB)          # full aggregated data blob
    llm_insights    = Column(JSONB)          # LLM-generated insights
    search_count    = Column(Integer, default=0)   # analytics: how many searched this
    last_fetched_at = Column(DateTime)
    created_at      = Column(DateTime, default=datetime.utcnow)


# --- bookmarks table ---
class Bookmark(Base):
    __tablename__ = "bookmarks"

    id          = Column(UUID, primary_key=True, default=uuid4)
    user_id     = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"))
    company_id  = Column(UUID, ForeignKey("companies.id", ondelete="CASCADE"))
    created_at  = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("user_id", "company_id"),)


# --- reviews table (user-submitted, Phase 2) ---
class Review(Base):
    __tablename__ = "reviews"

    id                = Column(UUID, primary_key=True, default=uuid4)
    user_id           = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"))
    company_id        = Column(UUID, ForeignKey("companies.id", ondelete="CASCADE"))
    role              = Column(String(255))
    rating_overall    = Column(Integer)   # 1-5
    rating_worklife   = Column(Integer)   # 1-5
    rating_growth     = Column(Integer)   # 1-5
    rating_management = Column(Integer)   # 1-5
    pros              = Column(Text)
    cons              = Column(Text)
    salary_min        = Column(Integer)   # annual in INR
    salary_max        = Column(Integer)
    is_anonymous      = Column(Boolean, default=True)
    created_at        = Column(DateTime, default=datetime.utcnow)


# --- compare_sessions table ---
class CompareSession(Base):
    __tablename__ = "compare_sessions"

    id          = Column(UUID, primary_key=True, default=uuid4)
    user_id     = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"))
    company_ids = Column(ARRAY(UUID))    # array of company IDs being compared
    created_at  = Column(DateTime, default=datetime.utcnow)


# --- search_history table (for analytics + personalization) ---
class SearchHistory(Base):
    __tablename__ = "search_history"

    id         = Column(UUID, primary_key=True, default=uuid4)
    user_id    = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    query      = Column(String(255), nullable=False)
    company_id = Column(UUID, ForeignKey("companies.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# --- refresh_tokens table (for JWT invalidation on signout) ---
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id         = Column(UUID, primary_key=True, default=uuid4)
    user_id    = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"))
    token_hash = Column(String(255), unique=True)   # hashed refresh token
    expires_at = Column(DateTime)
    is_revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### Redis Key Patterns

```
company:{slug}           → full company profile JSON          TTL: 6 hours
news:{slug}              → news articles for a company        TTL: 1 hour
search:{query_hash}      → search result stubs                TTL: 30 min
ratelimit:{user_id}      → request count for rate limiting    TTL: 1 min
```

---

## 9. API Design (FastAPI Backend)

**Base URL (prod):** `https://api.companyiq.app`
**Base URL (dev):**  `http://localhost:8000`

All responses follow this envelope format:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "cached": true,
    "cache_age_seconds": 3240,
    "data_confidence": "high"
  },
  "error": null
}
```

### Auth Routes (`/auth`)
```
POST  /auth/signup          → Register new user
      Body: { name, email, password }
      Returns: user object + sets HTTP-only JWT cookies

POST  /auth/signin          → Login
      Body: { email, password }
      Returns: user object + sets HTTP-only JWT cookies

POST  /auth/signout         → Logout
      Clears cookies + revokes refresh token in DB

POST  /auth/refresh         → Get new access token using refresh token
      Reads refresh token from cookie
      Returns: new access token cookie

GET   /auth/me              → Get current authenticated user
      Requires: valid access token cookie
      Returns: user profile object
```

### Company Routes (`/company`)
```
GET   /company/search?q={query}         → Search companies
      Auth: optional (guests get limited results)
      Returns: array of CompanyStub objects

GET   /company/{slug}                   → Full company profile
      Auth: required
      Returns: CompanyProfile + LLM insights

GET   /company/{slug}/news              → Latest news
      Auth: required
      Returns: array of NewsArticle objects

GET   /company/{slug}/similar           → Similar companies
      Auth: required
      Returns: array of CompanyStub objects

GET   /company/{slug}/reviews           → User-submitted reviews
      Auth: required
      Returns: paginated array of Review objects

POST  /company/cache/bust/{slug}        → Admin: force refresh cache
      Auth: admin only
```

### Compare Routes (`/compare`)
```
POST  /compare                          → Generate comparison
      Auth: required
      Body: { company_slugs: ["infosys", "tcs"] }
      Returns: ComparisonResult object (side-by-side data)

GET   /compare/history                  → User's past comparisons
      Auth: required
```

### User Routes (`/user`)
```
GET   /user/bookmarks                   → Get all bookmarks
POST  /user/bookmarks                   → Add bookmark
      Body: { company_id }
DELETE /user/bookmarks/{company_id}     → Remove bookmark

GET   /user/history                     → Search history
DELETE /user/history                    → Clear history

POST  /user/reviews                     → Submit a review
      Body: { company_id, role, ratings, pros, cons, salary_min, salary_max }
```

### FastAPI App Structure
```python
# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, company, compare, user

app = FastAPI(title="CompanyIQ API", version="2.0.0")

# CORS — only allow our React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://companyiq.vercel.app", "http://localhost:5173"],
    allow_credentials=True,    # CRITICAL: needed for cookies to work cross-origin
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,    prefix="/auth",    tags=["Auth"])
app.include_router(company.router, prefix="/company", tags=["Company"])
app.include_router(compare.router, prefix="/compare", tags=["Compare"])
app.include_router(user.router,    prefix="/user",    tags=["User"])

# Auto-generated API docs at: http://localhost:8000/docs  ← FastAPI gives this for free!
```

---

## 10. Frontend Architecture (React + Vite)

### Page Structure
```
/                       → Home: hero search, trending companies, how it works
/company/{slug}         → Company profile: full data, right panel similar companies
/compare                → Side-by-side comparison page
/search?q={query}       → Search results list
/bookmarks              → User's saved companies
/dashboard              → User dashboard (history, account settings)
/sign-in                → Sign in page (custom built)
/sign-up                → Sign up page (custom built)
```

### State Architecture
```
Zustand (Global Client State):
  ├── auth slice:     { user, isAuthenticated, isLoading }
  ├── compare slice:  { selectedCompanies: [] }  ← max 2 free, 5 pro
  └── theme slice:    { mode: 'light' | 'dark' }

TanStack Query (Server State — auto cached):
  ├── useCompany(slug)       → fetches + caches company profile
  ├── useSearch(query)       → debounced search with 300ms delay
  ├── useBookmarks()         → user's saved companies
  ├── useCompare(slugs)      → comparison data
  └── useNews(slug)          → company news feed
```

### Component Hierarchy
```
App
├── Providers (QueryClient, Router, ThemeProvider)
│
├── Layout
│   ├── Navbar
│   │   ├── Logo
│   │   ├── GlobalSearchBar (with debounced suggestions)
│   │   ├── ThemeToggle (dark/light)
│   │   └── UserMenu (avatar, bookmarks, signout)
│   ├── CompareBar (floating, appears when 1+ companies added)
│   └── Footer
│
└── Pages
    ├── HomePage
    │   ├── HeroSection (large centered search)
    │   ├── TrendingCompanies (6 CompanyCards)
    │   └── HowItWorksSection
    │
    ├── CompanyProfilePage
    │   ├── CompanyHero (name, logo, tags, bookmark btn, compare btn)
    │   ├── MainContent (left, 70% width)
    │   │   ├── OverviewSection
    │   │   ├── TimelineSection (founding → milestones → now)
    │   │   ├── FinancialsSection (RevenueChart)
    │   │   ├── CultureSection (ScoreRings + LLM text)
    │   │   ├── ProsConsSection (LLM generated)
    │   │   ├── SalarySection
    │   │   └── NewsSection (NewsCards)
    │   └── RightPanel (30% width, sticky)
    │       └── SimilarCompanies (5 CompanyCards)
    │
    ├── ComparePage
    │   ├── CompareHeader (logos + names side by side)
    │   ├── CompareTable (metric rows)
    │   └── RadarChart (culture dimensions)
    │
    ├── SearchResultsPage
    │   └── CompanyCard (×n results)
    │
    ├── AuthPages
    │   ├── SignInPage (custom form)
    │   └── SignUpPage (custom form)
    │
    └── UserPages
        ├── BookmarksPage
        └── DashboardPage
```

---

## 11. File & Folder Structure

### Overview — Monorepo with Two Separate Apps
```
companyiq/
├── frontend/          ← React + Vite app (deployed to Vercel)
├── backend/           ← FastAPI Python app (deployed to Render.com)
├── .gitignore
└── README.md
```

### Frontend Structure
```
frontend/
├── public/
│   ├── favicon.ico
│   └── og-image.png
│
├── src/
│   ├── main.tsx                     # React entry point
│   ├── App.tsx                      # Router setup, providers
│   │
│   ├── pages/                       # One file per route
│   │   ├── HomePage.tsx
│   │   ├── CompanyProfilePage.tsx
│   │   ├── ComparePage.tsx
│   │   ├── SearchResultsPage.tsx
│   │   ├── BookmarksPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── SignInPage.tsx
│   │   └── SignUpPage.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── CompareBar.tsx        # Floating compare bar
│   │   │
│   │   ├── company/                  # Company profile sections
│   │   │   ├── CompanyHero.tsx
│   │   │   ├── OverviewSection.tsx
│   │   │   ├── TimelineSection.tsx
│   │   │   ├── FinancialsSection.tsx
│   │   │   ├── CultureSection.tsx
│   │   │   ├── ProsConsSection.tsx
│   │   │   ├── SalarySection.tsx
│   │   │   ├── NewsSection.tsx
│   │   │   └── SimilarCompanies.tsx
│   │   │
│   │   ├── compare/
│   │   │   ├── CompareHeader.tsx
│   │   │   ├── CompareTable.tsx
│   │   │   └── CompareRadarChart.tsx
│   │   │
│   │   ├── auth/                     # Custom auth forms
│   │   │   ├── SignInForm.tsx
│   │   │   ├── SignUpForm.tsx
│   │   │   └── ProtectedRoute.tsx    # Redirects to /sign-in if not auth'd
│   │   │
│   │   └── ui/                       # Reusable atomic components
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Card.tsx
│   │       ├── Badge.tsx
│   │       ├── CompanyCard.tsx
│   │       ├── ScoreRing.tsx
│   │       ├── Skeleton.tsx
│   │       ├── EmptyState.tsx
│   │       ├── ErrorState.tsx
│   │       └── Modal.tsx
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useCompany.ts             # TanStack Query: fetch company profile
│   │   ├── useSearch.ts              # Debounced search hook
│   │   ├── useCompare.ts             # Compare list management
│   │   ├── useBookmarks.ts           # Bookmark CRUD operations
│   │   └── useAuth.ts                # Auth actions: login, signup, logout
│   │
│   ├── store/                        # Zustand global state
│   │   ├── authStore.ts              # user, isAuthenticated
│   │   ├── compareStore.ts           # selectedCompanies for comparison
│   │   └── themeStore.ts             # dark/light mode
│   │
│   ├── api/                          # API call functions (Axios)
│   │   ├── client.ts                 # Axios instance with base URL + interceptors
│   │   ├── auth.api.ts               # signin, signup, signout, me
│   │   ├── company.api.ts            # search, getProfile, getNews
│   │   ├── compare.api.ts            # compare companies
│   │   └── user.api.ts               # bookmarks, history, reviews
│   │
│   ├── types/                        # TypeScript types
│   │   ├── company.ts                # CompanyProfile, CompanyStub, LLMInsights
│   │   ├── user.ts                   # User, AuthState
│   │   ├── review.ts                 # Review, ReviewForm
│   │   └── api.ts                    # APIResponse<T> wrapper type
│   │
│   └── styles/
│       └── globals.css               # Tailwind directives + CSS variables
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env                              # VITE_API_URL=http://localhost:8000
```

### Backend Structure
```
backend/
├── app/
│   ├── main.py                       # FastAPI app init, CORS, router registration
│   │
│   ├── core/
│   │   ├── config.py                 # Settings (reads from .env using pydantic-settings)
│   │   ├── database.py               # SQLAlchemy engine + session factory
│   │   ├── redis.py                  # Redis client singleton
│   │   └── security.py               # JWT constants, token helpers
│   │
│   ├── models/                       # SQLAlchemy table models (the actual DB tables)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── company.py
│   │   ├── bookmark.py
│   │   ├── review.py
│   │   ├── compare_session.py
│   │   ├── search_history.py
│   │   └── refresh_token.py
│   │
│   ├── schemas/                      # Pydantic models (request/response shapes)
│   │   ├── auth.py                   # SignUpRequest, SignInRequest, TokenResponse
│   │   ├── company.py                # CompanyProfile, CompanyStub, LLMInsights
│   │   ├── review.py                 # ReviewCreate, ReviewResponse
│   │   └── user.py                   # UserResponse, BookmarkCreate
│   │
│   ├── routers/                      # FastAPI route handlers
│   │   ├── auth.py                   # /auth/* routes
│   │   ├── company.py                # /company/* routes
│   │   ├── compare.py                # /compare/* routes
│   │   └── user.py                   # /user/* routes
│   │
│   ├── services/                     # Business logic (routers call services)
│   │   ├── auth_service.py           # hash_password, verify_password, create_tokens
│   │   ├── aggregator.py             # parallel fetch from all data sources
│   │   ├── cache_service.py          # Redis get/set/delete helpers
│   │   │
│   │   ├── data_sources/             # One file per external API
│   │   │   ├── __init__.py
│   │   │   ├── wikipedia.py
│   │   │   ├── crunchbase.py
│   │   │   ├── news.py
│   │   │   ├── financials.py         # Yahoo Finance via yfinance
│   │   │   └── wikidata.py
│   │   │
│   │   └── llm/                      # LLM abstraction layer
│   │       ├── __init__.py           # exports generate_company_insights()
│   │       ├── groq.py               # Groq implementation (current)
│   │       ├── openai.py             # OpenAI implementation (future)
│   │       └── prompts.py            # All prompt templates defined here
│   │
│   └── middleware/
│       ├── auth_middleware.py        # JWT verification dependency
│       └── rate_limiter.py           # Redis-based rate limiting
│
├── alembic/                          # Database migration files
│   ├── env.py
│   └── versions/
│       └── 001_initial_schema.py
│
├── alembic.ini
├── requirements.txt                  # All Python dependencies
├── .env                              # Environment variables (never commit)
├── .env.example                      # Template — commit this
├── Dockerfile                        # For Render.com deployment
└── README.md
```

---

## 12. UI/UX Design System (Apple-Inspired)

### Color Palette (CSS Variables)
```css
/* frontend/src/styles/globals.css */
:root {
  /* Backgrounds — Apple's signature gray hierarchy */
  --bg-primary:    #FFFFFF;
  --bg-secondary:  #F5F5F7;   /* Apple's signature light gray */
  --bg-tertiary:   #E8E8ED;

  /* Text */
  --text-primary:   #1D1D1F;  /* Apple's near-black */
  --text-secondary: #6E6E73;
  --text-tertiary:  #AEAEB2;

  /* Accent — Apple blue */
  --accent:       #0071E3;
  --accent-hover: #0077ED;
  --accent-light: #E8F1FD;

  /* Semantic */
  --success: #34C759;   /* Apple green */
  --warning: #FF9F0A;   /* Apple orange */
  --danger:  #FF3B30;   /* Apple red */

  /* Borders */
  --border:        rgba(0, 0, 0, 0.08);
  --border-strong: rgba(0, 0, 0, 0.15);

  /* Shadows — Apple uses very subtle shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.10);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.12);
}

/* Dark mode — true Apple dark, not just inverted */
[data-theme="dark"] {
  --bg-primary:    #000000;   /* Pure black like macOS dark mode */
  --bg-secondary:  #1C1C1E;
  --bg-tertiary:   #2C2C2E;
  --text-primary:  #F5F5F7;
  --text-secondary:#98989D;
  --text-tertiary: #636366;
  --border:        rgba(255, 255, 255, 0.08);
  --shadow-md:     0 4px 16px rgba(0,0,0,0.4);
}
```

### Typography (SF Pro System Stack)
```javascript
// tailwind.config.ts
fontFamily: {
  sans: [
    "-apple-system",       // SF Pro on Apple devices
    "BlinkMacSystemFont",
    "SF Pro Display",
    "Segoe UI",            // Windows fallback
    "sans-serif"
  ],
}
```

### Spacing & Radius Tokens
```
Border radius: 12px (cards), 8px (buttons/inputs), 999px (pills/tags)
Spacing grid:  8pt base (8, 16, 24, 32, 48, 64, 80, 96)
Max content:   1200px centered
Sidebar width: 30% (similar companies panel)
Main width:    70% (company profile content)
```

### Key UI Patterns
- **Cards**: 12px radius, `--shadow-sm`, `--bg-primary` background, `--border` border
- **Primary Button**: `--accent` filled, white text, 8px radius, hover lifts with `--shadow-md`
- **Secondary Button**: ghost (transparent bg, `--accent` border + text)
- **Search bar**: large (56px tall), centered, SF Pro, subtle shadow — like apple.com
- **Section separation**: whitespace only, never dividers
- **Data charts**: Recharts, `--accent` blue primary, `--success` green secondary
- **Loading states**: Skeleton screens (animated pulse), never spinners
- **Animations**: Framer Motion, 200-300ms ease-out, fade + translateY(8px) → translateY(0)
- **Empty states**: Illustrated, friendly message, clear CTA

---

## 13. Feature Roadmap

### MVP — Month 1-2 (Validate the Core Idea)
- [ ] Custom JWT auth (signup, signin, signout, refresh)
- [ ] Company search with debounced suggestions
- [ ] Company profile page (overview, history, LLM summary, pros/cons, news)
- [ ] Similar companies right panel
- [ ] Basic bookmarking
- [ ] Compare 2 companies side by side
- [ ] Dark / light mode toggle
- [ ] Mobile responsive (375px+)
- [ ] 20 pre-seeded companies for reliable demo

### V2 — Month 3-4 (Add Depth & Data)
- [ ] User-submitted reviews & salary data
- [ ] Financial timeline charts (Yahoo Finance integration)
- [ ] Company milestone timeline visualization
- [ ] Culture score aggregated from user reviews
- [ ] Google OAuth login (social sign in)
- [ ] Compare up to 5 companies (Pro tier gate)
- [ ] Company news alerts (email digest)
- [ ] PDF export of comparison report

### V3 — Month 5-6 (Scale & Monetize)
- [ ] Stripe subscription (Pro plan billing)
- [ ] Advanced salary analytics by city + experience
- [ ] Industry-level leaderboards ("Top IT companies in Pune")
- [ ] Browser extension (research company while browsing LinkedIn)
- [ ] Recruitment agency B2B API access
- [ ] College placement cell partnership plans

---

## 14. Deployment Strategy (Free Tier)

```
FRONTEND  → Vercel
  Framework:  React + Vite
  Deploy:     git push → auto-deploy via GitHub
  URL:        https://companyiq.vercel.app
  Cost:       Free

BACKEND   → Render.com
  Framework:  FastAPI + Uvicorn
  Deploy:     Dockerfile or direct Python
  URL:        https://api-companyiq.onrender.com
  Cost:       Free (750 hrs/month = always on for 1 service)
  Note:       Free tier spins down after 15min inactivity — first request is slow.
              Upgrade to $7/month paid to keep always-on when we have users.

DATABASE  → Supabase (PostgreSQL)
  Plan:       Free — 500MB storage, 50k rows
  Access:     DATABASE_URL connection string via SQLAlchemy
  Cost:       Free

CACHE     → Upstash (Redis)
  Plan:       Free — 10,000 commands/day
  Access:     REST API or redis-py
  Cost:       Free

DOMAIN    → Vercel subdomain free (.vercel.app)
  Later:      Buy companyiq.in (~₹800/year on GoDaddy)
              Point to Vercel via CNAME
```

### Environment Variables

**Backend (.env)**
```bash
# App
APP_ENV=development
SECRET_KEY=your-256-bit-secret-key-here-generate-with-openssl-rand-hex-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres

# Redis
REDIS_URL=rediss://default:token@host.upstash.io:6379

# LLM
GROQ_API_KEY=gsk_...

# External Data Sources
CRUNCHBASE_API_KEY=...
NEWS_API_KEY=...               # newsapi.org

# CORS
FRONTEND_URL=http://localhost:5173

# (Future) Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=...
SMTP_PASSWORD=...
```

**Frontend (.env)**
```bash
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=CompanyIQ
```

---

## 15. Security Considerations

### Auth Security
- Passwords hashed with bcrypt (cost factor 12) — never stored plain, never logged
- JWT signed with HS256 + secret key from environment (never hardcoded)
- Access tokens expire in 15 minutes (short window limits damage if stolen)
- Refresh tokens stored as hashed values in DB (not raw)
- HTTP-only cookies — JavaScript cannot access tokens at all (blocks XSS)
- `secure=True` + `samesite=lax` on cookies — safe cross-origin with credentials
- Signout revokes refresh token in DB (true logout, not just cookie clear)

### API Security
- All API keys in `.env` files — NEVER in code, NEVER in Git
- `.env` in `.gitignore` — committed as `.env.example` with placeholder values
- CORS configured to allowlist only our frontend URL
- All external API calls are server-side only — keys never exposed to browser

### Input Validation
- All request bodies validated with Pydantic (FastAPI's built-in)
- Company name inputs sanitized before LLM prompt injection
- SQL injection impossible via SQLAlchemy ORM (parameterized queries)
- XSS prevention via React's default escaping + HTTP-only cookies

### Rate Limiting
```python
# Redis-based rate limiter
# 10 searches per minute per authenticated user
# 5 searches per minute per IP for guests
# Implemented in: backend/app/middleware/rate_limiter.py
```

### Data Validation
- Pydantic models enforce types on every request and response
- JSONB fields in PostgreSQL validated before storage
- LLM response parsed as JSON with try/catch — bad LLM output won't crash the API

---

## 16. Key Developer Notes & Learning Path

### For the Developer (You) — What You Will Learn Building This

**Phase 1 — Auth (Most Important Foundation)**
You will learn: password hashing, JWT theory, HTTP cookies, middleware, protected routes.
This knowledge applies to EVERY web app you will ever build.

**Phase 2 — FastAPI Backend**
You will learn: REST API design, async Python, database ORM, parallel API calls with asyncio.
Python + FastAPI is one of the most in-demand backend stacks in the world right now.

**Phase 3 — Data Aggregation**
You will learn: working with multiple APIs, error handling, data merging, caching strategy.
This is real-world backend engineering that most tutorials never teach.

**Phase 4 — LLM Integration**
You will learn: prompt engineering, LLM APIs, structured output parsing.
This is the most valuable skill in tech right now.

**Phase 5 — Frontend + Full Integration**
You will learn: React state management, API integration, protected routes on frontend, UX polish.

### Architecture Principles to Follow

1. **Start with data pipeline, not UI.** Prove you can fetch and merge data for 10 real companies before touching React.

2. **Never call Groq/OpenAI directly from a router.** Always go through `services/llm/__init__.py`. This is what makes provider switching a one-line change.

3. **Never call external APIs from a router.** Routers call services. Services call data sources. Keep layers clean.

4. **Use `asyncio.gather()` with `return_exceptions=True`**, not sequential awaits. One failing external API should never block the whole response.

5. **Cache everything aggressively.** On free API tiers, every cache miss costs quota. Think of Redis as your shield.

6. **Seed 20 companies into the DB on first run.** This ensures the demo always works even if all external APIs are down. Use Infosys, TCS, Wipro, Razorpay, Zepto, CRED, Swiggy, Zomato, Freshworks, BYJU'S, Ola, Flipkart, PhonePe, Paytm, Google, Microsoft, Amazon, Meta, Apple, Atlassian.

7. **The compare feature is the hero.** Spend extra design time here. Smooth animations, clear visual hierarchy. This is what users will screenshot and share.

8. **Mobile first, always.** Design every component at 375px first. Most Indian job seekers are on mobile.

9. **The company slug is sacred.** Always lowercase, hyphenated (`tata-consultancy-services`). It is the primary URL key. Never change a slug once set — it breaks bookmarks and shared links.

10. **Python for backend, TypeScript for frontend.** Strict typing in both. Define schemas in Pydantic (backend) and TypeScript interfaces (frontend). This catches 80% of bugs before they happen.

---

*Document Version: 2.0*
*Project: CompanyIQ*
*Target Audience: Developer (owner) + Senior Developer / Architect handoff*
*Stack: React + Vite · FastAPI (Python) · Custom JWT Auth · PostgreSQL (Supabase) · Redis (Upstash) · Groq LLM · Vercel + Render.com*
*Last Discussion Round: Auth ownership, FastAPI vs Node, dual-DB justification, PostgreSQL confirmation*
