/**
 * ═══════════════════════════════════════════════════
 *  घरायेसी Chatbot — Cloudflare Worker Proxy
 *  Keeps your Groq API key completely hidden
 * ═══════════════════════════════════════════════════
 *
 *  SETUP IN CLOUDFLARE:
 *  1. Paste this entire file into your Worker editor
 *  2. Click Deploy
 *  3. Go to Settings → Variables → add two secrets:
 *       GROQ_API_KEY  →  your Groq API key (gsk_xxx...)
 *       AUTH_TOKEN    →  any password you choose (e.g. gharayesi2083)
 *  4. Note your Worker URL (e.g. https://gharayesi-chat.yourname.workers.dev)
 *  5. Paste that URL into chatbot.js as WORKER_URL
 */

export default {
  async fetch(request, env) {

    /* ── Allow CORS from your GitHub Pages domain ── */
    const ALLOWED_ORIGIN = 'https://saraswotikhelsmartSewa.github.io';

    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    };

    /* ── Handle preflight OPTIONS request ── */
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    /* ── Only allow POST ── */
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    /* ── Verify auth token ── */
    const authToken = request.headers.get('X-Auth-Token');
    if (!authToken || authToken !== env.AUTH_TOKEN) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    /* ── Parse incoming request body ── */
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    /* ── Forward to Groq API ── */
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: body.messages,
          temperature: 0.8,
          max_tokens: 512,
          top_p: 0.9,
        })
      });

      const data = await groqRes.json();

      if (!groqRes.ok) {
        return new Response(JSON.stringify({ error: data?.error?.message || 'Groq API error' }), {
          status: groqRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (e) {
      return new Response(JSON.stringify({ error: 'Worker error: ' + e.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
