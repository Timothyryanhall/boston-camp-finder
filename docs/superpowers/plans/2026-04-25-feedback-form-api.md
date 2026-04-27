# Feedback Form + API + Database Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a sidebar feedback/camp-suggestion form backed by a Vercel serverless API and Neon Postgres, replacing the current GitHub-Issues-based PR #11, and migrate hosting from GitHub Pages to Vercel.

**Architecture:** The existing static `index.html` is served from Vercel unchanged except for a new `FeedbackBox` React component. A single Vercel serverless function at `/api/submit` validates POST bodies and writes rows to a Neon Postgres `submissions` table. No admin UI — submissions are reviewed directly in the Neon web console.

**Tech Stack:** Node.js (Vercel serverless), `@neondatabase/serverless`, `node:test` (built-in, no extra deps), Neon Postgres, React (existing, CDN).

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `api/validate.js` | Create | Pure validation logic — testable without DB |
| `api/submit.js` | Create | Vercel serverless handler — calls validate, writes to Neon |
| `api/schema.sql` | Create | DB migration to run once in Neon console |
| `api/validate.test.js` | Create | Unit tests for validation logic |
| `package.json` | Create | Node.js deps for API (`@neondatabase/serverless`) |
| `vercel.json` | Create | Marks project as framework-less for Vercel |
| `index.html` | Modify | Replace FeedbackBox stub with working component (line ~653) |

---

## Task 1: Node.js package setup

**Files:**
- Create: `package.json`
- Create: `vercel.json`

- [ ] **Step 1: Create `package.json`**

```json
{
  "dependencies": {
    "@neondatabase/serverless": "^0.10.4"
  }
}
```

- [ ] **Step 2: Create `vercel.json`**

```json
{
  "framework": null
}
```

- [ ] **Step 3: Install dependencies**

```bash
cd /Users/timothyhall/Projects/boston-camp-finder
npm install
```

Expected: `node_modules/` created, `package-lock.json` written.

- [ ] **Step 4: Add `node_modules` to `.gitignore`**

Open `.gitignore` (or create it if it doesn't exist). Add this line if not already present:

```
node_modules/
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vercel.json .gitignore
git commit -m "chore: add Node.js package setup for Vercel API"
```

---

## Task 2: Database schema

**Files:**
- Create: `api/schema.sql`

- [ ] **Step 1: Create `api/schema.sql`**

```sql
CREATE TABLE IF NOT EXISTS submissions (
  id         serial primary key,
  type       text        not null check (type in ('suggestion', 'feedback')),
  camp_name  text,
  camp_url   text,
  notes      text,
  created_at timestamptz not null default now()
);
```

- [ ] **Step 2: Run the migration in Neon console**

This is a manual step done once:
1. Go to `console.neon.tech`
2. Open your project → SQL Editor
3. Paste the contents of `api/schema.sql` and click Run
4. Verify the `submissions` table appears in the Tables view

- [ ] **Step 3: Commit**

```bash
git add api/schema.sql
git commit -m "chore: add database schema for submissions table"
```

---

## Task 3: Validation logic with tests (TDD)

**Files:**
- Create: `api/validate.js`
- Create: `api/validate.test.js`

- [ ] **Step 1: Write failing tests in `api/validate.test.js`**

```javascript
const { test } = require('node:test');
const assert = require('node:assert/strict');

// validate is not defined yet — all tests will fail
const { validate } = require('./validate');

test('rejects missing body', () => {
  const result = validate(undefined);
  assert.equal(result.ok, false);
  assert.ok(result.error);
});

test('rejects invalid type', () => {
  const result = validate({ type: 'bogus', notes: 'hi' });
  assert.equal(result.ok, false);
  assert.match(result.error, /type/);
});

test('rejects suggestion with no fields filled', () => {
  const result = validate({ type: 'suggestion' });
  assert.equal(result.ok, false);
  assert.match(result.error, /field/i);
});

test('rejects feedback with no fields filled', () => {
  const result = validate({ type: 'feedback' });
  assert.equal(result.ok, false);
});

test('rejects fields that are only whitespace', () => {
  const result = validate({ type: 'feedback', notes: '   ' });
  assert.equal(result.ok, false);
});

test('accepts valid suggestion with camp_name only', () => {
  const result = validate({ type: 'suggestion', camp_name: 'Cool Camp' });
  assert.deepEqual(result, { ok: true });
});

test('accepts valid suggestion with camp_url only', () => {
  const result = validate({ type: 'suggestion', camp_url: 'https://example.com' });
  assert.deepEqual(result, { ok: true });
});

test('accepts valid feedback with notes', () => {
  const result = validate({ type: 'feedback', notes: 'Great site!' });
  assert.deepEqual(result, { ok: true });
});

test('accepts suggestion with all fields', () => {
  const result = validate({
    type: 'suggestion',
    camp_name: 'Cool Camp',
    camp_url: 'https://example.com',
    notes: 'Great for 5-year-olds',
  });
  assert.deepEqual(result, { ok: true });
});
```

- [ ] **Step 2: Run tests — verify they all fail**

```bash
node --test api/validate.test.js
```

Expected: all 9 tests fail with `Cannot find module './validate'` or similar.

- [ ] **Step 3: Implement `api/validate.js`**

```javascript
const VALID_TYPES = ['suggestion', 'feedback'];

function validate(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body is required' };
  }

  const { type, camp_name, camp_url, notes } = body;

  if (!VALID_TYPES.includes(type)) {
    return { ok: false, error: 'type must be "suggestion" or "feedback"' };
  }

  const hasContent = [camp_name, camp_url, notes].some(
    v => typeof v === 'string' && v.trim().length > 0
  );
  if (!hasContent) {
    return { ok: false, error: 'At least one text field is required' };
  }

  return { ok: true };
}

module.exports = { validate };
```

- [ ] **Step 4: Run tests — verify they all pass**

```bash
node --test api/validate.test.js
```

Expected: `9 tests passed`.

- [ ] **Step 5: Commit**

```bash
git add api/validate.js api/validate.test.js
git commit -m "feat: add API validation logic with tests"
```

---

## Task 4: Serverless handler

**Files:**
- Create: `api/submit.js`

- [ ] **Step 1: Create `api/submit.js`**

```javascript
const { neon } = require('@neondatabase/serverless');
const { validate } = require('./validate');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = validate(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  const { type, camp_name, camp_url, notes } = req.body;

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      INSERT INTO submissions (type, camp_name, camp_url, notes)
      VALUES (
        ${type},
        ${camp_name?.trim() || null},
        ${camp_url?.trim() || null},
        ${notes?.trim() || null}
      )
    `;
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('DB write error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
```

- [ ] **Step 2: Verify the file loads without error**

```bash
node -e "require('./api/submit')" 2>&1
```

Expected: no output (the module loads cleanly; DATABASE_URL is only needed at call time).

- [ ] **Step 3: Commit**

```bash
git add api/submit.js
git commit -m "feat: add /api/submit serverless handler"
```

---

## Task 5: FeedbackBox component in index.html

**Files:**
- Modify: `index.html`

The new `FeedbackBox` component replaces the stub that was removed in commit `938b7d2`. It goes at line 653, just before the `// ── Main App ───` comment. The component posts to `/api/submit` instead of opening a GitHub issue.

- [ ] **Step 1: Insert `FeedbackBox` into `index.html` before line 654**

Find the line that reads:
```javascript
// ── Main App ───────────────────────────────────────────────────────────────────
```

Insert the following block immediately before it:

```javascript
// ── Feedback & Suggestions ────────────────────────────────────────────────────
function FeedbackBox() {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState('');
  const [campName, setCampName] = React.useState('');
  const [campUrl, setCampUrl] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [feedbackText, setFeedbackText] = React.useState('');
  const [status, setStatus] = React.useState('idle'); // 'idle'|'submitting'|'success'|'error'

  async function post(body) {
    setStatus('submitting');
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  function submitSuggestion(e) {
    e.preventDefault();
    post({ type: 'suggestion', camp_name: campName, camp_url: campUrl, notes });
    setCampName(''); setCampUrl(''); setNotes('');
  }

  function submitFeedback(e) {
    e.preventDefault();
    post({ type: 'feedback', notes: feedbackText });
    setFeedbackText('');
  }

  const sectionHeaderStyle = {
    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0',
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.muted,
    fontFamily: 'inherit',
  };

  const btnStyle = {
    padding: '8px 12px', border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm,
    background: 'none', cursor: 'pointer', textAlign: 'left',
    fontSize: 12, fontWeight: 600, color: T.ink, fontFamily: 'inherit', width: '100%',
  };

  const submitBtnStyle = {
    padding: '9px 14px', background: ACCENT, color: '#fff', border: 'none',
    borderRadius: T.radiusSm, fontSize: 13, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'inherit', opacity: 1,
  };

  const backBtnStyle = {
    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
    fontSize: 12, color: T.muted, padding: 0, fontFamily: 'inherit',
  };

  if (status === 'success') {
    return (
      <div style={{ borderTop: `1px solid ${T.borderLight}`, paddingTop: 12, marginTop: 4 }}>
        <div style={{ fontSize: 13, color: T.green, fontWeight: 600 }}>Thanks! We'll take a look.</div>
        <button onClick={() => { setStatus('idle'); setMode(''); }} style={{ ...backBtnStyle, marginTop: 6 }}>
          Submit another
        </button>
      </div>
    );
  }

  return (
    <div style={{ borderTop: `1px solid ${T.borderLight}`, paddingTop: 12, marginTop: 4 }}>
      <button onClick={() => { setOpen(o => !o); setMode(''); setStatus('idle'); }} style={sectionHeaderStyle}>
        <span>Feedback &amp; Suggestions</span>
        <span style={{ fontSize: 16, lineHeight: 1, fontWeight: 400 }}>{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {status === 'error' && (
            <div style={{ fontSize: 12, color: T.coral, fontWeight: 500 }}>
              Something went wrong — please try again.
            </div>
          )}

          {mode === '' && (
            <>
              <button style={btnStyle} onClick={() => { setMode('suggest'); setStatus('idle'); }}>
                ➕ Suggest a camp
              </button>
              <button style={btnStyle} onClick={() => { setMode('feedback'); setStatus('idle'); }}>
                💬 Leave feedback
              </button>
            </>
          )}

          {mode === 'suggest' && (
            <form onSubmit={submitSuggestion} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button type="button" onClick={() => setMode('')} style={backBtnStyle}>← Back</button>
              <input
                type="text" placeholder="Camp name *" required value={campName}
                onChange={e => setCampName(e.target.value)}
                style={inputStyle}
              />
              <input
                type="url" placeholder="Camp website (optional)" value={campUrl}
                onChange={e => setCampUrl(e.target.value)}
                style={inputStyle}
              />
              <textarea
                placeholder="Notes — age range, neighborhood, why it's great…"
                value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                style={{ ...inputStyle, padding: '8px 10px', resize: 'vertical', minHeight: 72 }}
              />
              <button type="submit" disabled={status === 'submitting'} style={submitBtnStyle}>
                {status === 'submitting' ? 'Sending…' : 'Submit suggestion'}
              </button>
            </form>
          )}

          {mode === 'feedback' && (
            <form onSubmit={submitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button type="button" onClick={() => setMode('')} style={backBtnStyle}>← Back</button>
              <textarea
                placeholder="What would you like to share?" required
                value={feedbackText} onChange={e => setFeedbackText(e.target.value)} rows={4}
                style={{ ...inputStyle, padding: '8px 10px', resize: 'vertical', minHeight: 96 }}
              />
              <button type="submit" disabled={!feedbackText.trim() || status === 'submitting'} style={submitBtnStyle}>
                {status === 'submitting' ? 'Sending…' : 'Submit feedback'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

```

- [ ] **Step 2: Add `<FeedbackBox />` to the sidebar in `index.html`**

In the sidebar's inner scroll `<div>` (around line 912), just before its closing `</div>` tag, add:

```jsx
            <FeedbackBox />
```

The surrounding context looks like this — add it where shown:

```jsx
          </div>   {/* end org filter inner div */}
          </div>   {/* end org filter wrapper */}

          <FeedbackBox />   {/* ← add here */}

        </div>   {/* end sidebar scroll container */}
        {isMobile && (
```

- [ ] **Step 3: Open `index.html` in a browser and smoke-test locally**

```bash
open /Users/timothyhall/Projects/boston-camp-finder/index.html
```

Verify:
- "Feedback & Suggestions" toggle appears at the bottom of the sidebar
- Clicking it expands the panel
- Both "Suggest a camp" and "Leave feedback" buttons appear
- Filling in the suggestion form and clicking Submit shows "Sending…" briefly then an error (expected — no API running locally)
- The error state shows "Something went wrong — please try again."

Note: Full form submission only works after Vercel deployment (Task 6). The local smoke test verifies the UI renders and the error path works.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add FeedbackBox component posting to /api/submit"
```

---

## Task 6: Vercel deployment + Neon integration (manual steps)

This task is done in the Vercel dashboard, not in code. No commits needed.

- [ ] **Step 1: Connect the GitHub repo to Vercel**

1. Go to `vercel.com` → Add New Project
2. Import `timothyryanhall/boston-camp-finder`
3. Framework Preset: **Other** (no framework)
4. Root Directory: `.` (default)
5. Build Command: leave empty
6. Output Directory: `.` (default — serves index.html from root)
7. Click Deploy

Expected: Vercel builds and deploys. Visit the auto-generated `.vercel.app` URL and verify the camp finder loads.

- [ ] **Step 2: Add Neon Postgres via Vercel marketplace**

1. In your Vercel project → Storage tab → Add Store → Neon Postgres
2. Create a new Neon database (free tier)
3. Vercel will auto-inject `DATABASE_URL` (and others) into your project's environment variables

- [ ] **Step 3: Run the schema migration**

1. Go to `console.neon.tech` → your new database → SQL Editor
2. Paste and run the contents of `api/schema.sql`
3. Confirm `submissions` table exists in the Tables view

- [ ] **Step 4: Trigger a redeployment**

```bash
git commit --allow-empty -m "chore: trigger redeploy after Neon integration"
git push
```

Wait for Vercel to finish deploying.

- [ ] **Step 5: Smoke-test the live API**

```bash
# Should return {"ok":true}
curl -s -X POST https://<your-vercel-url>.vercel.app/api/submit \
  -H "Content-Type: application/json" \
  -d '{"type":"suggestion","camp_name":"Test Camp","notes":"smoke test"}' | cat

# Should return {"error":"type must be..."}
curl -s -X POST https://<your-vercel-url>.vercel.app/api/submit \
  -H "Content-Type: application/json" \
  -d '{"type":"bad"}' | cat
```

- [ ] **Step 6: Verify the test row appears in Neon**

In the Neon SQL Editor:

```sql
SELECT * FROM submissions ORDER BY created_at DESC LIMIT 5;
```

Expected: the smoke-test row from Step 5 appears. Delete it after verifying:

```sql
DELETE FROM submissions WHERE camp_name = 'Test Camp';
```

- [ ] **Step 7: Test the full form in the browser**

Open the deployed `.vercel.app` URL → open the "Feedback & Suggestions" panel → submit a camp suggestion → confirm "Thanks! We'll take a look." appears → verify the row in Neon console.

---

## Task 7: Domain, cutover, and cleanup

- [ ] **Step 1: Purchase `bostoncampfinder.com` in Vercel**

1. Vercel project → Settings → Domains → Add
2. Search for `bostoncampfinder.com`, purchase if available
3. Vercel will auto-configure DNS

Wait for DNS propagation (usually 5–15 min with Vercel's nameservers).

- [ ] **Step 2: Verify the domain works**

```bash
curl -s -o /dev/null -w "%{http_code}" https://bostoncampfinder.com
```

Expected: `200`.

- [ ] **Step 3: Disable GitHub Pages**

1. GitHub repo → Settings → Pages
2. Under "Source", select **None** and save

- [ ] **Step 4: Close PR #11**

```bash
gh -R timothyryanhall/boston-camp-finder pr close 11 \
  --comment "Closing in favour of the Vercel-backed implementation — this PR used GitHub Issues as the submission target, which required users to have a GitHub account. The new approach uses a Vercel serverless function + Neon Postgres instead."
```

- [ ] **Step 5: Push the full branch and open a new PR**

```bash
git push -u origin HEAD
gh pr create \
  --title "feat: feedback form with Vercel API + Neon Postgres" \
  --body "$(cat <<'EOF'
## Summary
- Adds `FeedbackBox` component to sidebar (suggest a camp, leave feedback)
- Submissions POST to `/api/submit` — no GitHub account required
- Vercel serverless handler validates input and writes to Neon Postgres
- Migrates hosting from GitHub Pages to Vercel
- Purchases `bostoncampfinder.com` domain via Vercel

## Reviewing submissions
Query directly in [Neon console](https://console.neon.tech):
\`\`\`sql
SELECT * FROM submissions ORDER BY created_at DESC;
\`\`\`

## Closes
Supersedes #11 (GitHub Issues approach removed — account requirement too high a barrier).

## Test plan
- [ ] Submit a camp suggestion via the live form, verify row in Neon
- [ ] Submit general feedback, verify row in Neon
- [ ] Submit with empty fields — confirm button is disabled / validation error returned
- [ ] `curl` the API with bad `type` — confirm 400 response
- [ ] Verify `node --test api/validate.test.js` passes
EOF
)"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Vercel deployment setup — Task 6
- ✅ `bostoncampfinder.com` domain — Task 7, Step 1
- ✅ `/api/submit` serverless function — Task 4
- ✅ Neon Postgres `submissions` table — Tasks 2 & 6
- ✅ Updated `FeedbackBox` (POST instead of GitHub issue) — Task 5
- ✅ Two modes: suggest a camp, leave feedback — Task 5
- ✅ Inline success/error states — Task 5
- ✅ Close PR #11 — Task 7, Step 4
- ✅ GitHub Pages disabled — Task 7, Step 3
- ✅ No admin UI (Neon console for review) — Task 6, Steps 3 & 6

**Out of scope confirmed absent:** favorites/bookmarking, CAPTCHA, rate limiting, component breakdown.

**Placeholder scan:** No TBDs, TODOs, or vague steps. All code blocks are complete and runnable.

**Type consistency:** `validate()` defined in Task 3, imported in Task 4 as `require('./validate')`. `FeedbackBox` defined in Task 5, inserted into sidebar in Task 5 Step 2. `inputStyle`, `T`, `ACCENT` referenced in FeedbackBox — all defined in the existing `index.html` before the insertion point. ✅
