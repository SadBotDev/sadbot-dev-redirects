// Redirects the short links of team.sadbot.dev and records every visit in Analytics Engine.
// Nothing personal is stored: the path, the utm_source of the link and the visitor's country.

const TARGETS = {
  "/donate": (env) => env.DONATE_TARGET,
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const target = TARGETS[path]?.(env);

    if (target === undefined) {
      return new Response("Not found", { status: 404 });
    }
    if (!URL.canParse(target)) {
      console.error(`no valid target is configured for ${path}`);
      return new Response("The link is not configured", { status: 503 });
    }

    env.VISITS.writeDataPoint({
      indexes: [path],
      blobs: [path, url.searchParams.get("utm_source") ?? "", request.cf?.country ?? ""],
    });
    return Response.redirect(target, 302);
  },
};
