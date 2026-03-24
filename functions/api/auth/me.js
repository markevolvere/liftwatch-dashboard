// GET /api/auth/me — validate ls_session for liftwatch-dashboard

export async function onRequestGet(context) {
  const { request, env } = context;
  const cookies = parseCookies(request);
  const token = cookies['ls_session'];

  if (!token) return json({ error: 'Not authenticated' }, 401);

  const session = await env.AUTH_DB.prepare(
    "SELECT s.email, u.name, u.is_admin FROM sessions s LEFT JOIN users u ON s.email=u.email WHERE s.token=? AND s.expires_at > datetime('now')"
  ).bind(token).first().catch(() => null);

  if (!session) return json({ error: 'Session expired' }, 401);

  return json({ email: session.email, name: session.name, is_admin: session.is_admin || 0 });
}

function parseCookies(request) {
  const h = request.headers.get('Cookie') || '';
  return Object.fromEntries(h.split(';').map(c => { const [k,...v]=c.trim().split('='); return [k.trim(),v.join('=')]; }));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
