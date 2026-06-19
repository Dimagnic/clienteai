(function () {
  // Solo cargar el widget de demo en la landing page (raíz del sitio)
  if (window.location.pathname !== '/') return;

  const SUPABASE_URL = 'https://eevflmyoqwndobjkjuov.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldmZsbXlvcXduZG9iamtqdW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MzI5MjMsImV4cCI6MjA5NzEwODkyM30.3GomP52oNTWL8sdttwHaF2NyfjklKKO9eucmgFe2x_E';
  const TOKEN = 'rpb944k2yp3e87s6';

  const style = document.createElement('style');
  style.textContent = `
    @keyframes cai-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,0.4)} 50%{box-shadow:0 0 0 12px rgba(22,163,74,0)} }
    @keyframes cai-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
    @keyframes cai-spin { to{transform:rotate(360deg)} }
    @keyframes cai-fadein { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    #cai-btn {
      position: fixed; bottom: 24px; right: 24px;
      width: 60px; height: 60px; border-radius: 50%;
      background: linear-gradient(135deg, #16a34a, #15803d);
      color: #fff; font-size: 24px; font-weight: 900;
      border: none; cursor: pointer;
      box-shadow: 0 4px 20px rgba(22,163,74,0.4);
      z-index: 99999; display: flex; align-items: center; justify-content: center;
      animation: cai-pulse 2s infinite;
      transition: transform 0.2s;
    }
    #cai-btn:hover { transform: scale(1.1); }
    #cai-btn.open { animation: none; background: linear-gradient(135deg, #dc2626, #b91c1c); }
    #cai-badge {
      position: fixed; bottom: 76px; right: 20px;
      background: #16a34a; color: #fff; font-size: 11px; font-weight: 700;
      padding: 3px 8px; border-radius: 20px; z-index: 99999;
      animation: cai-bounce 2s infinite;
      font-family: -apple-system, sans-serif;
      white-space: nowrap;
    }
    #cai-box {
      position: fixed; bottom: 96px; right: 24px;
      width: 360px; height: 500px;
      background: #fff; border-radius: 20px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.15);
      z-index: 99999; display: none; flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      overflow: hidden; animation: cai-fadein 0.2s ease;
    }
    #cai-box.open { display: flex; }
    #cai-header {
      background: linear-gradient(135deg, #16a34a, #15803d);
      color: #fff; padding: 16px 18px;
      display: flex; align-items: center; gap: 12px;
    }
    #cai-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: 900; flex-shrink: 0;
      border: 2px solid rgba(255,255,255,0.4);
    }
    #cai-header-info { flex: 1; }
    #cai-header-name { font-size: 15px; font-weight: 700; margin: 0; }
    #cai-header-status { font-size: 12px; opacity: 0.85; margin: 0; display: flex; align-items: center; gap: 4px; }
    #cai-status-dot { width: 7px; height: 7px; border-radius: 50%; background: #86efac; display: inline-block; }
    #cai-close { background: none; border: none; color: #fff; font-size: 18px; cursor: pointer; opacity: 0.8; }
    #cai-close:hover { opacity: 1; }
    #cai-messages {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 10px;
      background: #f9fafb;
    }
    .cai-msg { max-width: 82%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.5; animation: cai-fadein 0.2s ease; }
    .cai-msg.bot { background: #fff; color: #111; align-self: flex-start; border-bottom-left-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .cai-msg.user { background: linear-gradient(135deg, #16a34a, #15803d); color: #fff; align-self: flex-end; border-bottom-right-radius: 4px; }
    #cai-footer { padding: 12px 14px; border-top: 1px solid #e5e7eb; display: flex; gap: 8px; background: #fff; }
    #cai-input { flex: 1; border: 1px solid #e5e7eb; border-radius: 24px; padding: 9px 16px; font-size: 14px; outline: none; background: #f9fafb; }
    #cai-input:focus { border-color: #16a34a; background: #fff; }
    #cai-send { background: linear-gradient(135deg, #16a34a, #15803d); color: #fff; border: none; border-radius: 50%; width: 38px; height: 38px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform 0.15s; }
    #cai-send:hover { transform: scale(1.1); }
    #cai-send:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    #cai-powered { text-align: center; font-size: 10px; color: #d1d5db; padding: 4px 0 6px; background: #fff; }
  `;
  document.head.appendChild(style);

  const badge = document.createElement('div');
  badge.id = 'cai-badge';
  badge.textContent = 'Hola! Puedo ayudarte 👋';

  const btn = document.createElement('button');
  btn.id = 'cai-btn';
  btn.innerHTML = '✦';

  const box = document.createElement('div');
  box.id = 'cai-box';
  box.innerHTML = `
    <div id="cai-header">
      <div id="cai-avatar">✦</div>
      <div id="cai-header-info">
        <p id="cai-header-name">ClienteAI</p>
        <p id="cai-header-status"><span id="cai-status-dot"></span> En linea</p>
      </div>
      <button id="cai-close">✕</button>
    </div>
    <div id="cai-messages"></div>
    <div id="cai-footer">
      <input id="cai-input" type="text" placeholder="Escribe tu pregunta..." />
      <button id="cai-send">↑</button>
    </div>
    <div id="cai-powered">Powered by ClienteAI</div>
  `;

  document.body.appendChild(badge);
  document.body.appendChild(btn);
  document.body.appendChild(box);

  let negocio = null;
  let messages = [];
  let isOpen = false;
  let badgeHidden = false;

  const SISTEMA = `Eres el asistente virtual de ClienteAI, una plataforma que permite a negocios crear asistentes de IA en 10 minutos.
Responde siempre en español, amable y conciso (maximo 3 lineas).

SOBRE CLIENTEAI:
- Crea un asistente virtual para tu negocio en 10 minutos
- Sin codigo, sin complicaciones
- Widget embebible para tu pagina web
- Link directo para compartir por WhatsApp
- Planes desde $0 MXN (gratuito con 50 conversaciones/mes)
- Plan Pro: $299 MXN/mes - conversaciones ilimitadas
- Plan Negocio: $599 MXN/mes - 3 asistentes, reportes mensuales
- Funciona con cualquier tipo de negocio: restaurantes, salones, consultorios, tiendas, etc.
- Atiende a tus clientes 24/7 automaticamente
- Dashboard con estadisticas de conversaciones
- Modo oscuro/claro incluido
- Soporte en español

Si el visitante quiere registrarse, indicale que haga clic en "Empezar gratis" en la parte superior.
Si tiene dudas sobre precios, menciona los planes disponibles.`;

  function addMessage(role, text) {
    const el = document.createElement('div');
    el.className = `cai-msg ${role}`;
    el.textContent = text;
    document.getElementById('cai-messages').appendChild(el);
    document.getElementById('cai-messages').scrollTop = 99999;
    messages.push({ role: role === 'bot' ? 'assistant' : 'user', content: text });
  }

  async function sendMessage() {
    const input = document.getElementById('cai-input');
    const send = document.getElementById('cai-send');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    send.disabled = true;
    addMessage('user', text);

    const thinking = document.createElement('div');
    thinking.className = 'cai-msg bot';
    thinking.id = 'cai-thinking';
    thinking.innerHTML = '<span style="display:flex;gap:4px;padding:2px 0"><span style="width:7px;height:7px;border-radius:50%;background:#d1d5db;animation:cai-bounce 1.2s infinite"></span><span style="width:7px;height:7px;border-radius:50%;background:#d1d5db;animation:cai-bounce 1.2s infinite;animation-delay:0.2s"></span><span style="width:7px;height:7px;border-radius:50%;background:#d1d5db;animation:cai-bounce 1.2s infinite;animation-delay:0.4s"></span></span>';
    document.getElementById('cai-messages').appendChild(thinking);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ask-claude`, {
        method: 'POST',
       headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({ systemPrompt: SISTEMA, messages }),
      });
      const data = await res.json();
      document.getElementById('cai-thinking')?.remove();
      addMessage('bot', data.text || 'Lo siento, intenta de nuevo.');
    } catch {
      document.getElementById('cai-thinking')?.remove();
      addMessage('bot', 'Hubo un error. Intenta de nuevo.');
    }
    send.disabled = false;
    input.focus();
  }

  btn.addEventListener('click', () => {
    isOpen = !isOpen;
    box.classList.toggle('open', isOpen);
    btn.classList.toggle('open', isOpen);
    btn.innerHTML = isOpen ? '✕' : '✦';
    if (!badgeHidden) { badge.style.display = 'none'; badgeHidden = true; }
    if (isOpen && messages.length === 0) {
      setTimeout(() => addMessage('bot', 'Hola! Soy el asistente de ClienteAI. Puedo ayudarte con precios, como funciona la plataforma o cualquier duda que tengas. En que te puedo ayudar?'), 300);
    }
  });

  document.getElementById('cai-close').addEventListener('click', () => {
    isOpen = false;
    box.classList.remove('open');
    btn.classList.remove('open');
    btn.innerHTML = '✦';
  });

  document.getElementById('cai-send').addEventListener('click', sendMessage);
  document.getElementById('cai-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  setTimeout(() => {
    if (!isOpen) { badge.style.display = 'none'; badgeHidden = true; }
  }, 5000);
})();