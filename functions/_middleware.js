// Security-hardened middleware — 29 Mar 2026
// Auth + security headers + CORS restriction + pages.dev blocking

const ALLOWED_ORIGINS = [
  'https://liftshop.jeansyai.com',
  'https://da.liftshop.jeansyai.com',
  'https://jobs.liftshop.jeansyai.com',
  'https://leads.liftshop.jeansyai.com',
  'https://photos.liftshop.jeansyai.com',
  'https://register.liftshop.jeansyai.com',
  'https://pipeline.liftshop.jeansyai.com',
  'https://properties.liftshop.jeansyai.com',
  'https://builders.liftshop.jeansyai.com',
  'https://intel.liftshop.jeansyai.com'
];

const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https://liftshop.com.au data: blob:; connect-src 'self' https://*.liftshop.jeansyai.com https://drive.google.com https://drive.usercontent.google.com; frame-src https://drive.google.com https://drive.usercontent.google.com",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-DNS-Prefetch-Control': 'off'
};

const PAGES_DEV_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Lift Shop</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',system-ui,sans-serif;background:#0e1e3a;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px}.card{max-width:460px}.logo{margin-bottom:32px}.logo img{height:36px;width:auto;opacity:.9}h1{font-size:1.6rem;font-weight:700;color:#fff;margin-bottom:12px}p{color:rgba(255,255,255,.55);font-size:.95rem;line-height:1.6}.dot{color:#b8952a}</style></head><body><div class="card"><div class="logo"><img src="https://liftshop.com.au/wp-content/uploads/2025/05/Lift-Shop-Logo-white-with-TM-v3-300x60.png" alt="Lift Shop"></div><h1>Whoops<span class="dot">.</span></h1><p>Things are changing around here.<br>Don't worry — soon you'll be given the new details.</p></div></body></html>`;

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const host = request.headers.get('host') || url.hostname;

  // Block *.pages.dev
  if (host.endsWith('.pages.dev')) {
    return new Response(PAGES_DEV_HTML, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }

  const origin = request.headers.get('Origin');
  const path = url.pathname;

  // Handle CORS preflight
  if (request.method === 'OPTIONS' && origin) {
    if (ALLOWED_ORIGINS.includes(origin)) {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
          ...SECURITY_HEADERS
        }
      });
    }
    return new Response(null, { status: 403 });
  }

  // Static assets — serve with security headers, no auth needed
  if (path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff2?|json|pdf)$/) && !path.startsWith('/api/')) {
    const response = await next();
    return addSecurityHeaders(response, origin);
  }

  // Non-API routes (HTML pages) — require auth, redirect to hub login if not authenticated
  if (!path.startsWith('/api/')) {
    const sessionToken = getCookie(request, 'ls_session');
    if (!sessionToken) {
      return Response.redirect(`https://liftshop.jeansyai.com/?next=${encodeURIComponent(url.href)}`, 302);
    }
    const authDb = env.AUTH_DB;
    if (!authDb) {
      return new Response('Auth not configured', { status: 500 });
    }
    const session = await authDb.prepare(
      "SELECT s.email, u.name, u.is_admin FROM sessions s LEFT JOIN users u ON s.email=u.email WHERE s.token=? AND s.expires_at > datetime('now')"
    ).bind(sessionToken).first().catch(() => null);

    if (!session) {
      return Response.redirect(`https://liftshop.jeansyai.com/?next=${encodeURIComponent(url.href)}`, 302);
    }

    context.data = context.data || {};
    context.data.userEmail = session.email;
    context.data.userName = session.name;
    context.data.isAdmin = session.is_admin === 1 || session.email === 'mjeanes@liftshop.com.au';

    const response = await next();
    return addSecurityHeaders(response, origin);
  }

  // API routes — require auth
  // Allow auth endpoints through
  if (path.startsWith('/api/auth/')) {
    context.data = context.data || {};
    context.data.ipAddress = request.headers.get('CF-Connecting-IP') || 'unknown';
    const response = await next();
    return addSecurityHeaders(response, origin);
  }

  // Validate session for all other API routes
  const cookies = parseCookies(request);
  const sessionToken = cookies['ls_session'] || cookies['da_session'];

  if (!sessionToken) {
    return jsonResponse({ error: 'Not authenticated' }, 401, origin);
  }

  const authDb2 = env.AUTH_DB;
  if (!authDb2) {
    return jsonResponse({ error: 'Auth not configured' }, 500, origin);
  }
  const session = await authDb2.prepare(
    "SELECT s.email, s.expires_at, u.name, u.is_admin FROM sessions s LEFT JOIN users u ON s.email=u.email WHERE s.token=? AND s.expires_at > datetime('now')"
  ).bind(sessionToken).first().catch(() => null);

  if (!session) {
    return jsonResponse({ error: 'Session expired. Please log in again.' }, 401, origin);
  }

  context.data = context.data || {};
  context.data.userEmail = session.email;
  context.data.userName = session.name;
  context.data.isAdmin = session.is_admin === 1 || session.email === 'mjeanes@liftshop.com.au';
  context.data.ipAddress = request.headers.get('CF-Connecting-IP') || 'unknown';
  context.data.userAgent = request.headers.get('User-Agent') || 'unknown';

  const response = await next();
  return addSecurityHeaders(response, origin);
}

function addSecurityHeaders(response, origin) {
  const newResponse = new Response(response.body, response);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    newResponse.headers.set(key, value);
  }
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    newResponse.headers.set('Access-Control-Allow-Origin', origin);
    newResponse.headers.set('Access-Control-Allow-Credentials', 'true');
  } else {
    newResponse.headers.delete('Access-Control-Allow-Origin');
  }
  newResponse.headers.delete('Server');
  return newResponse;
}

function parseCookies(request) {
  const cookieHeader = request.headers.get('Cookie') || '';
  return Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k.trim(), v.join('=')];
    })
  );
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
}

function jsonResponse(data, status, origin) {
  const headers = { 'Content-Type': 'application/json', ...SECURITY_HEADERS };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  return new Response(JSON.stringify(data), { status, headers });
}
