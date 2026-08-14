/**
 * Phase 4 end-to-end acceptance flow.
 * Run: node scripts/e2e-phase4-flow.js
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
  console.log('\n=== CivicSetu Phase 4 E2E Flow ===\n');

  // 1. Citizen A register/login
  let res = await api('POST', '/auth/register', {
    body: {
      name: 'Citizen A',
      email: 'citizenA@test.com',
      password: 'Test@123',
    },
  });

  if (res.status === 409) {
    res = await api('POST', '/auth/login', {
      body: { email: 'citizenA@test.com', password: 'Test@123' },
    });
    log('Citizen A login', res.status === 200, res.data.message);
  } else {
    log('Citizen A register', res.status === 201, res.data.message);
  }
  const citizenAToken = res.data.data.token;

  // Citizen B for denial test
  res = await api('POST', '/auth/register', {
    body: {
      name: 'Citizen B',
      email: 'citizenB@test.com',
      password: 'Test@123',
    },
  });
  if (res.status === 409) {
    res = await api('POST', '/auth/login', {
      body: { email: 'citizenB@test.com', password: 'Test@123' },
    });
  }
  const citizenBToken = res.data.data.token;
  log('Citizen B ready', !!citizenBToken);

  // Get ward
  res = await api('GET', '/wards');
  const ward = res.data.data?.wards?.[0];
  log('Fetch ward', res.status === 200 && !!ward, ward?.code ?? 'no ward found');

  if (!ward) {
    console.log('\n❌ Cannot continue without a ward. Run seed:reference or create a ward.');
    process.exit(1);
  }

  // 2. Create grievance
  res = await api('POST', '/grievances', {
    token: citizenAToken,
    body: {
      title: 'Broken streetlight',
      description: 'Streetlight has been non-functional for five days near Ward junction.',
      category: 'streetlight',
      wardId: ward._id,
      latitude: 20.2961,
      longitude: 85.8245,
      location: 'Ward junction main road',
      images: [{ url: 'https://example.com/streetlight.jpg', mimeType: 'image/jpeg' }],
    },
  });
  const grievanceId = res.data.data?.grievance?._id;
  log(
    'Citizen A creates grievance',
    res.status === 201 && res.data.data?.grievance?.status === 'submitted',
    `ticket ${res.data.data?.grievance?.ticketId ?? 'n/a'}`
  );

  // 3. Admin login & sees grievance
  res = await api('POST', '/auth/login', {
    body: { email: 'admin@test.com', password: 'Test@123' },
  });
  const adminToken = res.data.data.token;
  log('Admin login', res.status === 200);

  res = await api('GET', '/admin/grievances', { token: adminToken });
  const adminSees = res.data.data?.items?.some((g) => g._id === grievanceId);
  log('Admin sees grievance', res.status === 200 && adminSees);

  // 4. Admin assigns officer
  res = await api('GET', '/admin/officers', { token: adminToken });
  const officer = res.data.data?.officers?.find((o) => o.email === 'officer@test.com');
  log('Fetch officer', !!officer, officer?.email);

  res = await api('PATCH', `/admin/grievances/${grievanceId}/assign`, {
    token: adminToken,
    body: { officerId: officer._id },
  });
  log(
    'Admin assigns officer',
    res.status === 200 && res.data.data?.grievance?.status === 'assigned',
    res.data.data?.grievance?.assignedOfficerId?.name ?? ''
  );

  // 5. Officer login & sees grievance
  res = await api('POST', '/auth/login', {
    body: { email: 'officer@test.com', password: 'Test@123' },
  });
  const officerToken = res.data.data.token;
  log('Officer login', res.status === 200);

  res = await api('GET', '/officer/grievances?scope=assigned', { token: officerToken });
  const officerSees = res.data.data?.items?.some((g) => g._id === grievanceId);
  log('Officer sees assigned grievance', res.status === 200 && officerSees);

  // 6. Officer → IN_PROGRESS
  res = await api('PATCH', `/officer/grievances/${grievanceId}/status`, {
    token: officerToken,
    body: { status: 'in_progress', note: 'Electrician team dispatched' },
  });
  log(
    'Officer → IN_PROGRESS',
    res.status === 200 && res.data.data?.grievance?.status === 'in_progress'
  );

  // 7. Officer → RESOLVED
  res = await api('POST', `/officer/grievances/${grievanceId}/resolve`, {
    token: officerToken,
    body: { resolutionSummary: 'Streetlight repaired and tested successfully.' },
  });
  log(
    'Officer → RESOLVED',
    res.status === 200 && res.data.data?.grievance?.status === 'resolved'
  );

  // 8. Upload resolution evidence
  res = await api('POST', `/officer/grievances/${grievanceId}/evidence`, {
    token: officerToken,
    body: {
      url: 'https://example.com/streetlight-fixed.jpg',
      mimeType: 'image/jpeg',
      evidenceType: 'after',
      caption: 'Streetlight working after repair',
    },
  });
  log('Upload resolution evidence', res.status === 201);

  // 9. Citizen A sees updated status & evidence
  res = await api('GET', `/grievances/${grievanceId}`, { token: citizenAToken });
  log(
    'Citizen A sees RESOLVED status',
    res.status === 200 && res.data.data?.grievance?.status === 'resolved'
  );

  res = await api('GET', `/grievances/${grievanceId}/evidence`, { token: citizenAToken });
  log(
    'Citizen A sees evidence',
    res.status === 200 && res.data.data?.evidence?.length >= 1,
    `${res.data.data?.evidence?.length ?? 0} file(s)`
  );

  // 10. Citizen A closes complaint
  res = await api('PATCH', `/grievances/${grievanceId}/close`, { token: citizenAToken });
  log(
    'Citizen A closes complaint',
    res.status === 200 && res.data.data?.grievance?.status === 'closed'
  );

  // 11. Citizen B denied access
  res = await api('GET', `/grievances/${grievanceId}`, { token: citizenBToken });
  log('Citizen B access denied', res.status === 403, `HTTP ${res.status}`);

  // Summary
  console.log('\n=== Summary ===');
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log(`${passed}/${results.length} steps passed`);

  if (failed.length > 0) {
    console.log('\nFailed steps:');
    failed.forEach((f) => console.log(`  ❌ ${f.step}${f.detail ? `: ${f.detail}` : ''}`));
    process.exit(1);
  }

  console.log('\n🎉 Phase 4 DONE — complete flow verified.\n');
}

main().catch((err) => {
  console.error('E2E script error:', err.message);
  process.exit(1);
});
