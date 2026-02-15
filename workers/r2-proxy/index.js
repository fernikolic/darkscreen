export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);

    if (!key) {
      return new Response("Not found", { status: 404 });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }

    const object = await env.BUCKET.get(key);
    if (!object) {
      return new Response("Not found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "public, max-age=86400, s-maxage=604800");

    // Ensure correct content-type for known file types
    if (key.endsWith(".webm")) {
      headers.set("content-type", "video/webm");
    } else if (key.endsWith(".png")) {
      headers.set("content-type", "image/png");
    } else if (key.endsWith(".jpg") || key.endsWith(".jpeg")) {
      headers.set("content-type", "image/jpeg");
    }

    // CORS
    const origin = request.headers.get("origin") || "";
    if (
      origin.includes("darkscreens.xyz") ||
      origin.includes("localhost")
    ) {
      headers.set("access-control-allow-origin", origin);
    }

    if (request.method === "HEAD") {
      return new Response(null, { status: 200, headers });
    }

    return new Response(object.body, { headers });
  },
};

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, HEAD, OPTIONS",
    "access-control-allow-headers": "*",
    "access-control-max-age": "86400",
  };
}
