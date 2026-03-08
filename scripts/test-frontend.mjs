/**
 * Frontend smoke test: fetch key pages and check for expected content.
 * Run: node scripts/test-frontend.mjs
 * Requires: web app reachable (e.g. docker-compose up, then http://localhost:8080)
 */
const BASE = process.env.BASE_URL || 'http://localhost:8080';

const results = { passed: 0, failed: 0 };

function ok(name, cond, detail = '') {
  if (cond) {
    results.passed++;
    console.log(`  ✓ ${name}`);
  } else {
    results.failed++;
    console.log(`  ✗ ${name}` + (detail ? ` - ${detail}` : ''));
  }
}

async function fetchPage(path) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const res = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  return { status: res.status, text, url: res.url };
}

async function main() {
  console.log('\n--- QBMS Frontend Smoke Tests ---');
  console.log(`Base: ${BASE}\n`);

  // Home
  try {
    const r = await fetchPage('/');
    ok('GET /', r.status === 200 && (r.text.includes('QBMS') || r.text.includes('Question Bank')), `status ${r.status}`);
  } catch (e) {
    ok('GET /', false, e.message);
  }

  // Login
  try {
    const r = await fetchPage('/login');
    ok('GET /login', r.status === 200 && (r.text.includes('Log in') || r.text.includes('Sign in') || r.text.includes('email')), `status ${r.status}`);
  } catch (e) {
    ok('GET /login', false, e.message);
  }

  // Register
  try {
    const r = await fetchPage('/register');
    ok('GET /register', r.status === 200 && (r.text.includes('Register') || r.text.includes('Create')), `status ${r.status}`);
  } catch (e) {
    ok('GET /register', false, e.message);
  }

  // Dashboard (client may render login redirect - HTML may be shell with QBMS or Loading)
  try {
    const r = await fetchPage('/dashboard');
    const okContent =
      r.text.includes('Dashboard') ||
      r.text.includes('Log in') ||
      r.text.includes('Sign in') ||
      r.text.includes('QBMS') ||
      r.text.includes('Loading') ||
      r.text.includes('__next');
    ok('GET /dashboard', r.status === 200 && okContent, `status ${r.status}, final ${r.url}`);
  } catch (e) {
    ok('GET /dashboard', false, e.message);
  }

  console.log('\n--- Summary ---');
  console.log(`Passed: ${results.passed}, Failed: ${results.failed}`);
  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
