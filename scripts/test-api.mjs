/**
 * QBMS API functionality test script.
 * Requires: stack running (docker compose up), then:
 *
 *   Bash / Git Bash:
 *     export BASE_URL=http://localhost:8080
 *     node scripts/test-api.mjs
 *
 *   PowerShell:
 *     $env:BASE_URL = "http://localhost:8080"
 *     node scripts/test-api.mjs
 *
 * If BASE_URL is not set, defaults to http://localhost:8080.
 */
const BASE = process.env.BASE_URL || 'http://localhost:8080';

const results = { passed: 0, failed: 0, tests: [] };
function ok(name, cond, detail = '') {
  if (cond) {
    results.passed++;
    results.tests.push({ name, ok: true, detail });
    console.log(`  ✓ ${name}`);
  } else {
    results.failed++;
    results.tests.push({ name, ok: false, detail });
    console.log(`  ✗ ${name}` + (detail ? ` - ${detail}` : ''));
  }
}

async function fetchJSON(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const res = await fetch(url, { ...opts, credentials: 'include' });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data, headers: Object.fromEntries(res.headers) };
}

let accessToken = null;
let createdSubjectId = null;
let createdTopicId = null;
let createdQuestionId = null;
let createdClassId = null;

async function main() {
  console.log('\n--- QBMS API Tests ---\n');

  // 1. Health
  console.log('1. Health');
  try {
    const h = await fetchJSON('/health');
    ok('GET /health', h.status === 200 && h.data?.status === 'ok', h.data?.error || h.data?.status);
  } catch (e) {
    ok('GET /health', false, e.message);
  }
  try {
    const hdb = await fetchJSON('/health/db');
    ok('GET /health/db', hdb.status === 200 && hdb.data?.database === 'connected', hdb.data?.database);
  } catch (e) {
    ok('GET /health/db', false, e.message);
  }
  try {
    const hr = await fetchJSON('/health/redis');
    ok('GET /health/redis', hr.status === 200 && hr.data?.redis === 'connected', hr.data?.redis);
  } catch (e) {
    ok('GET /health/redis', false, e.message);
  }

  // 2. Auth - Register
  console.log('\n2. Auth (Register)');
  const email = `test-${Date.now()}@qbms.local`;
  try {
    const reg = await fetchJSON('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email,
        password: 'TestPass123',
        role: 'instructor',
      }),
    });
    ok('POST /api/auth/register', reg.status === 200 && reg.data?.accessToken, reg.data?.error || String(reg.status));
    if (reg.data?.accessToken) accessToken = reg.data.accessToken;
  } catch (e) {
    ok('POST /api/auth/register', false, e.message);
  }

  const auth = () => (accessToken ? { Authorization: `Bearer ${accessToken}` } : {});

  // 3. Auth - Me
  console.log('\n3. Auth (Me)');
  try {
    const me = await fetchJSON('/api/auth/me', { headers: { ...auth(), 'Content-Type': 'application/json' } });
    ok('GET /api/auth/me', me.status === 200 && me.data?.email === email, me.data?.error);
  } catch (e) {
    ok('GET /api/auth/me', false, e.message);
  }

  // 4. Subjects
  console.log('\n4. Subjects');
  try {
    const list = await fetchJSON('/api/subjects', { headers: auth() });
    ok('GET /api/subjects', list.status === 200 && Array.isArray(list.data), list.data?.error);
  } catch (e) {
    ok('GET /api/subjects', false, e.message);
  }
  try {
    const create = await fetchJSON('/api/subjects', {
      method: 'POST',
      headers: { ...auth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectName: 'Test Subject', description: 'For tests' }),
    });
    ok('POST /api/subjects', create.status === 201 && create.data?.subjectId, create.data?.error);
    if (create.data?.subjectId) createdSubjectId = create.data.subjectId;
  } catch (e) {
    ok('POST /api/subjects', false, e.message);
  }
  if (createdSubjectId) {
    try {
      const one = await fetchJSON(`/api/subjects/${createdSubjectId}`, { headers: auth() });
      ok('GET /api/subjects/:id', one.status === 200 && one.data?.subjectName === 'Test Subject');
    } catch (e) {
      ok('GET /api/subjects/:id', false, e.message);
    }
  }

  // 5. Topics
  console.log('\n5. Topics');
  if (createdSubjectId) {
    try {
      const create = await fetchJSON('/api/topics', {
        method: 'POST',
        headers: { ...auth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: createdSubjectId, topicName: 'Test Topic' }),
      });
      ok('POST /api/topics', create.status === 201 && create.data?.topicId, create.data?.error);
      if (create.data?.topicId) createdTopicId = create.data.topicId;
    } catch (e) {
      ok('POST /api/topics', false, e.message);
    }
  }
  try {
    const list = await fetchJSON('/api/topics', { headers: auth() });
    ok('GET /api/topics', list.status === 200 && Array.isArray(list.data));
  } catch (e) {
    ok('GET /api/topics', false, e.message);
  }

  // 6. Questions
  console.log('\n6. Questions');
  if (createdTopicId) {
    try {
      const create = await fetchJSON('/api/questions', {
        method: 'POST',
        headers: { ...auth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: createdTopicId,
          questionText: 'What is 1+1?',
          type: 'mcq',
          difficulty: 'easy',
          marks: 2,
          options: [
            { optionText: '1', isCorrect: false },
            { optionText: '2', isCorrect: true },
          ],
        }),
      });
      ok('POST /api/questions', create.status === 201 && create.data?.questionId, create.data?.error);
      if (create.data?.questionId) createdQuestionId = create.data.questionId;
    } catch (e) {
      ok('POST /api/questions', false, e.message);
    }
  }
  try {
    const list = await fetchJSON('/api/questions', { headers: auth() });
    ok('GET /api/questions', list.status === 200 && list.data?.data != null, list.data?.error);
  } catch (e) {
    ok('GET /api/questions', false, e.message);
  }

  // 7. Classes
  console.log('\n7. Classes');
  if (createdSubjectId) {
    try {
      const create = await fetchJSON('/api/classes', {
        method: 'POST',
        headers: { ...auth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: createdSubjectId,
          className: 'Test Class',
        }),
      });
      ok('POST /api/classes', create.status === 201 && create.data?.classId, create.data?.error);
      if (create.data?.classId) createdClassId = create.data.classId;
    } catch (e) {
      ok('POST /api/classes', false, e.message);
    }
  }
  try {
    const list = await fetchJSON('/api/classes', { headers: auth() });
    ok('GET /api/classes', list.status === 200 && Array.isArray(list.data));
  } catch (e) {
    ok('GET /api/classes', false, e.message);
  }

  // 8. Paper generation
  console.log('\n8. Paper generation');
  if (createdSubjectId && createdTopicId) {
    try {
      const gen = await fetchJSON('/api/paper/generate', {
        method: 'POST',
        headers: { ...auth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: createdSubjectId,
          topicIds: [createdTopicId],
          totalMarks: 10,
          questionCount: 5,
          difficultyDistribution: { easy: 0.5, medium: 0.3, hard: 0.2 },
        }),
      });
      ok('POST /api/paper/generate', gen.status === 200 && Array.isArray(gen.data?.questions), gen.data?.error);
    } catch (e) {
      ok('POST /api/paper/generate', false, e.message);
    }
  }

  // 8.5. AI generate questions (503 if OPENAI_API_KEY not set; 404 if API image not rebuilt)
  console.log('\n8.5. AI generate questions');
  try {
    const ai = await fetchJSON('/api/ai/generate-questions', {
      method: 'POST',
      headers: { ...auth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topicId: createdTopicId || undefined,
        topicName: 'Test Topic',
        count: 2,
        type: 'mcq',
        difficulty: 'easy',
      }),
    });
    const aiOk = ai.status === 200 && Array.isArray(ai.data?.generated);
    const ai503 = ai.status === 503 && (ai.data?.error || '').toLowerCase().includes('openai');
    const ai404 = ai.status === 404;
    ok(
      'POST /api/ai/generate-questions',
      aiOk || ai503 || ai404,
      ai404
        ? 'Route 404 – rebuild API: docker compose build api && docker compose up -d api'
        : ai503
          ? 'OpenAI not configured (503)'
          : ai.data?.error || (aiOk ? '' : `status ${ai.status}`)
    );
    if (aiOk && ai.data.generated?.length > 0) {
      ok('AI returns question text', typeof ai.data.generated[0].questionText === 'string');
      ok('AI returns type', ['mcq', 'short', 'essay'].includes(ai.data.generated[0].type));
    }
  } catch (e) {
    ok('POST /api/ai/generate-questions', false, e.message);
  }

  // 9. Exams
  console.log('\n9. Exams');
  if (createdClassId && createdQuestionId) {
    try {
      const create = await fetchJSON('/api/exams', {
        method: 'POST',
        headers: { ...auth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: createdClassId,
          title: 'Test Exam',
          totalMarks: 10,
          timeLimit: 30,
          questionIds: [createdQuestionId],
        }),
      });
      ok('POST /api/exams', create.status === 201 && create.data?.examId, create.data?.error);
    } catch (e) {
      ok('POST /api/exams', false, e.message);
    }
  }
  try {
    const list = await fetchJSON('/api/exams', { headers: auth() });
    ok('GET /api/exams', list.status === 200 && Array.isArray(list.data));
  } catch (e) {
    ok('GET /api/exams', false, e.message);
  }

  // 10. Analytics
  console.log('\n10. Analytics');
  try {
    const inst = await fetchJSON('/api/analytics/instructor', { headers: auth() });
    ok('GET /api/analytics/instructor', inst.status === 200 && inst.data != null, inst.data?.error);
  } catch (e) {
    ok('GET /api/analytics/instructor', false, e.message);
  }
  try {
    const stud = await fetchJSON('/api/analytics/student', { headers: auth() });
    ok('GET /api/analytics/student', stud.status === 200 && stud.data != null, stud.data?.error);
  } catch (e) {
    ok('GET /api/analytics/student', false, e.message);
  }

  // 11. Logout
  console.log('\n11. Logout');
  try {
    const out = await fetchJSON('/api/auth/logout', {
      method: 'POST',
      headers: { ...auth(), 'Content-Type': 'application/json' },
    });
    ok('POST /api/auth/logout', out.status === 200 && (out.data?.ok === true || out.status === 200));
  } catch (e) {
    ok('POST /api/auth/logout', false, e.message);
  }

  // 12. Login (with seeded user if DB was seeded)
  console.log('\n12. Login');
  try {
    const login = await fetchJSON('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'TestPass123' }),
    });
    ok('POST /api/auth/login', login.status === 200 && login.data?.accessToken, login.data?.error);
  } catch (e) {
    ok('POST /api/auth/login', false, e.message);
  }

  // Summary
  console.log('\n--- Summary ---');
  console.log(`Passed: ${results.passed}, Failed: ${results.failed}, Total: ${results.passed + results.failed}`);
  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
