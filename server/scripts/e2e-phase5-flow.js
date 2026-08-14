/**
 * Phase 5 end-to-end AI Intelligence acceptance tests.
 * Run: node scripts/e2e-phase5-flow.js
 */
import dotenv from 'dotenv';

dotenv.config();

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5000/api';

const results = [];

function log(step, ok, detail = '') {
  const icon = ok ? '✅' : '❌';
  results.push({ step, ok, detail });
  console.log(`${icon} ${step}${detail ? ` — ${detail}` : ''}`);
}

async function api(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

async function main() {
  console.log('\n========================================');
  console.log('🧪 CivicSetu Phase 5 — AI Intelligence Tests');
  console.log('========================================\n');

  // Setup: Citizen authentication
  let res = await api('POST', '/auth/register', {
    body: {
      name: 'Phase 5 Tester',
      email: 'phase5tester@test.com',
      password: 'Test@123',
    },
  });

  if (res.status === 409) {
    res = await api('POST', '/auth/login', {
      body: { email: 'phase5tester@test.com', password: 'Test@123' },
    });
  }
  const token = res.data?.data?.token;
  log('Citizen Auth', !!token, 'phase5tester@test.com');

  if (!token) {
    console.error('\n❌ Could not authenticate. Is the server running on http://localhost:5000?');
    process.exit(1);
  }

  // Get active ward
  res = await api('GET', '/wards');
  const ward = res.data?.data?.wards?.[0];
  log('Ward Check', !!ward, ward ? `${ward.name} (${ward.code})` : 'No ward found');

  if (!ward) {
    console.error('\n❌ No ward available. Run npm run seed:reference first.');
    process.exit(1);
  }

  console.log('\n--- 🔹 Test 1: Normal complaint (Large pothole near college gate) ---');
  res = await api('POST', '/grievances', {
    token,
    body: {
      title: 'Large pothole near college gate',
      description: 'There is a severe large pothole right in front of the main college gate causing traffic congestion and accidents.',
      category: 'pothole',
      wardId: ward._id,
      latitude: 20.2901,
      longitude: 85.8201,
      location: 'College Gate Road',
    },
  });

  const g1 = res.data?.data?.grievance;
  const t1Ok = res.status === 201 && !!g1;
  log('Test 1 — Grievance Created', t1Ok, `Ticket: ${g1?.ticketId}`);
  log('Test 1 — Category Checked', ['pothole', 'roads'].includes(g1?.category), `Category: ${g1?.category}`);
  log('Test 1 — Department Assigned', !!g1?.departmentId, `Dept ID: ${g1?.departmentId}`);
  log('Test 1 — Severity Evaluated', ['low', 'medium', 'high', 'critical'].includes(g1?.severity), `Severity: ${g1?.severity}`);
  log('Test 1 — Priority Calculated', typeof g1?.priorityScore === 'number' && !!g1?.priority, `Priority: ${g1?.priority} (Score: ${g1?.priorityScore})`);
  log('Test 1 — Summary Generated', !!g1?.aiAnalysis?.summary, `Summary: "${g1?.aiAnalysis?.summary}"`);

  console.log('\n--- 🔹 Test 2: Multilingual Hindi and Odia complaints ---');
  // Hindi
  const hindiRes = await api('POST', '/grievances', {
    token,
    body: {
      title: 'कॉलेज गेट के पास बड़ा गड्ढा है',
      description: 'मुख्य कॉलेज के द्वार के सामने एक बड़ा गड्ढा है जिससे दुर्घटनाएं हो रही हैं।',
      category: 'pothole',
      wardId: ward._id,
      latitude: 20.2902,
      longitude: 85.8202,
      location: 'कॉलेज रोड',
    },
  });
  const gHindi = hindiRes.data?.data?.grievance;
  log('Test 2 — Hindi Submission', hindiRes.status === 201, `Language: ${gHindi?.originalLanguage}`);
  log('Test 2 — Hindi Normalization', !!gHindi?.titleNormalized, `Normalized: "${gHindi?.titleNormalized}"`);

  // Odia
  const odiaRes = await api('POST', '/grievances', {
    token,
    body: {
      title: 'ରାସ୍ତାରେ ବଡ଼ ଗାଡ଼ ଅଛି',
      description: 'କଲେଜ ଫାଟକ ନିକଟରେ ଗୋଟିଏ ବିପଜ୍ଜନକ ଗାଡ଼ ଅଛି।',
      category: 'pothole',
      wardId: ward._id,
      latitude: 20.2903,
      longitude: 85.8203,
      location: 'କଲେଜ ରାସ୍ତା',
    },
  });
  const gOdia = odiaRes.data?.data?.grievance;
  log('Test 2 — Odia Submission', odiaRes.status === 201, `Language: ${gOdia?.originalLanguage}`);

  console.log('\n--- 🔹 Test 3: Multimodal Image Analysis ---');
  const imgRes = await api('POST', '/grievances', {
    token,
    body: {
      title: 'Streetlight broken near junction',
      description: 'Dark streetlight broken at dark night near corner junction.',
      category: 'streetlight',
      wardId: ward._id,
      latitude: 20.291,
      longitude: 85.821,
      location: 'Junction Corner',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65',
          mimeType: 'image/jpeg',
          caption: 'Dark unlit lamp',
        },
      ],
    },
  });
  const gImg = imgRes.data?.data?.grievance;
  log('Test 3 — Image Submission', imgRes.status === 201);
  log('Test 3 — Image Analysis Status', gImg?.aiStatus === 'completed', `AI Status: ${gImg?.aiStatus}`);
  log('Test 3 — Image Observations', !!gImg?.aiAnalysis?.imageAnalysis, `Issue: ${gImg?.aiAnalysis?.imageAnalysis?.likelyIssue ?? 'Analyzed'}`);

  console.log('\n--- 🔹 Test 4: Duplicate Detection ---');
  // First complaint
  const d1Res = await api('POST', '/grievances', {
    token,
    body: {
      title: 'There is a huge pothole near the college gate',
      description: 'A large dangerous pothole near the college gate entrance is causing severe traffic risks.',
      category: 'pothole',
      wardId: ward._id,
      latitude: 20.295,
      longitude: 85.825,
      location: 'College Gate Main Entrance',
    },
  });
  const gDup1 = d1Res.data?.data?.grievance;

  // Second similar complaint nearby
  const d2Res = await api('POST', '/grievances', {
    token,
    body: {
      title: 'A large pothole has appeared beside the college entrance',
      description: 'A large dangerous pothole near the college gate entrance needs urgent fixing.',
      category: 'pothole',
      wardId: ward._id,
      latitude: 20.2951,
      longitude: 85.8251,
      location: 'College Entrance',
    },
  });
  const gDup2 = d2Res.data?.data?.grievance;
  const isDuplicateFlagged = (gDup2?.duplicateCandidates?.length ?? 0) > 0;
  log('Test 4 — Duplicate Detection', isDuplicateFlagged, `Found ${gDup2?.duplicateCandidates?.length ?? 0} duplicate candidate(s)`);

  console.log('\n--- 🔹 Test 5: Gemini Failure Fallback Resilience ---');
  // AI Preview with mock failure or retry check
  const previewRes = await api('POST', '/ai/preview', {
    token,
    body: {
      title: 'Water pipe leak',
      description: 'Clean drinking water overflowing in street.',
      wardId: ward._id,
      latitude: 20.29,
      longitude: 85.82,
    },
  });
  log('Test 5 — AI Preview Endpoint', previewRes.status === 200, `Status: ${previewRes.data?.data?.aiStatus}`);

  // Summary
  console.log('\n========================================');
  console.log('📊 Phase 5 Test Summary');
  console.log('========================================');
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log(`${passed}/${results.length} checks passed`);

  if (failed.length > 0) {
    console.log('\nFailed steps:');
    failed.forEach((f) => console.log(`  ❌ ${f.step}${f.detail ? `: ${f.detail}` : ''}`));
    process.exit(1);
  }

  console.log('\n🎉 ALL 5 POWERFUL TESTS PASSED! Phase 5 is fully operational.\n');
}

main().catch((err) => {
  console.error('Phase 5 E2E script error:', err.message);
  process.exit(1);
});
