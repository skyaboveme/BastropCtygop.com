/**
 * Cloudflare Pages Function — RSS Proxy
 * Fetches RSS feeds server-side to avoid CORS restrictions.
 * Endpoint: /api/rss-proxy?url=<encoded-rss-url>
 *
 * Only allows fetching from a whitelist of trusted RSS feed domains.
 */

const ALLOWED_DOMAINS = [
  'feeds.foxnews.com',
  'www.dailywire.com',
  'www.theblaze.com',
  'feeds.feedburner.com',
  'www.theepochtimes.com',
  'www.newsmax.com',
  'thefederalist.com',
  'texasscorecard.com',
  'babylonbee.com',
  'thetexan.news',
  'notthebee.com',
];

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const feedUrl = url.searchParams.get('url');

  // CORS headers for the response
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (!feedUrl) {
    return new Response(JSON.stringify({ error: 'Missing ?url= parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Validate against whitelist
  let parsedFeedUrl;
  try {
    parsedFeedUrl = new URL(feedUrl);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (!ALLOWED_DOMAINS.includes(parsedFeedUrl.hostname)) {
    return new Response(JSON.stringify({ error: 'Domain not allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const feedResponse = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'BastropCountyGOP-RSS/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      cf: {
        // Cache at the edge for 10 minutes to reduce origin hits
        cacheTtl: 600,
        cacheEverything: true,
      },
    });

    if (!feedResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream returned ${feedResponse.status}` }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const xml = await feedResponse.text();

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=600, s-maxage=600',
        ...corsHeaders,
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch feed', detail: err.message }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
