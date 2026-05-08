/**
 * ═══════════════════════════════════════════════════
 *  घरायेसी Smart Chatbot — Powered by Groq via Cloudflare
 *  API key is hidden inside Cloudflare Worker (secure)
 *  Auto-syncs with site-config.json on every session
 *  Language selector — Nepali & English
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

  const style = document.createElement('style');
  style.textContent = `
    @keyframes cbSlideUp{from{opacity:0;transform:translateY(24px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
    @keyframes cbFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes cbPulseRing{0%,100%{box-shadow:0 0 0 0 rgba(46,125,69,.5)}60%{box-shadow:0 0 0 14px rgba(46,125,69,0)}}
    @keyframes cbDot{0%,80%,100%{transform:scale(0.6);opacity:.4}40%{transform:scale(1);opacity:1}}
    @keyframes cbMsgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes cbShimmer{0%{background-position:200% center}100%{background-position:-200% center}}
    @keyframes cbLangPop{from{opacity:0;transform:scale(.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}

    #cb-fab{position:fixed;bottom:90px;left:20px;z-index:9000;width:58px;height:58px;border-radius:50%;background:linear-gradient(135deg,#2e7d45,#1a5c2e);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 24px rgba(46,125,69,.5);animation:cbPulseRing 2.8s ease-in-out infinite;transition:transform .2s,box-shadow .2s;}
    #cb-fab:hover{transform:scale(1.1);box-shadow:0 10px 32px rgba(46,125,69,.6)}
    #cb-fab:active{transform:scale(.94)}
    #cb-fab svg{width:26px;height:26px;fill:#fff}
    #cb-fab .cb-notif{position:absolute;top:-2px;right:-2px;width:14px;height:14px;background:#fbbf24;border-radius:50%;border:2px solid #fff;display:none;}
    #cb-fab.has-notif .cb-notif{display:block}
    @media(min-width:768px){#cb-fab{bottom:30px;left:30px;width:62px;height:62px}}

    #cb-panel{position:fixed;bottom:160px;left:20px;z-index:8999;width:calc(100vw - 40px);max-width:390px;height:560px;max-height:calc(100vh - 180px);background:#fdf6ec;border-radius:24px;box-shadow:0 24px 80px rgba(59,42,26,.22),0 4px 24px rgba(59,42,26,.12);display:none;flex-direction:column;overflow:hidden;border:1px solid rgba(46,125,69,.12);animation:cbSlideUp .4s cubic-bezier(.34,1.56,.64,1);}
    #cb-panel.open{display:flex}
    @media(min-width:768px){#cb-panel{bottom:106px;left:30px;width:390px;height:580px}}

    #cb-header{background:linear-gradient(135deg,#1a5c2e 0%,#2e7d45 60%,#246038 100%);padding:16px 18px 14px;display:flex;align-items:center;gap:12px;flex-shrink:0;position:relative;overflow:hidden;}
    #cb-header::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 90% 20%,rgba(251,191,36,.15),transparent 60%);pointer-events:none;}
    #cb-header-avatar{width:42px;height:42px;border-radius:13px;object-fit:contain;background:rgba(255,255,255,.18);border:2px solid rgba(255,255,255,.25);padding:4px;flex-shrink:0;}
    #cb-header-info{flex:1}
    #cb-header-name{font-family:'Playfair Display',serif;font-weight:700;font-size:.97rem;color:#fff;line-height:1.2;}
    #cb-header-status{display:flex;align-items:center;gap:5px;margin-top:3px}
    .cb-status-dot{width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 5px #4ade80;animation:cbPulseRing 2s infinite;flex-shrink:0;}
    #cb-header-status span{font-size:.68rem;color:rgba(255,255,255,.72);letter-spacing:.04em}
    #cb-close{background:rgba(255,255,255,.15);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;transition:background .15s;flex-shrink:0;z-index:1;}
    #cb-close:hover{background:rgba(255,255,255,.28)}

    #cb-lang-screen{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 24px;gap:18px;background:linear-gradient(180deg,#fdf6ec 0%,#f5ece0 100%);}
    .cb-lang-title{font-family:'Playfair Display',serif;font-weight:700;font-size:1.12rem;color:#3b2a1a;text-align:center;line-height:1.4;}
    .cb-lang-subtitle{font-size:.77rem;color:rgba(59,42,26,.5);text-align:center;line-height:1.6;margin-top:-8px;}
    .cb-lang-options{display:flex;gap:14px;width:100%}
    .cb-lang-btn{flex:1;padding:20px 12px;border-radius:18px;border:2px solid rgba(46,125,69,.15);background:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px;transition:all .2s;box-shadow:0 3px 14px rgba(59,42,26,.07);animation:cbLangPop .5s cubic-bezier(.34,1.56,.64,1) both;}
    .cb-lang-btn:nth-child(2){animation-delay:.08s}
    .cb-lang-btn:hover{border-color:#2e7d45;background:rgba(46,125,69,.04);transform:translateY(-3px);box-shadow:0 8px 24px rgba(46,125,69,.18);}
    .cb-lang-btn:active{transform:scale(.97)}
    .cb-lang-flag{font-size:2.2rem;line-height:1}
    .cb-lang-name{font-weight:700;font-size:.95rem;color:#3b2a1a}
    .cb-lang-sub{font-size:.7rem;color:rgba(59,42,26,.45);text-align:center;line-height:1.4}
    .cb-lang-divider{display:flex;align-items:center;gap:10px;width:100%;font-size:.68rem;color:rgba(59,42,26,.3);}
    .cb-lang-divider::before,.cb-lang-divider::after{content:'';flex:1;height:1px;background:rgba(59,42,26,.1);}
    .cb-lang-skip{background:none;border:none;color:rgba(59,42,26,.38);font-size:.74rem;cursor:pointer;font-family:'DM Sans',sans-serif;text-decoration:underline;padding:0;}
    .cb-lang-skip:hover{color:rgba(59,42,26,.65)}

    #cb-chat-area{flex:1;display:none;flex-direction:column;overflow:hidden}
    #cb-chat-area.active{display:flex}

    #cb-welcome{background:linear-gradient(135deg,rgba(46,125,69,.08),rgba(46,125,69,.04));border-bottom:1px solid rgba(46,125,69,.1);padding:12px 16px;flex-shrink:0;}
    #cb-welcome p{font-size:.76rem;color:#3b2a1a;line-height:1.55;opacity:.7}
    .cb-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
    .cb-chip{background:#fff;border:1.5px solid rgba(46,125,69,.2);color:#2e7d45;font-size:.7rem;font-weight:600;padding:5px 11px;border-radius:999px;cursor:pointer;transition:all .15s;white-space:nowrap;}
    .cb-chip:hover{background:#2e7d45;color:#fff;border-color:#2e7d45}

    #cb-messages{flex:1;overflow-y:auto;padding:16px 14px;display:flex;flex-direction:column;gap:12px;scroll-behavior:smooth;}
    #cb-messages::-webkit-scrollbar{width:4px}
    #cb-messages::-webkit-scrollbar-thumb{background:rgba(59,42,26,.12);border-radius:4px}
    .cb-msg{display:flex;gap:8px;animation:cbMsgIn .3s ease}
    .cb-msg.user{flex-direction:row-reverse}
    .cb-bubble{max-width:80%;padding:11px 14px;border-radius:18px;font-size:.84rem;line-height:1.6;word-break:break-word;}
    .cb-msg.bot .cb-bubble{background:#fff;color:#3b2a1a;border-radius:4px 18px 18px 18px;box-shadow:0 2px 10px rgba(59,42,26,.08);border:1px solid rgba(59,42,26,.06);}
    .cb-msg.user .cb-bubble{background:linear-gradient(135deg,#2e7d45,#246038);color:#fff;border-radius:18px 4px 18px 18px;box-shadow:0 2px 12px rgba(46,125,69,.3);}
    .cb-avatar{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#2e7d45,#1a5c2e);display:flex;align-items:center;justify-content:center;font-size:.8rem;flex-shrink:0;margin-top:2px;}

    #cb-typing{display:none;align-items:center;gap:8px;padding:0 14px 4px;animation:cbFadeIn .3s ease}
    #cb-typing.show{display:flex}
    .cb-typing-dots{background:#fff;border:1px solid rgba(59,42,26,.06);border-radius:4px 18px 18px 18px;padding:12px 16px;display:flex;gap:5px;align-items:center;box-shadow:0 2px 10px rgba(59,42,26,.08);}
    .cb-typing-dots span{width:7px;height:7px;border-radius:50%;background:#2e7d45;opacity:.4;animation:cbDot 1.2s infinite;}
    .cb-typing-dots span:nth-child(2){animation-delay:.2s}
    .cb-typing-dots span:nth-child(3){animation-delay:.4s}

    #cb-input-area{padding:12px 14px 16px;background:#fff;border-top:1px solid rgba(59,42,26,.07);display:flex;gap:8px;align-items:flex-end;flex-shrink:0;}
    #cb-input{flex:1;border:1.5px solid rgba(59,42,26,.12);border-radius:14px;padding:10px 14px;font-size:.86rem;font-family:'DM Sans',sans-serif;color:#3b2a1a;background:#fdf6ec;resize:none;outline:none;max-height:100px;min-height:42px;line-height:1.5;transition:border-color .2s,box-shadow .2s;}
    #cb-input:focus{border-color:#2e7d45;box-shadow:0 0 0 3px rgba(46,125,69,.1);background:#fff}
    #cb-input::placeholder{color:rgba(59,42,26,.3)}
    #cb-send{width:42px;height:42px;background:linear-gradient(135deg,#2e7d45,#246038);border:none;border-radius:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform .15s,box-shadow .15s;box-shadow:0 3px 12px rgba(46,125,69,.3);}
    #cb-send:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(46,125,69,.4)}
    #cb-send:active{transform:scale(.93)}
    #cb-send svg{width:18px;height:18px;fill:#fff}
    #cb-send:disabled{opacity:.45;cursor:not-allowed;transform:none}
    .cb-loading-msg{font-size:.78rem;color:rgba(59,42,26,.4);text-align:center;padding:8px;background:linear-gradient(90deg,rgba(59,42,26,.05) 25%,rgba(59,42,26,.1) 50%,rgba(59,42,26,.05) 75%);background-size:200% auto;animation:cbShimmer 1.5s linear infinite;border-radius:8px;}
  `;
  document.head.appendChild(style);

  const fab = document.createElement('button');
  fab.id = 'cb-fab';
  fab.setAttribute('aria-label','Open chat');
  fab.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 10H6v-2h12v2zm0-3H6V7h12v2z"/></svg><span class="cb-notif"></span>`;

  const panel = document.createElement('div');
  panel.id = 'cb-panel';
  panel.setAttribute('role','dialog');
  panel.innerHTML = `
    <div id="cb-header">
      <img id="cb-header-avatar" src="https://raw.githubusercontent.com/SaraswotikhelSmartSewa/gharayesi/refs/heads/main/IMG_20260411_223531.png" alt="Gharayesi"/>
      <div id="cb-header-info">
        <div id="cb-header-name">घरायेसी Assistant 🌿</div>
        <div id="cb-header-status"><span class="cb-status-dot"></span><span id="cb-status-text">Online • सेवामा तत्पर</span></div>
      </div>
      <button id="cb-close">✕</button>
    </div>

    <div id="cb-lang-screen">
      <div class="cb-lang-title">नमस्ते! 🌿<br>Welcome to घरायेसी</div>
      <div class="cb-lang-subtitle">Please choose your preferred language<br>कृपया आफ्नो भाषा छान्नुहोस्</div>
      <div class="cb-lang-options">
        <button class="cb-lang-btn" onclick="cbSelectLang('NP')">
          <span class="cb-lang-flag">🇳🇵</span>
          <span class="cb-lang-name">नेपाली</span>
          <span class="cb-lang-sub">नेपाली भाषामा<br>कुराकानी गर्नुस्</span>
        </button>
        <button class="cb-lang-btn" onclick="cbSelectLang('EN')">
          <span class="cb-lang-flag">🇬🇧</span>
          <span class="cb-lang-name">English</span>
          <span class="cb-lang-sub">Chat with us<br>in English</span>
        </button>
      </div>
      <div class="cb-lang-divider">or</div>
      <button class="cb-lang-skip" onclick="cbSelectLang('AUTO')">Skip — detect language automatically</button>
    </div>

    <div id="cb-chat-area">
      <div id="cb-welcome">
        <p id="cb-welcome-text"></p>
        <div class="cb-chips" id="cb-chips"></div>
      </div>
      <div id="cb-messages"></div>
      <div id="cb-typing">
        <div class="cb-avatar">🌿</div>
        <div class="cb-typing-dots"><span></span><span></span><span></span></div>
      </div>
      <div id="cb-input-area">
        <textarea id="cb-input" placeholder="Type your message…" rows="1"></textarea>
        <button id="cb-send" disabled><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
      </div>
    </div>
  `;

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  const LANG_CONTENT = {
    NP: {
      welcomeText: 'के मद्दत गर्न सक्छु? मूल्य, डेलिभरी, वा अर्डर — जे सोध्नुस् पनि! 😊',
      placeholder: 'सन्देश लेख्नुस्…',
      status: 'Online • सेवामा तत्पर',
      chips: [
        {label:'🥬 आजको मूल्य', msg:'आजको तरकारीको मूल्य के छ?'},
        {label:'🛵 डेलिभरी', msg:'डेलिभरी कति पर्छ र कहाँसम्म हुन्छ?'},
        {label:'📦 अर्डर कसरी?', msg:'कसरी अर्डर गर्ने?'},
        {label:'🕐 समय', msg:'पसल कति बजे खुल्छ र बन्द हुन्छ?'},
      ]
    },
    EN: {
      welcomeText: 'How can I help you today? Ask me about prices, delivery, ordering — anything! 😊',
      placeholder: 'Type your message…',
      status: 'Online • Ready to help',
      chips: [
        {label:"🥬 Today's prices", msg:"What are today's vegetable prices?"},
        {label:'🛵 Delivery', msg:'How much is delivery and where do you deliver?'},
        {label:'📦 How to order', msg:'How do I place an order?'},
        {label:'🕐 Opening hours', msg:'What are your opening hours?'},
      ]
    },
    AUTO: {
      welcomeText: 'नमस्ते! Hello! Ask me anything about घरायेसी 😊',
      placeholder: 'सन्देश लेख्नुस् • Type your message…',
      status: 'Online • सेवामा तत्पर',
      chips: [
        {label:'🥬 आजको मूल्य', msg:'आजको तरकारीको मूल्य के छ?'},
        {label:"📦 How to order", msg:'How do I place an order?'},
        {label:'🛵 डेलिभरी', msg:'डेलिभरी कति पर्छ?'},
        {label:'🕐 Timings', msg:'What are your opening hours?'},
      ]
    }
  };

  window.cbSelectLang = function(lang) {
    selectedLang = lang;
    document.getElementById('cb-lang-screen').style.display = 'none';
    document.getElementById('cb-chat-area').classList.add('active');
    const c = LANG_CONTENT[lang];
    document.getElementById('cb-input').placeholder = c.placeholder;
    document.getElementById('cb-status-text').textContent = c.status;
    document.getElementById('cb-welcome-text').textContent = c.welcomeText;
    document.getElementById('cb-chips').innerHTML = c.chips.map(ch =>
      `<span class="cb-chip" onclick="cbAsk('${ch.msg}')">${ch.label}</span>`
    ).join('');
    if (!systemPrompt) initChat(lang);
    else { document.getElementById('cb-send').disabled = false; sendWelcomeMessage(lang); }
  };

  function sendWelcomeMessage(lang) {
    if (lang === 'NP') {
      addMessage('bot', `नमस्ते! म घरायेसीको सहायक हुँ 🌿\n\nआज के चाहिएको छ? मूल्य सोध्नुस्, डेलिभरी बुझ्नुस्, वा अर्डर गर्न मद्दत लिनुस् — म यहाँ नै छु!`);
    } else if (lang === 'EN') {
      addMessage('bot', `Hello there! I'm the Gharayesi assistant 🌿\n\nWhat can I help you with today? Whether it's checking today's prices, figuring out delivery, or placing an order — I've got you covered!`);
    } else {
      addMessage('bot', `नमस्ते! Hello! I'm the घरायेसी assistant 🌿\n\nFeel free to ask in Nepali or English — I'll follow your lead!`);
    }
  }

  async function fetchSiteConfig() {
    try {
      const res = await fetch(CONFIG_URL + '?v=' + Date.now());
      if (!res.ok) throw new Error('fetch failed');
      return await res.json();
    } catch(e) { return null; }
  }

  function buildSystemPrompt(cfg, lang) {
    const langRule = lang === 'NP'
      ? 'CRITICAL: Always respond in natural, flowing Nepali (Devanagari). Only use English for product names where necessary.'
      : lang === 'EN'
      ? 'CRITICAL: Always respond in natural, friendly English.'
      : 'Respond in whichever language the visitor uses — Nepali or English.';

    if (!cfg) return `You are a warm assistant for Gharayesi shop in Saraswotikhel, Nepal. ${langRule} Be conversational, never robotic.`;

    const { meta, categories, hours, whyUs } = cfg;
    let products = '';
    (categories||[]).forEach(cat => {
      products += `\n${cat.name}:\n`;
      (cat.items||[]).forEach(item => {
        const p = (item.prices||[]).map(x=>`Rs.${x.price} per ${x.unit}`).join(', ');
        products += `  • ${item.name}: ${p}\n`;
      });
    });
    const hrs = (hours||[]).map(h=>`  ${h.day}: ${h.time}${h.closed?' (call to confirm)':''}`).join('\n');

    return `You are the friendly AI assistant for "${meta.shopName}", a beloved neighbourhood fresh vegetable shop in Saraswotikhel, Bhaktapur, Nepal. Think of yourself as a warm, helpful friend who knows everything about this shop.

${langRule}

YOUR TONE:
- Conversational and natural — like chatting with a friendly neighbour, never like a script
- Warm, genuine, occasionally playful
- Keep answers short and flowing — no bullet point walls or corporate speak
- Use emojis naturally but sparingly 🌿

SHOP DETAILS:
- Name: ${meta.shopName} | Location: ${meta.address}
- WhatsApp: ${meta.whatsappNumber} | Phone: ${meta.phone}

ORDERING: Customers message on WhatsApp at ${meta.whatsappNumber} with their order, name, phone, and address. Delivery is just Rs. 25 within Saraswotikhel and nearby areas.

HOURS:
${hrs}

PRODUCTS & PRICES:
${products}

GUIDELINES:
- Share prices naturally in conversation, not as a cold list
- Always guide people to WhatsApp (${meta.whatsappNumber}) when they want to order
- If a product isn't listed, say prices change daily and suggest messaging on WhatsApp
- Never invent prices or information
- Keep replies focused — a chat window is small!`;
  }

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
      l.id = 'cb-loader'; l.className = 'cb-loading-msg';
      l.textContent = 'Loading shop info…';
      msgs.appendChild(l);
    } else if (!show && l) l.remove();
  }

  async function sendMessage(userText) {
    conversationHistory.push({role:'user', content:userText});
    const messages = [{role:'system', content:systemPrompt}, ...conversationHistory];
    const res = await fetch(WORKER_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json','X-Auth-Token':AUTH_TOKEN},
      body:JSON.stringify({messages})
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e?.error||'Worker error'); }
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || (selectedLang==='NP' ? 'माफ गर्नुस्, अहिले जवाफ दिन सकिएन।' : "Sorry, I couldn't respond just now.");
    conversationHistory.push({role:'assistant', content:reply});
    return reply;
  }

  function addMessage(role, text) {
    const msgs = document.getElementById('cb-messages');
    const div = document.createElement('div');
    div.className = `cb-msg ${role}`;
    const fmt = text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/_(.*?)_/g,'<em>$1</em>').replace(/\n/g,'<br>');
    div.innerHTML = role==='bot'
      ? `<div class="cb-avatar">🌿</div><div class="cb-bubble">${fmt}</div>`
      : `<div class="cb-bubble">${fmt}</div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function setTyping(show) {
    isTyping = show;
    document.getElementById('cb-typing').classList.toggle('show', show);
    document.getElementById('cb-send').disabled = show;
    document.getElementById('cb-messages').scrollTop = 99999;
  }

  async function handleSend() {
    const input = document.getElementById('cb-input');
    const text = input.value.trim();
    if (!text || isTyping) return;
    input.value = ''; input.style.height = 'auto';
    addMessage('user', text);
    setTyping(true);
    const w = document.getElementById('cb-welcome');
    if (w) w.style.display = 'none';
    try {
      const reply = await sendMessage(text);
      setTyping(false);
      addMessage('bot', reply);
    } catch(e) {
      setTyping(false);
      addMessage('bot', selectedLang==='NP'
        ? `⚠️ माफ गर्नुस्, केही समस्या आयो। फेरि प्रयास गर्नुस्।\n\n_Error: ${e.message}_`
        : `⚠️ Sorry, something went wrong. Please try again.\n\n_Error: ${e.message}_`);
    }
  }

  window.cbAsk = function(text) { document.getElementById('cb-input').value = text; handleSend(); };

  function openPanel() {
    isOpen = true; panel.classList.add('open'); fab.classList.remove('has-notif');
    if (selectedLang) document.getElementById('cb-input').focus();
  }
  function closePanel() { isOpen = false; panel.classList.remove('open'); }

  fab.addEventListener('click', () => isOpen ? closePanel() : openPanel());
  document.getElementById('cb-close').addEventListener('click', closePanel);
  document.getElementById('cb-send').addEventListener('click', handleSend);
  document.getElementById('cb-input').addEventListener('keydown', e => {
    if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });
  document.getElementById('cb-input').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

  setTimeout(() => { if (!isOpen) fab.classList.add('has-notif'); }, 8000);
  fetchSiteConfig().then(cfg => { siteConfig = cfg; });

})();
