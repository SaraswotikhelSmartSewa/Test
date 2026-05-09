/**
 * ═══════════════════════════════════════════════════
 *  घरायेसी Smart Chatbot — Forest Market Edition
 *  Powered by Groq via Cloudflare Worker
 * ═══════════════════════════════════════════════════
 */

(function () {

  const WORKER_URL = 'https://long-tree-136b-gharayesichatbot.smartsaraswotikhel.workers.dev';
  const AUTH_TOKEN = 'gharayesi2083';
  const CONFIG_URL = 'site-config.json';

  let conversationHistory = [];
  let siteConfig = null;
  let isOpen = false;
  let isTyping = false;
  let selectedLang = null;
  let systemPrompt = '';

  /* ══════════════════════════════════════
     STYLES — Forest Market Dark Luxury
  ══════════════════════════════════════ */
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

    @keyframes cbOrbit    { 0%{transform:rotate(0deg) translateX(28px) rotate(0deg)}100%{transform:rotate(360deg) translateX(28px) rotate(-360deg)} }
    @keyframes cbOrbit2   { 0%{transform:rotate(180deg) translateX(20px) rotate(-180deg)}100%{transform:rotate(540deg) translateX(20px) rotate(-540deg)} }
    @keyframes cbOrbit3   { 0%{transform:rotate(90deg) translateX(24px) rotate(-90deg)}100%{transform:rotate(450deg) translateX(24px) rotate(-450deg)} }
    @keyframes cbGlow     { 0%,100%{box-shadow:0 0 18px rgba(134,196,127,.5),0 0 40px rgba(46,125,69,.3)}50%{box-shadow:0 0 28px rgba(134,196,127,.8),0 0 60px rgba(46,125,69,.5)} }
    @keyframes cbPanelIn  { from{opacity:0;transform:translateY(32px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes cbMsgSlide { from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)} }
    @keyframes cbMsgSlideR{ from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)} }
    @keyframes cbLeaf     { 0%,100%{transform:rotate(-8deg) scale(1)}50%{transform:rotate(8deg) scale(1.1)} }
    @keyframes cbLeaf2    { 0%,100%{transform:rotate(6deg) scale(1)}50%{transform:rotate(-6deg) scale(1.08)} }
    @keyframes cbFloat    { 0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)} }
    @keyframes cbShimmer  { 0%{background-position:200% center}100%{background-position:-200% center} }
    @keyframes cbSpark    { 0%{opacity:0;transform:scale(0) rotate(0deg)}50%{opacity:1;transform:scale(1.2) rotate(180deg)}100%{opacity:0;transform:scale(0) rotate(360deg)} }
    @keyframes cbDot      { 0%,80%,100%{transform:scale(0.5) translateY(0);opacity:.3}40%{transform:scale(1) translateY(-4px);opacity:1} }
    @keyframes cbChipIn   { from{opacity:0;transform:translateY(8px) scale(.94)}to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes cbHeaderWave { 0%,100%{background-position:0% 50%}50%{background-position:100% 50%} }
    @keyframes cbRipple   { 0%{transform:scale(1);opacity:.6}100%{transform:scale(2.8);opacity:0} }
    @keyframes cbNotifBounce { 0%,100%{transform:scale(1)}30%{transform:scale(1.4)}60%{transform:scale(.9)} }

    /* ── FAB ── */
    #cb-fab {
      position: fixed;
      bottom: 88px;
      left: 20px;
      z-index: 9000;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, #4caf72, #1a5c2e);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: cbGlow 3s ease-in-out infinite;
      transition: transform .25s cubic-bezier(.34,1.56,.64,1);
      outline: none;
    }
    #cb-fab::before,#cb-fab::after {
      content: '';
      position: absolute;
      border-radius: 50%;
      background: rgba(76,175,114,.25);
      animation: cbRipple 2.4s ease-out infinite;
    }
    #cb-fab::before { width: 100%; height: 100%; animation-delay: 0s; }
    #cb-fab::after  { width: 100%; height: 100%; animation-delay: 1.2s; }
    #cb-fab:hover   { transform: scale(1.12) rotate(-8deg); }
    #cb-fab:active  { transform: scale(.92); }
    #cb-fab-icon    { position:relative;z-index:2;font-size:1.5rem;line-height:1;animation:cbFloat 3s ease-in-out infinite; }
    .cb-orbit-dot   { position:absolute;width:7px;height:7px;border-radius:50%;background:#e8c97a;z-index:1; }
    .cb-orbit-dot:nth-child(1){ animation:cbOrbit 4s linear infinite; }
    .cb-orbit-dot:nth-child(2){ animation:cbOrbit2 3.2s linear infinite;background:#86c47f; }
    .cb-orbit-dot:nth-child(3){ animation:cbOrbit3 5s linear infinite;background:#fff;opacity:.6; }
    .cb-notif {
      position:absolute;top:-3px;right:-3px;z-index:3;
      width:16px;height:16px;background:linear-gradient(135deg,#fbbf24,#f59e0b);
      border-radius:50%;border:2px solid #fff;display:none;
      font-size:.58rem;font-weight:700;color:#3b2a1a;
      align-items:center;justify-content:center;
    }
    #cb-fab.has-notif .cb-notif { display:flex;animation:cbNotifBounce .6s ease; }
    @media(min-width:768px){ #cb-fab{bottom:32px;left:32px;width:64px;height:64px} }

    /* ── PANEL ── */
    #cb-panel {
      position: fixed;
      bottom: 162px;
      left: 20px;
      z-index: 8999;
      width: calc(100vw - 40px);
      max-width: 400px;
      height: 570px;
      max-height: calc(100vh - 185px);
      background: #0d1f14;
      border-radius: 28px;
      box-shadow:
        0 32px 96px rgba(0,0,0,.55),
        0 0 0 1px rgba(76,175,114,.15),
        inset 0 1px 0 rgba(255,255,255,.06);
      display: none;
      flex-direction: column;
      overflow: hidden;
      animation: cbPanelIn .5s cubic-bezier(.34,1.56,.64,1);
    }
    #cb-panel.open { display: flex; }
    @media(min-width:768px){ #cb-panel{bottom:110px;left:32px;width:400px;height:590px} }

    /* ── HEADER ── */
    #cb-header {
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
      padding: 0;
      background: linear-gradient(135deg,#0d2b1a,#1a4d2e,#0f3520,#1e5c34);
      background-size: 300% 300%;
      animation: cbHeaderWave 8s ease infinite;
    }
    .cb-header-bg {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }
    .cb-header-bg-leaf {
      position: absolute;
      font-size: 3.5rem;
      opacity: .06;
      line-height: 1;
    }
    .cb-header-bg-leaf:nth-child(1){ top:-8px;right:-6px;animation:cbLeaf 4s ease-in-out infinite; }
    .cb-header-bg-leaf:nth-child(2){ bottom:-10px;left:20px;font-size:2.5rem;animation:cbLeaf2 5s ease-in-out infinite;animation-delay:.8s; }
    .cb-header-bg-leaf:nth-child(3){ top:4px;left:42%;font-size:2rem;opacity:.04;animation:cbLeaf 6s ease-in-out infinite;animation-delay:1.2s; }
    .cb-header-arc {
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 18px;
      background: #0d1f14;
      border-radius: 50% 50% 0 0 / 100% 100% 0 0;
    }
    .cb-header-inner {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 16px 24px;
    }
    #cb-header-avatar {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      object-fit: contain;
      background: rgba(255,255,255,.1);
      border: 1.5px solid rgba(134,196,127,.3);
      padding: 5px;
      flex-shrink: 0;
      box-shadow: 0 4px 16px rgba(0,0,0,.3);
    }
    #cb-header-info { flex: 1; min-width: 0; }
    #cb-header-name {
      font-family: 'Cormorant Garamond', serif;
      font-weight: 700;
      font-size: 1.08rem;
      color: #e8f5e2;
      letter-spacing: .01em;
      line-height: 1.2;
    }
    .cb-header-tag {
      font-family: 'DM Sans', sans-serif;
      font-size: .62rem;
      color: #e8c97a;
      letter-spacing: .12em;
      text-transform: uppercase;
      margin-top: 1px;
    }
    #cb-header-status {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 4px;
    }
    .cb-status-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #4caf72;
      box-shadow: 0 0 6px #4caf72;
      flex-shrink: 0;
      animation: cbGlow 2s ease-in-out infinite;
    }
    .cb-status-text {
      font-size: .66rem;
      color: rgba(232,245,226,.5);
      font-family: 'DM Sans', sans-serif;
      letter-spacing: .03em;
    }
    #cb-close {
      background: rgba(255,255,255,.08);
      border: 1px solid rgba(255,255,255,.1);
      color: rgba(255,255,255,.6);
      width: 30px; height: 30px;
      border-radius: 50%;
      cursor: pointer;
      font-size: .85rem;
      display: flex; align-items: center; justify-content: center;
      transition: all .2s;
      flex-shrink: 0;
      z-index: 2;
      position: relative;
    }
    #cb-close:hover { background: rgba(224,53,53,.25);color:#fff;border-color:rgba(224,53,53,.4); }

    /* ── WELCOME CHIPS AREA ── */
    #cb-welcome {
      flex-shrink: 0;
      padding: 14px 16px 12px;
      border-bottom: 1px solid rgba(255,255,255,.05);
      background: rgba(255,255,255,.02);
    }
    #cb-welcome-text {
      font-size: .73rem;
      color: rgba(200,230,195,.5);
      line-height: 1.55;
      font-family: 'DM Sans', sans-serif;
      margin-bottom: 10px;
    }
    .cb-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .cb-chip {
      background: rgba(76,175,114,.1);
      border: 1px solid rgba(76,175,114,.2);
      color: #86c47f;
      font-size: .68rem;
      font-weight: 500;
      font-family: 'DM Sans', sans-serif;
      padding: 5px 12px;
      border-radius: 999px;
      cursor: pointer;
      transition: all .2s;
      white-space: nowrap;
      animation: cbChipIn .4s cubic-bezier(.34,1.56,.64,1) both;
      letter-spacing: .02em;
    }
    .cb-chip:nth-child(1){animation-delay:.05s}
    .cb-chip:nth-child(2){animation-delay:.1s}
    .cb-chip:nth-child(3){animation-delay:.15s}
    .cb-chip:nth-child(4){animation-delay:.2s}
    .cb-chip:hover {
      background: rgba(76,175,114,.22);
      border-color: rgba(76,175,114,.45);
      color: #a8d8a2;
      transform: translateY(-2px);
      box-shadow: 0 4px 14px rgba(76,175,114,.15);
    }
    .cb-chip:active { transform: scale(.95); }

    /* ── CHAT AREA ── */
    #cb-chat-area { flex:1;display:none;flex-direction:column;overflow:hidden;min-height:0; }
    #cb-chat-area.active { display:flex; }

    /* ── MESSAGES ── */
    #cb-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px 14px 8px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      scroll-behavior: smooth;
      min-height: 0;
    }
    #cb-messages::-webkit-scrollbar { width: 3px; }
    #cb-messages::-webkit-scrollbar-track { background: transparent; }
    #cb-messages::-webkit-scrollbar-thumb { background: rgba(76,175,114,.2); border-radius: 4px; }

    .cb-msg { display:flex;gap:10px;align-items:flex-end; }
    .cb-msg.user { flex-direction:row-reverse; }
    .cb-msg.bot  { animation: cbMsgSlide .35s cubic-bezier(.34,1.56,.64,1); }
    .cb-msg.user { animation: cbMsgSlideR .35s cubic-bezier(.34,1.56,.64,1); }

    .cb-avatar-wrap {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: linear-gradient(135deg,#1a5c2e,#0d3318);
      border: 1.5px solid rgba(76,175,114,.25);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: .82rem;
      box-shadow: 0 2px 10px rgba(0,0,0,.3);
    }

    .cb-bubble {
      max-width: 78%;
      padding: 11px 15px;
      font-size: .83rem;
      line-height: 1.65;
      word-break: break-word;
      font-family: 'DM Sans', sans-serif;
      position: relative;
    }
    .cb-msg.bot .cb-bubble {
      background: rgba(255,255,255,.05);
      color: #d4edd0;
      border-radius: 4px 18px 18px 18px;
      border: 1px solid rgba(76,175,114,.12);
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 20px rgba(0,0,0,.2);
    }
    .cb-msg.bot .cb-bubble::before {
      content: '';
      position: absolute;
      left: 0;
      top: 12px;
      bottom: 12px;
      width: 2px;
      background: linear-gradient(to bottom, #4caf72, transparent);
      border-radius: 0 2px 2px 0;
    }
    .cb-msg.user .cb-bubble {
      background: linear-gradient(135deg,#1e5c34,#0f3520);
      color: #e8f5e2;
      border-radius: 18px 4px 18px 18px;
      border: 1px solid rgba(76,175,114,.2);
      box-shadow: 0 4px 20px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.06);
    }

    .cb-time {
      font-size: .56rem;
      color: rgba(255,255,255,.2);
      font-family: 'DM Sans',sans-serif;
      margin-top: 5px;
      text-align: right;
      letter-spacing: .04em;
    }
    .cb-msg.bot .cb-time { text-align: left; }

    /* ── TYPING ── */
    #cb-typing {
      display: none;
      align-items: flex-end;
      gap: 10px;
      padding: 4px 14px 10px;
    }
    #cb-typing.show { display: flex; animation: cbMsgSlide .3s ease; }
    .cb-typing-bubble {
      background: rgba(255,255,255,.05);
      border: 1px solid rgba(76,175,114,.12);
      border-radius: 4px 18px 18px 18px;
      padding: 12px 18px;
      display: flex;
      gap: 5px;
      align-items: center;
      backdrop-filter: blur(8px);
    }
    .cb-typing-bubble span {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #4caf72;
      display: block;
      animation: cbDot 1.4s ease-in-out infinite;
    }
    .cb-typing-bubble span:nth-child(2){ animation-delay:.18s;background:#86c47f; }
    .cb-typing-bubble span:nth-child(3){ animation-delay:.36s;background:#e8c97a; }

    /* ── INPUT ── */
    #cb-input-area {
      flex-shrink: 0;
      padding: 10px 12px 14px;
      background: rgba(255,255,255,.03);
      border-top: 1px solid rgba(255,255,255,.05);
      display: flex;
      align-items: flex-end;
      gap: 10px;
      backdrop-filter: blur(10px);
    }
    .cb-input-wrap {
      flex: 1;
      position: relative;
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(76,175,114,.15);
      border-radius: 18px;
      transition: border-color .2s, box-shadow .2s, background .2s;
      overflow: hidden;
    }
    .cb-input-wrap:focus-within {
      border-color: rgba(76,175,114,.45);
      background: rgba(255,255,255,.09);
      box-shadow: 0 0 0 3px rgba(76,175,114,.08), 0 4px 20px rgba(0,0,0,.2);
    }
    #cb-input {
      width: 100%;
      background: transparent;
      border: none;
      padding: 11px 14px;
      font-size: .84rem;
      font-family: 'DM Sans', sans-serif;
      color: #d4edd0;
      resize: none;
      outline: none;
      max-height: 100px;
      min-height: 42px;
      line-height: 1.5;
      display: block;
    }
    #cb-input::placeholder { color: rgba(150,200,145,.3); }
    #cb-send {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg,#2e7d45,#1a5c2e);
      border: 1px solid rgba(76,175,114,.25);
      border-radius: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all .2s cubic-bezier(.34,1.56,.64,1);
      box-shadow: 0 4px 16px rgba(46,125,69,.35);
      position: relative;
      overflow: hidden;
    }
    #cb-send::before {
      content:'';
      position:absolute;inset:0;
      background:linear-gradient(135deg,rgba(255,255,255,.15),transparent);
      opacity:0;transition:opacity .2s;
    }
    #cb-send:hover { transform:translateY(-2px) scale(1.05);box-shadow:0 8px 24px rgba(46,125,69,.5); }
    #cb-send:hover::before { opacity:1; }
    #cb-send:active { transform:scale(.93); }
    #cb-send svg { width:17px;height:17px;fill:#e8f5e2;position:relative;z-index:1; }
    #cb-send:disabled { opacity:.3;cursor:not-allowed;transform:none; }

    /* ── LOADING ── */
    .cb-loading-msg {
      font-size:.75rem;color:rgba(134,196,127,.4);text-align:center;padding:10px;
      background:linear-gradient(90deg,rgba(76,175,114,.03) 25%,rgba(76,175,114,.08) 50%,rgba(76,175,114,.03) 75%);
      background-size:200% auto;animation:cbShimmer 1.8s linear infinite;border-radius:10px;
      font-family:'DM Sans',sans-serif;letter-spacing:.04em;
    }

    /* ── DATE SEPARATOR ── */
    .cb-date-sep {
      display:flex;align-items:center;gap:10px;
      font-size:.6rem;color:rgba(255,255,255,.18);
      font-family:'DM Sans',sans-serif;letter-spacing:.1em;text-transform:uppercase;
      margin:4px 0;
    }
    .cb-date-sep::before,.cb-date-sep::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.06);}

    /* ── DECORATIVE BOTTOM DIVIDER ── */
    .cb-panel-bottom-line {
      position:absolute;bottom:0;left:0;right:0;height:2px;
      background:linear-gradient(90deg,transparent,#4caf72,#e8c97a,#4caf72,transparent);
      opacity:.4;
    }
  `;
  document.head.appendChild(style);

  /* ══════════════════════════════════════
     BUILD HTML
  ══════════════════════════════════════ */
  const fab = document.createElement('button');
  fab.id = 'cb-fab';
  fab.setAttribute('aria-label','Chat with Gharayesi');
  fab.innerHTML = `
    <span class="cb-orbit-dot"></span>
    <span class="cb-orbit-dot"></span>
    <span class="cb-orbit-dot"></span>
    <span class="cb-fab-icon">🌿</span>
    <span class="cb-notif">!</span>
  `;

  const panel = document.createElement('div');
  panel.id = 'cb-panel';
  panel.setAttribute('role','dialog');
  panel.innerHTML = `
    <div id="cb-header">
      <div class="cb-header-bg">
        <span class="cb-header-bg-leaf">🍃</span>
        <span class="cb-header-bg-leaf">🌿</span>
        <span class="cb-header-bg-leaf">🍀</span>
      </div>
      <div class="cb-header-inner">
        <img id="cb-header-avatar" src="https://raw.githubusercontent.com/SaraswotikhelSmartSewa/gharayesi/refs/heads/main/IMG_20260411_223531.png" alt="Gharayesi"/>
        <div id="cb-header-info">
          <div id="cb-header-name">घरायेसी Assistant</div>
          <div class="cb-header-tag">Saraswotikhel · Fresh Daily</div>
          <div id="cb-header-status">
            <span class="cb-status-dot"></span>
            <span class="cb-status-text" id="cb-status-text">Online · Ready to help</span>
          </div>
        </div>
        <button id="cb-close" aria-label="Close">✕</button>
      </div>
      <div class="cb-header-arc"></div>
    </div>

    <div id="cb-welcome">
      <p id="cb-welcome-text"></p>
      <div class="cb-chips" id="cb-chips"></div>
    </div>

    <div id="cb-chat-area">
      <div id="cb-messages">
        <div class="cb-date-sep">Today</div>
      </div>
      <div id="cb-typing">
        <div class="cb-avatar-wrap">🌿</div>
        <div class="cb-typing-bubble">
          <span></span><span></span><span></span>
        </div>
      </div>
      <div id="cb-input-area">
        <div class="cb-input-wrap">
          <textarea id="cb-input" placeholder="Ask about prices, delivery, ordering…" rows="1"></textarea>
        </div>
        <button id="cb-send" disabled>
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
    <div class="cb-panel-bottom-line"></div>
  `;

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  /* ══════════════════════════════════════
     INIT LANG CONTENT
  ══════════════════════════════════════ */
  const LANG_CONTENT = {
    EN: {
      welcomeText: "Ask me about today's prices, delivery, or how to order — I'm here to help!",
      placeholder: 'Ask about prices, delivery, ordering…',
      status: 'Online · Ready to help',
      chips: [
        {label:"🥬 Today's prices",  msg:"What are today's fresh vegetable prices?"},
        {label:'🛵 Delivery',        msg:'How much is delivery and where do you deliver?'},
        {label:'📦 How to order',    msg:'How do I place an order?'},
        {label:'🕐 Opening hours',   msg:'What are your opening hours?'},
      ]
    }
  };

  window.cbSelectLang = function(lang) {
    selectedLang = lang;
    const c = LANG_CONTENT['EN'];
    document.getElementById('cb-input').placeholder = c.placeholder;
    document.getElementById('cb-status-text').textContent = c.status;
    document.getElementById('cb-welcome-text').textContent = c.welcomeText;
    document.getElementById('cb-chips').innerHTML = c.chips.map(ch =>
      `<span class="cb-chip" onclick="cbAsk('${ch.msg}')">${ch.label}</span>`
    ).join('');
    document.getElementById('cb-chat-area').classList.add('active');
    if (!systemPrompt) initChat('EN');
    else { document.getElementById('cb-send').disabled = false; sendWelcomeMessage('EN'); }
  };

  function sendWelcomeMessage(lang) {
    addMessage('bot', `Namaste! Welcome to Gharayesi 🌿\n\nDai/Didi, it's lovely to have you here. Whether you want to check today's fresh prices, know about our delivery, or just place a quick order — I'm right here. Ke garnuparcha hajur?`);
  }

  /* ══════════════════════════════════════
     FETCH CONFIG & SYSTEM PROMPT
  ══════════════════════════════════════ */
  async function fetchSiteConfig() {
    try {
      const res = await fetch(CONFIG_URL + '?v=' + Date.now());
      if (!res.ok) throw new Error('fetch failed');
      return await res.json();
    } catch(e) { return null; }
  }

  function buildSystemPrompt(cfg, lang) {
    lang = 'EN';
    if (!cfg) return `You are the warm, polished assistant for Gharayesi, a fresh vegetable shop in Saraswotikhel, Bhaktapur, Nepal. Speak in a natural blend of English and Romanized Nepali — like a friendly educated Nepali shopkeeper. Use words like namaste, hajur, dhanyabad, ekdam, sajilo naturally. Write mostly English with Romanized Nepali sprinkled in. Never use Devanagari script. Be warm, genuine, and professional.`;

    const { meta, categories, hours } = cfg;
    let products = '';
    (categories||[]).forEach(cat => {
      products += `\n${cat.name}:\n`;
      (cat.items||[]).forEach(item => {
        const p = (item.prices||[]).map(x=>`Rs.${x.price} per ${x.unit}`).join(', ');
        products += `  • ${item.name}: ${p}\n`;
      });
    });
    const hrs = (hours||[]).map(h=>`  ${h.day}: ${h.time}${h.closed?' (confirm by call)':''}`).join('\n');

    return `You are the official assistant for "${meta.shopName}", a trusted neighbourhood fresh vegetable and daily essentials shop in Saraswotikhel, Bhaktapur, Nepal.

YOUR VOICE & TONE:
You speak in a natural blend of English and Romanized Nepali — the way a warm, educated Nepali shop owner genuinely talks to a neighbour. Not formal-stiff, not overly casual. Think of a friendly local who is also professional and caring.

Examples of how you naturally speak:
- "Namaste! Great to hear from you, hajur."
- "Aja ko fresh aalu is just Rs. 26 per kg — quite reasonable, right?"
- "Sanchai hunuhunchha? Let me check that for you."
- "Dhanyabad for reaching out! Is there anything else I can help you with?"
- "You can simply WhatsApp us at ${meta.whatsappNumber} — ekdam sajilo cha!"
- "Delivery is only Rs. 25, hajur — right to your doorstep."

RULES FOR YOUR MIXED LANGUAGE STYLE:
- Write mostly in English — warm, flowing, natural sentences
- Sprinkle Romanized Nepali words and short phrases where they feel natural — namaste, hajur, dai, didi, ramro, mitho, sanchai, aja, dhanyabad, ekdam, sajilo, tapailai, hami, ali ali, thik cha, etc.
- NEVER use Devanagari script — Roman letters only
- NEVER mix in Hindi words — only genuine Nepali words in Roman script
- Sound like a real person, not a chatbot reading a script
- Be warm, a little personal, and always genuinely helpful
- Use ONE emoji per reply — only when it feels natural, never forced

SHOP DETAILS:
- Name: ${meta.shopName}
- Location: ${meta.address}
- WhatsApp / Phone: ${meta.whatsappNumber}
- Delivery: Rs. 25 only, within Saraswotikhel and nearby areas

OPENING HOURS:
${hrs}

TODAY'S PRODUCTS & PRICES:
${products}

CONVERSATION GUIDELINES:
- Share prices naturally within your reply — not as a raw dump
- Always guide customers to WhatsApp (${meta.whatsappNumber}) when they want to order
- If a product is not listed, honestly say availability changes daily and invite them to check on WhatsApp
- Never invent prices or details you do not have
- End every reply with a warm follow-up — ask if they need anything else, suggest ordering, or offer to help further
- Keep replies short and easy to read — a chat window is small`;
  }

  /* ══════════════════════════════════════
     INIT CHAT
  ══════════════════════════════════════ */
  async function initChat(lang) {
    showLoading(true);
    siteConfig = await fetchSiteConfig();
    systemPrompt = buildSystemPrompt(siteConfig, lang);
    showLoading(false);
    if (siteConfig?.meta?.logoUrl) document.getElementById('cb-header-avatar').src = siteConfig.meta.logoUrl;
    document.getElementById('cb-send').disabled = false;
    sendWelcomeMessage(lang);
  }

  function showLoading(show) {
    const msgs = document.getElementById('cb-messages');
    let l = document.getElementById('cb-loader');
    if (show && !l) {
      l = document.createElement('div');
      l.id='cb-loader';l.className='cb-loading-msg';
      l.textContent='Connecting to Gharayesi…';
      msgs.appendChild(l);
    } else if (!show && l) l.remove();
  }

  /* ══════════════════════════════════════
     SEND MESSAGE
  ══════════════════════════════════════ */
  async function sendMessage(userText) {
    conversationHistory.push({role:'user',content:userText});
    const messages = [{role:'system',content:systemPrompt},...conversationHistory];
    const res = await fetch(WORKER_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json','X-Auth-Token':AUTH_TOKEN},
      body:JSON.stringify({messages})
    });
    if (!res.ok){const e=await res.json();throw new Error(e?.error||'Worker error');}
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || "Sorry, I couldn't respond just now. Please try again!";
    conversationHistory.push({role:'assistant',content:reply});
    return reply;
  }

  /* ══════════════════════════════════════
     ADD MESSAGE
  ══════════════════════════════════════ */
  function getTime() {
    const d = new Date();
    return d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true});
  }

  function addMessage(role, text) {
    const msgs = document.getElementById('cb-messages');
    const div = document.createElement('div');
    div.className = `cb-msg ${role}`;
    const fmt = text
      .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
      .replace(/_(.*?)_/g,'<em>$1</em>')
      .replace(/\n/g,'<br>');
    const timeEl = `<div class="cb-time">${getTime()}</div>`;
    if (role==='bot') {
      div.innerHTML=`<div class="cb-avatar-wrap">🌿</div><div><div class="cb-bubble">${fmt}</div>${timeEl}</div>`;
    } else {
      div.innerHTML=`<div><div class="cb-bubble">${fmt}</div>${timeEl}</div>`;
    }
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function setTyping(show) {
    isTyping = show;
    document.getElementById('cb-typing').classList.toggle('show',show);
    document.getElementById('cb-send').disabled = show;
    document.getElementById('cb-messages').scrollTop = 99999;
  }

  /* ══════════════════════════════════════
     HANDLE SEND
  ══════════════════════════════════════ */
  async function handleSend() {
    const input = document.getElementById('cb-input');
    const text = input.value.trim();
    if (!text||isTyping) return;
    input.value='';input.style.height='auto';
    addMessage('user',text);
    setTyping(true);
    const w = document.getElementById('cb-welcome');
    if (w) w.style.display='none';
    try {
      const reply = await sendMessage(text);
      setTyping(false);
      addMessage('bot',reply);
    } catch(e) {
      setTyping(false);
      addMessage('bot',`⚠️ Sorry, something went wrong. Please try again.\n\n_Error: ${e.message}_`);
    }
  }

  window.cbAsk = function(text){document.getElementById('cb-input').value=text;handleSend();};

  /* ══════════════════════════════════════
     OPEN / CLOSE
  ══════════════════════════════════════ */
  function openPanel() {
    isOpen=true;panel.classList.add('open');fab.classList.remove('has-notif');
    if (!selectedLang) cbSelectLang('EN');
    else document.getElementById('cb-input').focus();
  }
  function closePanel(){isOpen=false;panel.classList.remove('open');}

  fab.addEventListener('click',()=>isOpen?closePanel():openPanel());
  document.getElementById('cb-close').addEventListener('click',closePanel);
  document.getElementById('cb-send').addEventListener('click',handleSend);
  document.getElementById('cb-input').addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();}
  });
  document.getElementById('cb-input').addEventListener('input',function(){
    this.style.height='auto';
    this.style.height=Math.min(this.scrollHeight,100)+'px';
  });

  setTimeout(()=>{if(!isOpen)fab.classList.add('has-notif');},8000);
  fetchSiteConfig().then(cfg=>{siteConfig=cfg;});

})();
