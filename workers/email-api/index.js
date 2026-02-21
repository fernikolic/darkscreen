import PostalMime from "postal-mime";

const TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days

// ─── Email handler (inbound) ────────────────────────────────────────

async function emailHandler(message, env) {
  const rawEmail = await new Response(message.raw).arrayBuffer();
  const parsed = await PostalMime.parse(rawEmail);

  const ts = Date.now();
  const id = ts.toString(36) + Math.random().toString(36).slice(2, 10);
  const key = `email:${ts}:${id}`;

  const entry = {
    id,
    from: parsed.from?.address || message.from,
    fromName: parsed.from?.name || "",
    to: parsed.to?.map((t) => t.address) || [message.to],
    subject: parsed.subject || "(no subject)",
    text: parsed.text || "",
    html: parsed.html || "",
    date: new Date(ts).toISOString(),
    read: false,
    attachments: (parsed.attachments || []).map((a) => ({
      filename: a.filename,
      mimeType: a.mimeType,
      size: a.content?.byteLength || 0,
    })),
  };

  await env.INBOX.put(key, JSON.stringify(entry), {
    expirationTtl: TTL_SECONDS,
  });

  // Index for O(1) lookups by ID
  await env.INBOX.put(`idx:${id}`, key, {
    expirationTtl: TTL_SECONDS,
  });
}

// ─── REST API (fetch handler) ───────────────────────────────────────

async function fetchHandler(request, env) {
  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // Auth check
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token || token !== env.EMAIL_API_TOKEN) {
    return json({ error: "Unauthorized" }, 401);
  }

  const url = new URL(request.url);
  const path = url.pathname;

  // Route: GET /inbox
  if (request.method === "GET" && path === "/inbox") {
    return handleListInbox(env, url);
  }

  // Route: GET /inbox/:id
  const getMatch = path.match(/^\/inbox\/([a-z0-9]+)$/);
  if (request.method === "GET" && getMatch) {
    return handleGetEmail(env, getMatch[1]);
  }

  // Route: DELETE /inbox/:id
  const delMatch = path.match(/^\/inbox\/([a-z0-9]+)$/);
  if (request.method === "DELETE" && delMatch) {
    return handleDeleteEmail(env, delMatch[1]);
  }

  // Route: POST /send
  if (request.method === "POST" && path === "/send") {
    return handleSendEmail(request, env);
  }

  return json({ error: "Not found" }, 404);
}

// ─── Handlers ───────────────────────────────────────────────────────

async function handleListInbox(env, url) {
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
  const cursor = url.searchParams.get("cursor") || undefined;

  const list = await env.INBOX.list({
    prefix: "email:",
    limit,
    cursor,
  });

  const emails = await Promise.all(
    list.keys.map(async (k) => {
      const raw = await env.INBOX.get(k.name);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      return {
        id: entry.id,
        from: entry.from,
        fromName: entry.fromName,
        subject: entry.subject,
        date: entry.date,
        read: entry.read,
      };
    })
  );

  return json({
    emails: emails.filter(Boolean),
    cursor: list.list_complete ? null : list.cursor,
  });
}

async function handleGetEmail(env, id) {
  const fullKey = await env.INBOX.get(`idx:${id}`);
  if (!fullKey) return json({ error: "Not found" }, 404);

  const raw = await env.INBOX.get(fullKey);
  if (!raw) return json({ error: "Not found" }, 404);

  const entry = JSON.parse(raw);

  // Mark as read
  if (!entry.read) {
    entry.read = true;
    await env.INBOX.put(fullKey, JSON.stringify(entry), {
      expirationTtl: TTL_SECONDS,
    });
  }

  return json(entry);
}

async function handleDeleteEmail(env, id) {
  const idxKey = `idx:${id}`;
  const fullKey = await env.INBOX.get(idxKey);
  if (!fullKey) return json({ error: "Not found" }, 404);

  await env.INBOX.delete(fullKey);
  await env.INBOX.delete(idxKey);

  return json({ ok: true });
}

async function handleSendEmail(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { to, subject, text, html } = body;
  if (!to || !subject || (!text && !html)) {
    return json({ error: "Missing required fields: to, subject, text or html" }, 400);
  }

  const toList = Array.isArray(to)
    ? to.map((addr) => ({ email: addr }))
    : [{ email: to }];

  const payload = {
    sender: {
      name: env.SENDER_NAME || "Minjae",
      email: env.SENDER_EMAIL || "minjae@darkscreens.xyz",
    },
    to: toList,
    subject,
  };
  if (html) payload.htmlContent = html;
  if (text) payload.textContent = text;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": env.BREVO_API_KEY,
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    return json({ error: `Brevo error ${res.status}: ${errText}` }, 502);
  }

  const result = await res.json();
  return json({ ok: true, messageId: result.messageId });
}

// ─── Helpers ────────────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

// ─── Export ─────────────────────────────────────────────────────────

export default {
  email: emailHandler,
  fetch: fetchHandler,
};
