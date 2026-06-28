(function () {
  const scriptTag = document.currentScript;
  const token = scriptTag?.getAttribute('data-token');
  if (!token) return;

  const SUPABASE_URL = 'https://eevflmyoqwndobjkjuov.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldmZsbXlvcXduZG9iamtqdW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MzI5MjMsImV4cCI6MjA5NzEwODkyM30.3GomP52oNTWL8sdttwHaF2NyfjklKKO9eucmgFe2x_E';

  let color = '#16a34a';

  const style = document.createElement('style');
  document.head.appendChild(style);

  function applyStyles(c) {
    style.textContent = `
      #cai-btn {
        position: fixed; bottom: 24px; right: 24px;
        width: 56px; height: 56px; border-radius: 50%;
        background: ${c}; color: #fff; font-size: 26px;
        border: none; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.18);
        z-index: 99999; display: flex; align-items: center; justify-content: center;
        transition: transform 0.15s;
      }
      #cai-btn:hover { transform: scale(1.08); }
      #cai-box {
        position: fixed; bottom: 92px; right: 24px;
        width: 340px; height: 480px;
        background: #fff; border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        z-index: 99999; display: none; flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        overflow: hidden;
      }
      #cai-box.open { display: flex; }
      #cai-header { background: ${c}; color: #fff; padding: 14px 18px; font-weight: 600; font-size: 15px; display: flex; align-items: center; gap: 10px; }
      #cai-header span { flex: 1; }
      #cai-close { background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; }
      #cai-messages { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
      .cai-msg { max-width: 82%; padding: 9px 13px; border-radius: 12px; font-size: 14px; line-height: 1.5; }
      .cai-msg.bot { background: #f3f4f6; color: #111; align-self: flex-start; border-bottom-left-radius: 4px; }
      .cai-msg.user { background: ${c}; color: #fff; align-self: flex-end; border-bottom-right-radius: 4px; }
      #cai-footer { padding: 10px 12px; border-top: 1px solid #e5e7eb; display: flex; gap: 8px; }
      #cai-input { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 14px; outline: none; }
      #cai-input:focus { border-color: ${c}; }
      #cai-send { background: ${c}; color: #fff; border: none; border-radius: 8px; padding: 8px 14px; cursor: pointer; font-size: 14px; }
      #cai-send:disabled { opacity: 0.5; cursor: not-allowed; }
    `;
  }

  const btn = document.createElement('button');
  btn.id = 'cai-btn';
  btn.innerHTML = '💬';

  const box = document.createElement('div');
  box.id = 'cai-box';
  box.innerHTML = `
    <div id="cai-header">
      <span id="cai-title">Asistente</span>
      <button id="cai-close">✕</button>
    </div>
    <div id="cai-messages"></div>
    <div id="cai-footer">
      <input id="cai-input" type="text" placeholder="Escribe tu mensaje..." />
      <button id="cai-send">→</button>
    </div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(box);

  let negocio = null;
  let messages = [];
  let isOpen = false;

  async function loadNegocio() {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/negocios?token=eq.${token}&select=*`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const data = await res.json();
    if (data.length) {
      negocio = data[0];
      color = negocio.color || '#16a34a';
      applyStyles(color);
      document.getElementById('cai-title').textContent = negocio.nombre || 'Asistente';
      addMessage('bot', `Hola! Soy el asistente de ${negocio.nombre}. En que te puedo ayudar?`);
    }
  }

  applyStyles(color);

  function addMessage(role, text) {
    const el = document.createElement('div');
    el.className = `cai-msg ${role}`;
    el.textContent = text;
    document.getElementById('cai-messages').appendChild(el);
    document.getElementById('cai-messages').scrollTop = 99999;
    if (role === 'user' || role === 'bot') {
      messages.push({ role: role === 'bot' ? 'assistant' : 'user', content: text });
    }
  }

  async function sendMessage() {
    const input = document.getElementById('cai-input');
    const send = document.getElementById('cai-send');
    const text = input.value.trim();
    if (!text || !negocio) return;
    input.value = '';
    send.disabled = true;
    addMessage('user', text);
    const thinking = document.createElement('div');
    thinking.className = 'cai-msg bot';
    thinking.textContent = '...';
    thinking.id = 'cai-thinking';
    document.getElementById('cai-messages').appendChild(thinking);
    try {
      const systemPrompt = buildPrompt(negocio);
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ask-claude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ systemPrompt, messages, negocio_id: negocio.id }),
      });
      const data = await res.json();
      document.getElementById('cai-thinking')?.remove();
      if (res.status === 429 || (data.error && data.error.includes('limite'))) {
        addMessage('bot', '⚠️ Este asistente ha alcanzado el límite de conversaciones del mes. Contacta al negocio para más información.');
      } else if (res.status === 403 || (data.error && (data.error.includes('trial') || data.error.includes('plan_vencido')))) {
        addMessage('bot', '🔴 El plan de este asistente ha vencido. Contacta al negocio para más información.');
      } else {
        addMessage('bot', data.text || 'Lo siento, no pude responder.');
      }
    } catch {
      document.getElementById('cai-thinking')?.remove();
      addMessage('bot', 'Hubo un error. Intenta de nuevo.');
    }
    send.disabled = false;
    input.focus();
  }

  function buildPrompt(n) {
    return `Eres el asistente virtual de "${n.nombre}". Responde en español, amable y conciso (max 3 lineas). Solo responde sobre el negocio.
${n.descripcion ? `DESCRIPCION: ${n.descripcion}` : ''}
${n.menu ? `MENU:\n${n.menu}` : ''}
${n.horario ? `HORARIO: ${n.horario}` : ''}
${n.direccion ? `DIRECCION: ${n.direccion}` : ''}
${n.telefono ? `TELEFONO: ${n.telefono}` : ''}
${n.extra ? `INFO ADICIONAL:\n${n.extra}` : ''}`;
  }

  btn.addEventListener('click', () => {
    isOpen = !isOpen;
    box.classList.toggle('open', isOpen);
    btn.innerHTML = isOpen ? '✕' : '💬';
    if (isOpen && !negocio) loadNegocio();
  });

  document.getElementById('cai-close').addEventListener('click', () => {
    isOpen = false;
    box.classList.remove('open');
    btn.innerHTML = '💬';
  });

  document.getElementById('cai-send').addEventListener('click', sendMessage);
  document.getElementById('cai-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
})();