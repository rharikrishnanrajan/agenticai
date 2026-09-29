import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Bot,
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  Terminal,
  BookOpen,
  Bug,
  Scale,
  Globe,
  Settings,
  Key,
  RefreshCw,
  Menu,
  X,
  ExternalLink,
  Code2,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Sparkles,
  Search,
  MessageSquare
} from 'lucide-react';

// Code Block Component with Syntax Label & Copy
const CodeBlock = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-card">
      <div className="code-card-header">
        <span>{language || 'code'}</span>
        <button className="btn-copy-code" onClick={handleCopy}>
          {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre>
        <code>{value}</code>
      </pre>
    </div>
  );
};

export default function App() {
  // Session & Chat State
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('techdesk_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'debugger' | 'docs' | 'settings'

  // App UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState(null);
  const [config, setConfig] = useState({
    is_configured: false,
    masked_key: '',
    model: 'Gemini 3.8 Flash',
    tools_count: 5
  });

  // Error Debugger Tab State
  const [debuggerInput, setDebuggerInput] = useState('');
  const [debuggerOutput, setDebuggerOutput] = useState('');
  const [debuggerLoading, setDebuggerLoading] = useState(false);

  // Docs Explorer Tab State
  const [docsQuery, setDocsQuery] = useState('');
  const [docsOutput, setDocsOutput] = useState('');
  const [docsLoading, setDocsLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Sync sessions to localStorage
  useEffect(() => {
    localStorage.setItem('techdesk_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Fetch initial config & status
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.success) {
        setConfig(data);
      }
    } catch (err) {
      console.warn('Backend unreachable yet:', err);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Initialize or restore session
  const createNewSession = async () => {
    try {
      const res = await fetch('/api/session', { method: 'POST' });
      const data = await res.json();
      const newId = data.session_id;

      const newSessionObj = {
        id: newId,
        title: 'New Conversation',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messageCount: 0
      };

      setSessions((prev) => [newSessionObj, ...prev]);
      setCurrentSessionId(newId);
      setMessages([]);
      setActiveTab('chat');
      showToast('✨ New conversation created');
    } catch (err) {
      console.error('Failed to create session:', err);
      // Fallback local session ID
      const fallbackId = 'local-' + Date.now();
      setCurrentSessionId(fallbackId);
      setMessages([]);
    }
  };

  useEffect(() => {
    if (sessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessions[0].id);
      loadSessionHistory(sessions[0].id);
    } else if (sessions.length === 0 && !currentSessionId) {
      createNewSession();
    }
  }, []);

  // Load history from backend for a session
  const loadSessionHistory = async (sessId) => {
    try {
      const res = await fetch(`/api/history/${sessId}`);
      const data = await res.json();
      if (data.success && data.history) {
        const mapped = data.history.map((h, i) => ({
          id: i,
          role: h.role,
          content: h.content,
          timestamp: 'Saved'
        }));
        setMessages(mapped);
      }
    } catch (err) {
      console.error('History load error:', err);
    }
  };

  const selectSession = (id) => {
    setCurrentSessionId(id);
    loadSessionHistory(id);
    setActiveTab('chat');
  };

  const deleteSession = async (e, id) => {
    e.stopPropagation();
    try {
      await fetch(`/api/clear/${id}`, { method: 'DELETE' });
    } catch {}

    const filtered = sessions.filter((s) => s.id !== id);
    setSessions(filtered);

    if (currentSessionId === id) {
      if (filtered.length > 0) {
        setCurrentSessionId(filtered[0].id);
        loadSessionHistory(filtered[0].id);
      } else {
        createNewSession();
      }
    }
    showToast('Session removed');
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle textarea resize
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  // Send message to TechDesk Agent
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    if (!currentSessionId) {
      await createNewSession();
    }

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);

    // Update session title if first message
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId && s.title === 'New Conversation') {
          return { ...s, title: query.slice(0, 32) + (query.length > 32 ? '...' : '') };
        }
        return s;
      })
    );

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSessionId,
          message: query
        })
      });

      const data = await res.json();

      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.answer || 'No response generated.',
        tools_used: data.tools_used || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (data.tools_used && data.tools_used.length > 0) {
        showToast(`Used: ${data.tools_used.map((t) => t.tool.replace(/_/g, ' ')).join(', ')}`);
      }

      if (data.error_type === 'INVALID_API_KEY') {
        setKeyModalOpen(true);
      }
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '⚠️ Failed to connect to Python backend. Please verify `python app.py` is running on port 5000.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };


  // Run Error Debugger
  const handleRunDebugger = async () => {
    if (!debuggerInput.trim() || debuggerLoading) return;
    setDebuggerLoading(true);
    try {
      const res = await fetch('/api/tool-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_id: 'explain_error',
          query: debuggerInput.trim()
        })
      });
      const data = await res.json();
      setDebuggerOutput(data.output || 'No analysis available.');
    } catch (err) {
      setDebuggerOutput('Failed to execute error explainer tool.');
    } finally {
      setDebuggerLoading(false);
    }
  };

  // Run Docs Search
  const handleRunDocsSearch = async () => {
    if (!docsQuery.trim() || docsLoading) return;
    setDocsLoading(true);
    try {
      const res = await fetch('/api/tool-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_id: 'search_official_docs',
          query: docsQuery.trim()
        })
      });
      const data = await res.json();
      setDocsOutput(data.output || 'No documentation found.');
    } catch (err) {
      setDocsOutput('Failed to search documentation.');
    } finally {
      setDocsLoading(false);
    }
  };

  const quickPrompts = [
    { title: 'React 19 Hooks', query: 'What are the newest hooks and features in React 19?' },
    { title: 'Python Async vs Threading', query: 'Compare Python asyncio vs threading in Python 3.14 with code examples' },
    { title: 'Fix CORS Error', query: 'How to fix CORS header No Access-Control-Allow-Origin in Express and Flask?' },
    { title: 'Docker Multi-stage', query: 'Show best practice Dockerfile multi-stage build for a Node.js / React app' },
    { title: 'Git Rebase vs Merge', query: 'Explain Git rebase vs merge with diagrams and when to use each' },
    { title: 'SQL Indexes', query: 'How do B-tree database indexes work and when should you avoid them?' }
  ];

  return (
    <div className="app-container">
      {/* ────────── SIDEBAR ────────── */}
      <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="brand-badge">
            <div className="brand-icon-box" style={{ overflow: 'hidden', padding: 0 }}>
              <img src="/logo.png" alt="TechDesk Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className="brand-info">
              <h2>TechDesk AI</h2>
              <span>Official Docs Agent</span>
            </div>
          </div>
          <button className="btn-icon" onClick={() => setSidebarOpen(false)} title="Close Sidebar">
            <X size={18} />
          </button>
        </div>

        <div className="new-chat-wrapper">
          <button className="btn-new-chat" onClick={createNewSession}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} />
              <span>New Question</span>
            </div>
            <span className="shortcut-pill">Ctrl+K</span>
          </button>
        </div>

        <div className="sidebar-section">
          <div className="section-label">
            <span>Conversations</span>
            <span style={{ fontSize: '10px' }}>{sessions.length}</span>
          </div>

          <div className="session-list">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`session-item ${s.id === currentSessionId ? 'active' : ''}`}
                onClick={() => selectSession(s.id)}
              >
                <div className="session-item-content">
                  <MessageSquare size={14} />
                  <span>{s.title}</span>
                </div>
                <button
                  className="btn-delete-session"
                  onClick={(e) => deleteSession(e, s.id)}
                  title="Delete chat"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <div className="section-label" style={{ marginTop: '12px' }}>
            <span>Agent Tool Suite</span>
          </div>

          <div className="tool-status-list">
            <div className="tool-status-chip">
              <span className="tool-dot" style={{ background: '#38bdf8' }} />
              <BookOpen size={13} />
              <span>Official Docs Search</span>
            </div>
            <div className="tool-status-chip">
              <span className="tool-dot" style={{ background: '#a855f7' }} />
              <Globe size={13} />
              <span>DuckDuckGo Web Search</span>
            </div>
            <div className="tool-status-chip">
              <span className="tool-dot" style={{ background: '#f43f5e' }} />
              <Bug size={13} />
              <span>Stack Trace Debugger</span>
            </div>
            <div className="tool-status-chip">
              <span className="tool-dot" style={{ background: '#eab308' }} />
              <Scale size={13} />
              <span>Tech Comparison Engine</span>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="api-status-pill" style={{ cursor: 'default' }}>
            <div className="status-indicator">
              <span className="indicator-dot active" />
              <span style={{ color: '#fff', fontWeight: 500 }}>
                Gemini 3.8 Flash
              </span>
            </div>
            <Sparkles size={13} color="#818cf8" />
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
            <span>LangChain 1.4 Agent</span>
            <span>Memory: Threaded</span>
          </div>
        </div>
      </aside>

      {/* ────────── MAIN WORKSPACE ────────── */}
      <main className="main-workspace">
        {/* TOPBAR */}
        <header className="topbar">
          <div className="topbar-left">
            {!sidebarOpen && (
              <button className="btn-icon" onClick={() => setSidebarOpen(true)} title="Open Sidebar">
                <Menu size={18} />
              </button>
            )}

            <nav className="nav-tabs">
              <button
                className={`nav-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                <Bot size={14} />
                <span>Chat Agent</span>
              </button>
              <button
                className={`nav-tab-btn ${activeTab === 'debugger' ? 'active' : ''}`}
                onClick={() => setActiveTab('debugger')}
              >
                <Bug size={14} />
                <span>Error Debugger</span>
              </button>
              <button
                className={`nav-tab-btn ${activeTab === 'docs' ? 'active' : ''}`}
                onClick={() => setActiveTab('docs')}
              >
                <BookOpen size={14} />
                <span>Docs Explorer</span>
              </button>
              <button
                className={`nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <Settings size={14} />
                <span>API Settings</span>
              </button>
            </nav>
          </div>

          <div className="topbar-right">
            {activeTab === 'chat' && (
              <button
                className="btn-secondary"
                onClick={() => {
                  if (currentSessionId) {
                    fetch(`/api/clear/${currentSessionId}`, { method: 'DELETE' });
                    setMessages([]);
                    showToast('Conversation memory cleared');
                  }
                }}
                title="Wipe conversation memory"
              >
                <RefreshCw size={13} />
                <span>Reset Memory</span>
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '20px', border: '1px solid rgba(99, 102, 241, 0.25)', fontSize: '12px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }} />
              <span style={{ color: '#e2e8f0', fontWeight: 500 }}>Gemini 3.8 Online</span>
            </div>
          </div>
        </header>

        {/* ────────── TAB CONTENT ────────── */}
        {activeTab === 'chat' && (
          <div className="chat-viewport">
            <div className="message-stream">
              <div className="message-stream-inner">
                {/* Welcome Hero when no messages */}
                {messages.length === 0 && (
                  <div className="welcome-hero">
                    <div className="welcome-logo-halo">
                      <div className="halo-center" style={{ overflow: 'hidden', padding: 0, background: '#0b0d14' }}>
                        <img src="/logo.png" alt="TechDesk Assistant Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div className="halo-ring r1" />
                      <div className="halo-ring r2" />
                    </div>

                    <h1>What technical challenge are we tackling?</h1>
                    <p>
                      I’m your AI technical documentation specialist powered by Google Gemini and LangChain. I search official documentation, diagnose stack traces, and remember your session context.
                    </p>

                    <div className="hero-feature-cards">
                      <div className="feature-pill">
                        <div className="feature-pill-icon">
                          <BookOpen size={16} />
                        </div>
                        <h3>Verified Documentation</h3>
                        <p>Queries Python, MDN, React, GitHub, and Node.js docs directly.</p>
                      </div>
                      <div className="feature-pill">
                        <div className="feature-pill-icon">
                          <Terminal size={16} />
                        </div>
                        <h3>Conversational Memory</h3>
                        <p>Remembers variables, architecture choices, and prior turns.</p>
                      </div>
                      <div className="feature-pill">
                        <div className="feature-pill-icon">
                          <Bug size={16} />
                        </div>
                        <h3>Error Diagnostics</h3>
                        <p>Paste exceptions to get root-cause breakdowns and prevention tips.</p>
                      </div>
                    </div>

                    <div className="quick-prompts-tray">
                      <span className="prompts-label">Try Asking</span>
                      <div className="prompt-chips-grid">
                        {quickPrompts.map((p, idx) => (
                          <button
                            key={idx}
                            className="btn-prompt-chip"
                            onClick={() => handleSendMessage(p.query)}
                          >
                            <Zap size={12} color="#818cf8" />
                            <span>{p.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Message Rows */}
                {messages.map((msg) => (
                  <div key={msg.id} className={`chat-row ${msg.role === 'user' ? 'user' : 'ai'}`}>
                    <div className={`avatar-circle ${msg.role === 'user' ? 'user' : 'ai'}`}>
                      {msg.role === 'user' ? <Code2 size={18} /> : <Bot size={18} />}
                    </div>

                    <div className="chat-bubble-container">
                      <div className={`chat-bubble ${msg.role === 'user' ? 'user-bubble' : 'ai-bubble'}`}>
                        {/* Tool Executions Badge */}
                        {msg.tools_used && msg.tools_used.length > 0 && (
                          <div className="tool-execution-bar">
                            {msg.tools_used.map((t, tidx) => (
                              <div key={tidx} className="tool-run-badge">
                                <Zap size={10} color="#38bdf8" />
                                <span>{t.tool.replace(/_/g, ' ')}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Markdown Content */}
                        <ReactMarkdown
                          components={{
                            code({ node, inline, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              const codeString = String(children).replace(/\n$/, '');
                              if (!inline && match) {
                                return <CodeBlock language={match[1]} value={codeString} />;
                              }
                              return (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      <span className="msg-timestamp">{msg.timestamp}</span>
                    </div>
                  </div>
                ))}

                {/* Agent Thinking Progress Indicator */}
                {isLoading && (
                  <div className="chat-row ai">
                    <div className="avatar-circle ai">
                      <Bot size={18} />
                    </div>
                    <div className="agent-thinking-bar">
                      <div className="thinking-dots">
                        <span className="thinking-dot" />
                        <span className="thinking-dot" />
                        <span className="thinking-dot" />
                      </div>
                      <span className="thinking-text">Consulting documentation and formulating technical solution...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* CHAT INPUT TRAY */}
            <div className="chat-input-wrapper">
              <div className="chat-input-box">
                <textarea
                  ref={textareaRef}
                  className="chat-textarea"
                  placeholder="Ask a technical question, paste code or describe an error... (Shift+Enter for newline)"
                  rows={1}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />
                <div className="chat-input-footer">
                  <div className="input-tools-left">
                    <span className="mode-badge">
                      <ShieldCheck size={11} color="#10b981" />
                      <span>Docs Agent Active</span>
                    </span>
                  </div>

                  <div className="input-actions-right">
                    <span className="char-hint">Enter to send · Shift+Enter newline</span>
                    <button
                      className="btn-send"
                      disabled={!input.trim() || isLoading}
                      onClick={() => handleSendMessage()}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ────────── ERROR DEBUGGER TAB ────────── */}
        {activeTab === 'debugger' && (
          <div className="debugger-container">
            <div className="panel-card">
              <div className="panel-header">
                <h2>
                  <Bug size={20} color="#f43f5e" />
                  <span>Stack Trace & Error Explainer</span>
                </h2>
                <p>Paste any terminal output, compiler error, or traceback to get an immediate root-cause diagnosis and actionable fix.</p>
              </div>

              <textarea
                className="code-input-area"
                placeholder="Paste your error log or stack trace here... e.g. TypeError: Cannot read properties of undefined (reading 'map')"
                value={debuggerInput}
                onChange={(e) => setDebuggerInput(e.target.value)}
              />

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn-primary"
                  onClick={handleRunDebugger}
                  disabled={!debuggerInput.trim() || debuggerLoading}
                >
                  {debuggerLoading ? <RefreshCw size={15} className="spin" /> : <Bug size={15} />}
                  <span>{debuggerLoading ? 'Analyzing...' : 'Diagnose Error'}</span>
                </button>
              </div>
            </div>

            {debuggerOutput && (
              <div className="panel-card">
                <div className="panel-header">
                  <h2>
                    <Check size={18} color="#10b981" />
                    <span>Diagnosis & Solution</span>
                  </h2>
                </div>
                <div className="chat-bubble ai-bubble" style={{ background: '#090c14' }}>
                  <ReactMarkdown>{debuggerOutput}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ────────── DOCS EXPLORER TAB ────────── */}
        {activeTab === 'docs' && (
          <div className="docs-explorer-container">
            <div className="panel-card">
              <div className="panel-header">
                <h2>
                  <BookOpen size={20} color="#38bdf8" />
                  <span>Official Documentation Explorer</span>
                </h2>
                <p>Directly search verified technical documentation sites: Python Docs, MDN Web Docs, React.dev, GitHub Docs, and Node.js.</p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  className="text-input"
                  placeholder="e.g., Python asyncio.TaskGroup, React useActionState, CSS subgrid"
                  value={docsQuery}
                  onChange={(e) => setDocsQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunDocsSearch()}
                />
                <button
                  className="btn-primary"
                  onClick={handleRunDocsSearch}
                  disabled={!docsQuery.trim() || docsLoading}
                >
                  {docsLoading ? <RefreshCw size={15} className="spin" /> : <Search size={15} />}
                  <span>Search</span>
                </button>
              </div>
            </div>

            {docsOutput && (
              <div className="panel-card">
                <div className="panel-header">
                  <h2>
                    <Globe size={18} color="#38bdf8" />
                    <span>Documentation Findings</span>
                  </h2>
                </div>
                <div className="chat-bubble ai-bubble" style={{ background: '#090c14' }}>
                  <ReactMarkdown>{docsOutput}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ────────── AGENT SETTINGS TAB ────────── */}
        {activeTab === 'settings' && (
          <div className="settings-container">
            <div className="panel-card">
              <div className="panel-header">
                <h2>
                  <Settings size={20} color="#a855f7" />
                  <span>Agent Architecture & Model Details</span>
                </h2>
                <p>Technical specifications of the running LangChain Agent and Google Gemini backend.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="tool-status-chip" style={{ justifyContent: 'space-between', padding: '12px 16px' }}>
                  <span style={{ fontWeight: 600 }}>Large Language Model:</span>
                  <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>Google Gemini 1.5 Flash</span>
                </div>
                <div className="tool-status-chip" style={{ justifyContent: 'space-between', padding: '12px 16px' }}>
                  <span style={{ fontWeight: 600 }}>Orchestration Framework:</span>
                  <span style={{ color: '#a855f7', fontFamily: 'monospace' }}>LangChain 1.4 + LangGraph StateGraph</span>
                </div>
                <div className="tool-status-chip" style={{ justifyContent: 'space-between', padding: '12px 16px' }}>
                  <span style={{ fontWeight: 600 }}>Memory Engine:</span>
                  <span style={{ color: '#10b981', fontFamily: 'monospace' }}>MemorySaver (Thread-scoped Checkpointer)</span>
                </div>
                <div className="tool-status-chip" style={{ justifyContent: 'space-between', padding: '12px 16px' }}>
                  <span style={{ fontWeight: 600 }}>Agent Status:</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>Active & Ready</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>



      {/* ────────── TOAST BANNER ────────── */}
      {toast && (
        <div className="toast-banner">
          <Zap size={14} color="#6366f1" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
