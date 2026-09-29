/* ═══════════════════════════════════════════
   TechDesk Assistant – Frontend Logic
   ═══════════════════════════════════════════ */

// ─────────────────────────────
// State
// ─────────────────────────────
let sessionId = null;
let isLoading  = false;

const API_BASE = window.location.origin;

// ─────────────────────────────
// DOM refs
// ─────────────────────────────
const $ = id => document.getElementById(id);

const chatArea       = $('chatArea');
const messages       = $('messages');
const userInput      = $('userInput');
const sendBtn        = $('sendBtn');
const charCount      = $('charCount');
const typingIndicator= $('typingIndicator');
const welcomeScreen  = $('welcomeScreen');
const newChatBtn     = $('newChatBtn');
const clearBtn       = $('clearBtn');
const quickPrompts   = $('quickPrompts');
const sidebar        = $('sidebar');
const menuBtn        = $('menuBtn');
const sidebarToggle  = $('sidebarToggle');
const toast          = $('toast');

// ─────────────────────────────
// Session Management
// ─────────────────────────────
async function initSession() {
  try {
    const res  = await fetch(`${API_BASE}/api/session`, { method: 'POST' });
    const data = await res.json();
    sessionId  = data.session_id;
    console.log('[TechDesk] Session:', sessionId);
  } catch (err) {
    console.error('[TechDesk] Failed to create session:', err);
    showToast('⚠️ Could not connect to server');
  }
}

async function newChat() {
  await initSession();
  messages.innerHTML = '';
  welcomeScreen.style.display = '';
  userInput.focus();
  showToast('✨ New conversation started');
}

// ─────────────────────────────
// Markdown Renderer (lightweight)
// ─────────────────────────────
function renderMarkdown(text) {
  // Escape HTML first
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code.trim();
    const langLabel = lang || 'code';
    return `<div class="code-block-wrap">
      <pre><code class="lang-${langLabel}">${escaped}</code></pre>
      <span class="code-lang-tag">${langLabel}</span>
      <button class="copy-btn" onclick="copyCode(this)">Copy</button>
    </div>`;
  });

  // Inline code `...`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold **...**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic *...*
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm,  '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm,   '<h1>$1</h1>');

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');

  // Unordered lists
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Line breaks → paragraphs
  html = html
    .split(/\n\n+/)
    .map(block => {
      block = block.trim();
      if (!block) return '';
      if (/^<(h[1-3]|ul|ol|li|pre|blockquote|hr|div)/.test(block)) return block;
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');

  return html;
}

function copyCode(btn) {
  const pre  = btn.closest('.code-block-wrap').querySelector('code');
  navigator.clipboard.writeText(pre.textContent).then(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => (btn.textContent = 'Copy'), 1800);
  });
}
window.copyCode = copyCode;

// ─────────────────────────────
// Message Rendering
// ─────────────────────────────
function timeNow() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function appendUserMessage(text) {
  welcomeScreen.style.display = 'none';

  const row = document.createElement('div');
  row.className = 'message-row user';
  row.innerHTML = `
    <div class="avatar user">👤</div>
    <div class="message-body">
      <div class="bubble user-bubble">${escapeHtml(text)}</div>
      <div class="msg-time">${timeNow()}</div>
    </div>
  `;
  messages.appendChild(row);
  scrollToBottom();
}

function appendAIMessage(text, toolsUsed = []) {
  const row = document.createElement('div');
  row.className = 'message-row';

  const toolBadges = toolsUsed.map(t =>
    `<span class="tool-badge">${t.tool.replace(/_/g, ' ')}</span>`
  ).join('');

  const toolSection = toolsUsed.length
    ? `<div class="tools-used">${toolBadges}</div>`
    : '';

  row.innerHTML = `
    <div class="avatar ai">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
      </svg>
    </div>
    <div class="message-body">
      <div class="bubble ai-bubble">${renderMarkdown(text)}</div>
      ${toolSection}
      <div class="msg-time">${timeNow()}</div>
    </div>
  `;
  messages.appendChild(row);
  scrollToBottom();
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatArea.scrollTop = chatArea.scrollHeight;
  });
}

// ─────────────────────────────
// Toast Notification
// ─────────────────────────────
let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ─────────────────────────────
// Chat Send
// ─────────────────────────────
async function sendMessage() {
  if (isLoading || !sessionId) return;
  const text = userInput.value.trim();
  if (!text) return;

  // Clear input
  userInput.value = '';
  autoResizeTextarea();
  updateCharCount();

  // Show user message
  appendUserMessage(text);

  // Show loading
  isLoading = true;
  sendBtn.disabled = true;
  typingIndicator.classList.add('visible');
  scrollToBottom();

  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ session_id: sessionId, message: text }),
    });

    const data = await res.json();

    if (data.success) {
      appendAIMessage(data.answer, data.tools_used || []);
      if (data.tools_used?.length > 0) {
        const toolNames = data.tools_used.map(t => t.tool.replace(/_/g, ' ')).join(', ');
        showToast(`🔧 Used: ${toolNames}`);
      }
    } else {
      appendAIMessage(`❌ **Error:** ${data.answer}`);
    }
  } catch (err) {
    appendAIMessage('❌ **Connection error.** Is the server running?');
    console.error('[TechDesk] Fetch error:', err);
  } finally {
    isLoading = false;
    sendBtn.disabled = userInput.value.trim().length === 0;
    typingIndicator.classList.remove('visible');
  }
}

// ─────────────────────────────
// Clear Session
// ─────────────────────────────
async function clearSession() {
  if (!sessionId) return;
  try {
    await fetch(`${API_BASE}/api/clear/${sessionId}`, { method: 'DELETE' });
    await initSession();   // fresh session
    messages.innerHTML = '';
    welcomeScreen.style.display = '';
    showToast('🗑️ Conversation cleared');
  } catch (err) {
    console.error('[TechDesk] Clear error:', err);
  }
}

// ─────────────────────────────
// Input Helpers
// ─────────────────────────────
function autoResizeTextarea() {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 180) + 'px';
}

function updateCharCount() {
  const n = userInput.value.length;
  charCount.textContent = `${n} / 4000`;
}

// ─────────────────────────────
// Sidebar Toggle
// ─────────────────────────────
function toggleSidebar() {
  if (window.innerWidth <= 700) {
    sidebar.classList.toggle('mobile-open');
  } else {
    sidebar.classList.toggle('collapsed');
  }
}

// ─────────────────────────────
// Event Listeners
// ─────────────────────────────
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) sendMessage();
  }
});

userInput.addEventListener('input', () => {
  autoResizeTextarea();
  updateCharCount();
  sendBtn.disabled = userInput.value.trim().length === 0 || isLoading;
});

newChatBtn.addEventListener('click', newChat);
clearBtn.addEventListener('click', clearSession);
menuBtn.addEventListener('click', toggleSidebar);
sidebarToggle.addEventListener('click', toggleSidebar);

// Quick prompts
quickPrompts.querySelectorAll('.quick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    userInput.value = btn.dataset.q;
    autoResizeTextarea();
    updateCharCount();
    sendBtn.disabled = false;
    userInput.focus();
    // Auto-send after slight delay
    setTimeout(sendMessage, 120);
  });
});

// ─────────────────────────────
// Init
// ─────────────────────────────
(async () => {
  await initSession();
  userInput.focus();
  console.log('[TechDesk] Ready ✓');
})();
