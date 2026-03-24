// Middleware for liftwatch-dashboard (Job Watch)
// Validates ls_session cookie — unauthenticated → redirect to hub login

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  // Block *.pages.dev — serve placeholder
  const host = request.headers.get('host') || url.hostname;
  if (host.endsWith('.pages.dev')) {
    return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lift Shop</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',system-ui,sans-serif;background:#0e1e3a;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px}
    .card{max-width:460px}
    .logo{margin-bottom:32px}
    .logo img{height:36px;width:auto;opacity:.9}
    h1{font-size:1.6rem;font-weight:700;color:#fff;margin-bottom:12px}
    p{color:rgba(255,255,255,.55);font-size:.95rem;line-height:1.6}
    .dot{color:#b8952a}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo"><img src="https://liftshop.com.au/wp-content/uploads/2025/05/Lift-Shop-Logo-white-with-TM-v3-300x60.png" alt="Lift Shop"></div>
    <h1>Whoops<span class="dot">.</span></h1>
    <p>Things are changing around here.<br>Don't worry — soon you\'ll be given the new details.</p>
  </div>
</body>
</html>`, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }

  const path = url.pathname;

  // Allow static assets (including PDFs)
  if (path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff2?|json|pdf)$/) && !path.startsWith('/api/')) {
    return next();
  }

  // Allow /api/auth/* through without auth check (the endpoints themselves validate the session)
  if (path.startsWith('/api/auth/')) {
    return next();
  }

  const cookies = parseCookies(request);
  const sessionToken = cookies['ls_session'];

  if (!sessionToken) {
    return Response.redirect(`https://liftshop.jeansyai.com/?next=${encodeURIComponent(url.href)}`, 302);
  }

  const session = await env.AUTH_DB.prepare(
    "SELECT s.email, u.name FROM sessions s LEFT JOIN users u ON s.email=u.email WHERE s.token=? AND s.expires_at > datetime('now')"
  ).bind(sessionToken).first().catch(() => null);

  if (!session) {
    return Response.redirect(`https://liftshop.jeansyai.com/?next=${encodeURIComponent(url.href)}`, 302);
  }

  context.data = context.data || {};
  context.data.userEmail = session.email;
  context.data.userName = session.name;

  return next();
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
