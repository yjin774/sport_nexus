## Quick context

This is a small static web app that implements an authentication flow using Supabase. Key entry points:

- `index.html` — main login page (role toggle: STAFF / SUPPLIER). Contains a small inline Supabase initializer.
- `forgot-password.html` — password reset page and OTP inputs; also contains an inline Supabase initializer.
- `script.js` — client-side logic (vanilla DOM, no frameworks). Handles password visibility toggle, role toggle, and the login flow.
- `supabase-config.js` — centralized Supabase client creation (exports a global `supabase` variable when loaded).
- `database-setup.sql`, `CREATE_TABLES_FIRST.md`, `INSERT_USER_TO_TABLE.md` — SQL and docs for local Supabase/Postgres schema and sample data.

Important behaviors to follow when making changes:

- The app is served as static files (no bundler). Edits to HTML/JS are loaded directly by the browser (use a local static server for testing).
- Authentication sequence (see `script.js`):
  1. Call `supabase.auth.signInWithPassword({ email, password })`.
  2. Query either the `staff` or `supplier` table to find the user row and verify `userData.role` matches selected role.
  3. Store session info in `sessionStorage` and redirect to `home-page.html`.

## Conventions & patterns (project-specific)

- Vanilla JS only: `script.js` manipulates DOM directly (querySelector, addEventListener). Follow existing patterns for UI feedback (disable button, change text, change button background color).
- Role is chosen by adding/removing `.active` on buttons inside `.role-toggle`. When adding UI or tests, use that same class toggle and `data-role` attribute.
- Password visibility is toggled by buttons with the `.toggle-visibility` class and `data-target` pointing to the input id. Icon files referenced: `sn_eyes_open.png`, `sn_eyes_closed.png`.
- Supabase usage: code expects a global `supabase` client (see `supabase-config.js` and the small inline initializers in `index.html`/`forgot-password.html`). Some pages initialize supabase inline; `supabase-config.js` also creates a client — be consistent when editing or adding pages.
- Session persistence: session details are saved to `sessionStorage` under key `user`. Other pages read that to grant access.

## Integration & external dependencies

- Supabase JS client is loaded from CDN in the HTML files: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`.
- Database tables used by the app: `staff`, `supplier`. See `database-setup.sql` for schema and `INSERT_USER_TO_TABLE.md` for seed examples.
- Supabase credentials are present in `supabase-config.js` and duplicated in inline `<script>` blocks in HTML — treat these as test/dev keys. Do NOT exfiltrate or commit different production keys without following your org's secret rules.

## How to run locally (useful commands)

This is a static site — run a local static server from the project root. Example (macOS / bash):

```bash
# from /Users/jinnn/sportNexus
python3 -m http.server 8000
# then open http://localhost:8000/index.html
```

Alternatively use any static server (Live Server in VS Code, `npx http-server`, etc.).

## Code examples to reference (copyable snippets)

- Login + role check (from `script.js`):

```js
// after signInWithPassword
const tableName = role === 'staff' ? 'staff' : 'supplier';
const { data: userData } = await supabase.from(tableName).select('*').eq('email', email).single();
if (userData.role !== role) throw new Error('Invalid role');
```

## Safety and edits to be aware of

- The repo currently stores an anon Supabase key in `supabase-config.js` and inline HTML — assume these are dev keys. When adding CI or cloud deployments, replace with secure secrets management and do not commit production keys.
- Avoid introducing build tooling unless necessary — many files assume direct file references (e.g., `<script src="script.js"></script>`).

## Where to look for more context

- `index.html`, `forgot-password.html`, `script.js`, `supabase-config.js` — primary behavior and integration.
- `database-setup.sql`, `CREATE_TABLES_FIRST.md`, `INSERT_USER_TO_TABLE.md` — DB schema and sample data.

If anything here is unclear or you want me to expand examples (routing, adding centralized supabase init, or adding a small test harness), tell me which area to expand and I’ll update this file.
