/**
 * ═══════════════════════════════════════════════════
 *  घरायेसी Smart Chatbot
 *  Auto-syncs with site-config.json on every session
 *  Responds in Nepali & English based on visitor input
 * ═══════════════════════════════════════════════════
 *
 *  SETUP:
 *  1. Get a free Gemini API key → https://aistudio.google.com/
 *  2. Replace YOUR_GEMINI_API_KEY_HERE below with your key
 *  3. Restrict your key to your domain in Google Cloud Console
 *  4. Add this line before </body> in your index.html:
 *       <script src="chatbot.js"></script>
 */

(function () {

  /* ── YOUR GEMINI API KEY ── */
  const GEMINI_API_KEY = 'AIzaSyAvaREJVhNPObkzrtRO49_j59FRioNcEz4';
  const GEMINI_MODEL   = 'gemini-2.0-flash-lite';
  const CONFIG_URL     = 'site-config.json';

  /* ── CONVERSATION MEMORY ── */
  let conversationHistory = [];
  let siteConfig = null;
  let isOpen = false;
  let isTyping = false;

  /* ══════════════════════════════════════
     INJECT STYLES
  ══════════════════════════════════════ */
  const style = document.createElement('style');
  style.textContent = `
    /* ── Keyframes ── */
    @keyframes cbSlideUp   { from { opacity:0; transform:translateY(24px) scale(.97) } to { opacity:1; transform:translateY(0) scale(1) } }
    @keyframes cbFadeIn    { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
    @keyframes cbPulseRing { 0%,100% { box-shadow: 0 0 0 0 rgba(46,125,69,.5) } 60% { box-shadow: 0 0 0 14px rgba(46,125,69,0) } }
    @keyframes cbDot       { 0%,80%,100% { transform:scale(0.6); opacity:.4 } 40% { transform:scale(1); opacity:1 } }
    @keyframes cbMsgIn     { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
    @keyframes cbShimmer   { 0% { background-position:200% center } 100% { background-position:-200% center } }

    /* ── FAB Button ── */
    #cb-fab {
      position: fixed;
      bottom: 90px;
      left: 20px;
      z-index: 9000;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2e7d45, #1a5c2e);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 24px rgba(46,125,69,.5);
      animation: cbPulseRing 2.8s ease-in-out infinite;
      transition: transform .2s, box-shadow .2s;
    }
    #cb-fab:hover { transform: scale(1.1); box-shadow: 0 10px 32px rgba(46,125,69,.6) }
    #cb-fab:active { transform: scale(.94) }
    #cb-fab svg { width:26px; height:26px; fill:#fff }
    #cb-fab .cb-notif {
      position: absolute;
      top: -2px; right: -2px;
      width: 14px; height: 14px;
      background: #fbbf24;
      border-radius: 50%;
      border: 2px solid #fff;
      display: none;
    }
    #cb-fab.has-notif .cb-notif { display: block }
    @media(min-width:768px){
      #cb-fab { bottom: 30px; left: 30px; width:62px; height:62px }
    }

    /* ── Chat Panel ── */
    #cb-panel {
      position: fixed;
      bottom: 160px;
      left: 20px;
      z-index: 8999;
      width: calc(100vw - 40px);
      max-width: 390px;
      height: 540px;
      max-height: calc(100vh - 180px);
      background: #fdf6ec;
      border-radius: 24px;
      box-shadow: 0 24px 80px rgba(59,42,26,.22), 0 4px 24px rgba(59,42,26,.12);
      display: none;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid rgba(46,125,69,.12);
      animation: cbSlideUp .4s cubic-bezier(.34,1.56,.64,1);
    }
    #cb-panel.open { display: flex }
    @media(min-width:768px){
      #cb-panel { bottom: 106px; left: 30px; width: 390px; height: 560px }
    }

    /* ── Header ── */
    #cb-header {
      background: linear-gradient(135deg, #1a5c2e 0%, #2e7d45 60%, #246038 100%);
      padding: 16px 18px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
    }
    #cb-header::before {
      content:'';
      position:absolute;inset:0;
      background: radial-gradient(circle at 90% 20%, rgba(251,191,36,.15), transparent 60%);
      pointer-events:none;
    }
    #cb-header-avatar {
      width: 42px; height: 42px;
      border-radius: 13px;
      object-fit: contain;
      background: rgba(255,255,255,.18);
      border: 2px solid rgba(255,255,255,.25);
      padding: 4px;
      flex-shrink: 0;
    }
    #cb-header-info { flex:1 }
    #cb-header-name {
      font-family: 'Playfair Display', serif;
      font-weight: 700;
      font-size: .97rem;
      color: #fff;
      line-height: 1.2;
    }
    #cb-header-status {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 3px;
    }
    .cb-status-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 5px #4ade80;
      animation: cbPulseRing 2s infinite;
      flex-shrink: 0;
    }
    #cb-header-status span {
      font-size: .68rem;
      color: rgba(255,255,255,.72);
      letter-spacing: .04em;
    }
    #cb-close {
      background: rgba(255,255,255,.15);
      border: none;
      color: #fff;
      width: 32px; height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1rem;
      display: flex; align-items:center; justify-content:center;
      transition: background .15s;
      flex-shrink: 0;
      z-index: 1;
    }
    #cb-close:hover { background: rgba(255,255,255,.28) }

    /* ── Welcome Banner ── */
    #cb-welcome {
      background: linear-gradient(135deg, rgba(46,125,69,.08), rgba(46,125,69,.04));
      border-bottom: 1px solid rgba(46,125,69,.1);
      padding: 12px 16px;
      flex-shrink: 0;
    }
    #cb-welcome p {
      font-size: .76rem;
      color: #3b2a1a;
      line-height: 1.55;
      opacity: .7;
    }
    .cb-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    .cb-chip {
      background: #fff;
      border: 1.5px solid rgba(46,125,69,.2);
      color: #2e7d45;
      font-size: .7rem;
      font-weight: 600;
      padding: 5px 11px;
      border-radius: 999px;
      cursor: pointer;
      transition: all .15s;
      white-space: nowrap;
    }
    .cb-chip:hover { background: #2e7d45; color:#fff; border-color:#2e7d45 }

    /* ── Messages ── */
    #cb-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }
    #cb-messages::-webkit-scrollbar { width: 4px }
    #cb-messages::-webkit-scrollbar-thumb { background: rgba(59,42,26,.12); border-radius:4px }

    .cb-msg { display:flex; gap:8px; animation: cbMsgIn .3s ease }
    .cb-msg.user { flex-direction: row-reverse }

    .cb-bubble {
      max-width: 80%;
      padding: 11px 14px;
      border-radius: 18px;
      font-size: .84rem;
      line-height: 1.6;
      word-break: break-word;
    }
    .cb-msg.bot .cb-bubble {
      background: #fff;
      color: #3b2a1a;
      border-radius: 4px 18px 18px 18px;
      box-shadow: 0 2px 10px rgba(59,42,26,.08);
      border: 1px solid rgba(59,42,26,.06);
    }
    .cb-msg.user .cb-bubble {
      background: linear-gradient(135deg, #2e7d45, #246038);
      color: #fff;
      border-radius: 18px 4px 18px 18px;
      box-shadow: 0 2px 12px rgba(46,125,69,.3);
    }
    .cb-avatar {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg,#2e7d45,#1a5c2e);
      display: flex; align-items:center; justify-content:center;
      font-size: .8rem;
      flex-shrink: 0;
      margin-top: 2px;
    }

    /* ── Typing Indicator ── */
    #cb-typing {
      display: none;
      align-items: center;
      gap: 8px;
      padding: 0 14px 4px;
      animation: cbFadeIn .3s ease;
    }
    #cb-typing.show { display: flex }
    .cb-typing-dots {
      background: #fff;
      border: 1px solid rgba(59,42,26,.06);
      border-radius: 4px 18px 18px 18px;
      padding: 12px 16px;
      display: flex;
      gap: 5px;
      align-items: center;
      box-shadow: 0 2px 10px rgba(59,42,26,.08);
    }
    .cb-typing-dots span {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #2e7d45;
      opacity: .4;
      animation: cbDot 1.2s infinite;
    }
    .cb-typing-dots span:nth-child(2) { animation-delay: .2s }
    .cb-typing-dots span:nth-child(3) { animation-delay: .4s }

    /* ── Input Area ── */
    #cb-input-area {
      padding: 12px 14px 16px;
      background: #fff;
      border-top: 1px solid rgba(59,42,26,.07);
      display: flex;
      gap: 8px;
      align-items: flex-end;
      flex-shrink: 0;
    }
    #cb-input {
      flex: 1;
      border: 1.5px solid rgba(59,42,26,.12);
      border-radius: 14px;
      padding: 10px 14px;
      font-size: .86rem;
      font-family: 'DM Sans', sans-serif;
      color: #3b2a1a;
      background: #fdf6ec;
      resize: none;
      outline: none;
      max-height: 100px;
      min-height: 42px;
      line-height: 1.5;
      transition: border-color .2s, box-shadow .2s;
    }
    #cb-input:focus {
      border-color: #2e7d45;
      box-shadow: 0 0 0 3px rgba(46,125,69,.1);
      background: #fff;
    }
    #cb-input::placeholder { color: rgba(59,42,26,.3) }
    #cb-send {
      width: 42px; height: 42px;
      background: linear-gradient(135deg, #2e7d45, #246038);
      border: none;
      border-radius: 13px;
      cursor: pointer;
      display: flex; align-items:center; justify-content:center;
      flex-shrink: 0;
      transition: transform .15s, box-shadow .15s;
      box-shadow: 0 3px 12px rgba(46,125,69,.3);
    }
    #cb-send:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(46,125,69,.4) }
    #cb-send:active { transform:scale(.93) }
    #cb-send svg { width:18px; height:18px; fill:#fff }
    #cb-send:disabled { opacity:.45; cursor:not-allowed; transform:none }

    /* ── Loading shimmer for config fetch ── */
    .cb-loading-msg {
      font-size: .78rem;
      color: rgba(59,42,26,.4);
      text-align: center;
      padding: 8px;
      background: linear-gradient(90deg, rgba(59,42,26,.05) 25%, rgba(59,42,26,.1) 50%, rgba(59,42,26,.05) 75%);
      background-size: 200% auto;
      animation: cbShimmer 1.5s linear infinite;
      border-radius: 8px;
    }
  `;
  document.head.appendChild(style);

  /* ══════════════════════════════════════
     BUILD HTML
  ══════════════════════════════════════ */
  const fab = document.createElement('button');
  fab.id = 'cb-fab';
  fab.setAttribute('aria-label', 'Open chat assistant');
  fab.innerHTML = `
    <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 10H6v-2h12v2zm0-3H6V7h12v2z"/></svg>
    <span class="cb-notif"></span>
  `;

  const panel = document.createElement('div');
  panel.id = 'cb-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Chat with Gharayesi Assistant');
  panel.innerHTML = `
    <div id="cb-header">
      <img id="cb-header-avatar" src="https://raw.githubusercontent.com/SaraswotikhelSmartSewa/gharayesi/refs/heads/main/IMG_20260411_223531.png" alt="Gharayesi"/>
      <div id="cb-header-info">
        <div id="cb-header-name">घरायेसी Assistant 🌿</div>
        <div id="cb-header-status">
          <span class="cb-status-dot"></span>
          <span>Online • सेवामा तत्पर</span>
        </div>
      </div>
      <button id="cb-close" aria-label="Close chat">✕</button>
    </div>

    <div id="cb-welcome">
      <p>नमस्ते! म घरायेसीको AI सहायक हुँ। तरकारीको मूल्य, डेलिभरी, अर्डर — जे सोध्नुस् पनि! 😊<br>
      <em style="font-size:.72rem;opacity:.65">Hello! Ask me anything about our shop, prices, or ordering.</em></p>
      <div class="cb-chips">
        <span class="cb-chip" onclick="cbAsk('आजको तरकारीको मूल्य के छ?')">🥬 आजको मूल्य</span>
        <span class="cb-chip" onclick="cbAsk('How do I place an order?')">📦 How to order</span>
        <span class="cb-chip" onclick="cbAsk('डेलिभरी कति पर्छ?')">🛵 डेलिभरी</span>
        <span class="cb-chip" onclick="cbAsk('Opening hours?')">🕐 Timings</span>
      </div>
    </div>

    <div id="cb-messages"></div>
    <div id="cb-typing">
      <div class="cb-avatar">🌿</div>
      <div class="cb-typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>

    <div id="cb-input-area">
      <textarea id="cb-input" placeholder="सन्देश लेख्नुस् • Type your message…" rows="1"></textarea>
      <button id="cb-send" disabled aria-label="Send message">
        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      </button>
    </div>
  `;

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  /* ══════════════════════════════════════
     FETCH SITE CONFIG & BUILD SYSTEM PROMPT
  ══════════════════════════════════════ */
  async function fetchSiteConfig() {
    try {
      const res = await fetch(CONFIG_URL + '?v=' + Date.now());
      if (!res.ok) throw new Error('Config fetch failed');
      return await res.json();
    } catch (e) {
      console.warn('[Chatbot] Could not fetch site-config.json:', e);
      return null;
    }
  }

  function buildSystemPrompt(cfg) {
    if (!cfg) {
      return `You are a helpful assistant for Gharayesi, a fresh vegetable shop in Saraswotikhel, Bhaktapur, Nepal. Answer in the same language the user writes in — Nepali (Devanagari) or English. Be warm, friendly, and helpful.`;
    }

    const { meta, categories, hours, whyUs, sections, ticker } = cfg;

    // Build product list
    let productLines = '';
    (categories || []).forEach(cat => {
      productLines += `\n  Category: ${cat.name}\n`;
      (cat.items || []).forEach(item => {
        const prices = (item.prices || []).map(p => `${p.price} per ${p.unit}`).join(', ');
        productLines += `    - ${item.name}: Rs. ${prices}\n`;
      });
    });

    // Build hours
    let hoursLines = (hours || []).map(h => `    ${h.day}: ${h.time}${h.closed ? ' (call to confirm)' : ''}`).join('\n');

    // Build why us
    let whyLines = (whyUs || []).map(w => `    • ${w.title}: ${w.desc}`).join('\n');

    return `You are the official AI assistant for "${meta.shopName}", a fresh vegetable and daily essentials shop located at ${meta.address}, Nepal.

YOUR PERSONALITY:
- Warm, friendly, and helpful — like a knowledgeable neighbor
- Witty but never over-the-top; professional yet approachable
- Bilingual: respond in Nepali (Devanagari script) if the user writes in Nepali, respond in English if they write in English. If mixed, match the dominant language.
- Never robotic. Use natural, conversational language.
- Use relevant emojis sparingly to add warmth 🌿

SHOP INFORMATION:
- Name: ${meta.shopName}
- Tagline: ${meta.tagline}
- Location: ${meta.address}
- Phone / WhatsApp: ${meta.phone} (${meta.whatsappNumber})
- WhatsApp ordering is the primary ordering method

HOW TO ORDER:
- Customers message on WhatsApp: ${meta.whatsappNumber}
- Send: Order items, Name, Phone Number, Address
- Delivery charge: Rs. 25 only
- Delivery area: Saraswotikhel and nearby areas

OPENING HOURS:
${hoursLines}

TODAY'S PRODUCTS & PRICES:
${productLines}

WHY CHOOSE US:
${whyLines}

IMPORTANT RULES:
- Always refer customers to WhatsApp (${meta.whatsappNumber}) for placing orders
- If asked about a product not in the list, say prices change daily and suggest checking WhatsApp for latest info
- Never make up prices — only quote prices from the product list above
- If someone wants to order, guide them to WhatsApp with the number
- Keep responses concise — this is a chat, not an essay
- You do NOT handle payments or logistics directly — always redirect to WhatsApp for that`;
  }

  /* ══════════════════════════════════════
     INITIALIZE
  ══════════════════════════════════════ */
  let systemPrompt = '';

  async function init() {
    showLoading(true);
    siteConfig = await fetchSiteConfig();
    systemPrompt = buildSystemPrompt(siteConfig);
    showLoading(false);
    document.getElementById('cb-send').disabled = false;

    // Update logo from config if available
    if (siteConfig?.meta?.logoUrl) {
      document.getElementById('cb-header-avatar').src = siteConfig.meta.logoUrl;
    }

    // Welcome message
    addMessage('bot', `नमस्ते! म ${siteConfig?.meta?.shopNameHighlight || 'घरायेसी'}को AI सहायक हुँ 🌿\n\nआजको ताजा तरकारीको मूल्य, डेलिभरी, अर्डर — जे सोध्नुस् पनि सहयोग गर्न तयार छु!\n\n_Hello! I'm your Gharayesi assistant. Ask me about prices, delivery, or how to order!_`);
  }

  function showLoading(show) {
    const msgs = document.getElementById('cb-messages');
    let loader = document.getElementById('cb-loader');
    if (show) {
      if (!loader) {
        loader = document.createElement('div');
        loader.id = 'cb-loader';
        loader.className = 'cb-loading-msg';
        loader.textContent = 'Loading shop info…';
        msgs.appendChild(loader);
      }
    } else {
      if (loader) loader.remove();
    }
  }

  /* ══════════════════════════════════════
     SEND MESSAGE TO GEMINI
  ══════════════════════════════════════ */
  async function sendToGemini(userText) {
    conversationHistory.push({ role: 'user', parts: [{ text: userText }] });

    const body = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: conversationHistory,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 512,
        topP: 0.9,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ]
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error?.message || 'API error');
    }

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'माफ गर्नुस्, अहिले जवाफ दिन सकिएन। Sorry, unable to respond right now.';
    conversationHistory.push({ role: 'model', parts: [{ text: reply }] });
    return reply;
  }

  /* ══════════════════════════════════════
     UI HELPERS
  ══════════════════════════════════════ */
  function addMessage(role, text) {
    const msgs = document.getElementById('cb-messages');
    const div = document.createElement('div');
    div.className = `cb-msg ${role}`;

    // Simple markdown: bold, italic, newlines
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');

    if (role === 'bot') {
      div.innerHTML = `<div class="cb-avatar">🌿</div><div class="cb-bubble">${formatted}</div>`;
    } else {
      div.innerHTML = `<div class="cb-bubble">${formatted}</div>`;
    }

    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function setTyping(show) {
    isTyping = show;
    document.getElementById('cb-typing').classList.toggle('show', show);
    document.getElementById('cb-send').disabled = show;
    const msgs = document.getElementById('cb-messages');
    msgs.scrollTop = msgs.scrollHeight;
  }

  /* ══════════════════════════════════════
     HANDLE SEND
  ══════════════════════════════════════ */
  async function handleSend() {
    const input = document.getElementById('cb-input');
    const text = input.value.trim();
    if (!text || isTyping) return;

    input.value = '';
    input.style.height = 'auto';
    addMessage('user', text);
    setTyping(true);

    // Hide welcome chips after first message
    const welcome = document.getElementById('cb-welcome');
    if (welcome) welcome.style.display = 'none';

    try {
      const reply = await sendToGemini(text);
      setTyping(false);
      addMessage('bot', reply);
    } catch (e) {
      setTyping(false);
      addMessage('bot', `⚠️ माफ गर्नुस्, एउटा समस्या आयो। कृपया फेरि प्रयास गर्नुस्।\n\n_Sorry, something went wrong. Please try again._\n\n_Error: ${e.message}_`);
    }
  }

  // Expose chip handler globally
  window.cbAsk = function (text) {
    document.getElementById('cb-input').value = text;
    handleSend();
  };

  /* ══════════════════════════════════════
     TOGGLE PANEL
  ══════════════════════════════════════ */
  function openPanel() {
    isOpen = true;
    panel.classList.add('open');
    fab.classList.remove('has-notif');
    document.getElementById('cb-input').focus();
    if (!systemPrompt) init();
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('open');
  }

  fab.addEventListener('click', () => isOpen ? closePanel() : openPanel());
  document.getElementById('cb-close').addEventListener('click', closePanel);

  /* ── Send on button click ── */
  document.getElementById('cb-send').addEventListener('click', handleSend);

  /* ── Send on Enter (Shift+Enter for newline) ── */
  document.getElementById('cb-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  /* ── Auto-resize textarea ── */
  document.getElementById('cb-input').addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

  /* ── Show notif dot after 8 seconds if panel not opened ── */
  setTimeout(() => {
    if (!isOpen) fab.classList.add('has-notif');
  }, 8000);

  /* ── Prefetch config in background so it's ready when panel opens ── */
  fetchSiteConfig().then(cfg => {
    siteConfig = cfg;
    systemPrompt = buildSystemPrompt(cfg);
    if (cfg?.meta?.logoUrl) {
      document.getElementById('cb-header-avatar').src = cfg.meta.logoUrl;
    }
    document.getElementById('cb-send').disabled = false;
  });

})();