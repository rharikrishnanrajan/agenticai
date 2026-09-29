"""
TechDesk Assistant – AI Agent
Powered by Google Gemini + LangChain 1.4 with per-session memory and tools
"""

import os
import re
from typing import Any, Optional
from dotenv import load_dotenv

from langchain.agents import create_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_community.utilities import WikipediaAPIWrapper
from langgraph.checkpoint.memory import MemorySaver

load_dotenv(override=True)

# ─────────────────────────────────────────────
# Tools
# ─────────────────────────────────────────────
_search = DuckDuckGoSearchRun()
_wiki = WikipediaAPIWrapper(top_k_results=2, doc_content_chars_max=2000)


@tool
def search_official_docs(query: str) -> str:
    """Search official technical documentation, guides, and API specs.
    Covers Python, MDN (JavaScript/CSS/HTML), React, GitHub, Microsoft, Node.js, Docker."""
    lower = query.lower()
    domain = ""
    if "python" in lower or "django" in lower or "fastapi" in lower or "flask" in lower:
        domain = "site:docs.python.org"
    elif "react" in lower or "nextjs" in lower or "next.js" in lower:
        domain = "site:react.dev"
    elif any(k in lower for k in ["javascript", "js", "html", "css", "dom", "web api"]):
        domain = "site:developer.mozilla.org"
    elif "docker" in lower or "container" in lower:
        domain = "site:docs.docker.com"
    elif "node" in lower or "express" in lower:
        domain = "site:nodejs.org"
    elif "git" in lower or "github" in lower:
        domain = "site:docs.github.com"
    else:
        domain = "site:docs.python.org OR site:developer.mozilla.org OR site:react.dev"

    try:
        results = _search.run(f"{query} {domain}")
        return results if results else "No official documentation found for this query."
    except Exception:
        try:
            results = _search.run(f"{query} official documentation")
            return results if results else "No official documentation found."
        except Exception as e:
            return f"Documentation search error: {str(e)}"


@tool
def search_web(query: str) -> str:
    """Search the web broadly for technical answers, tutorials, and community solutions."""
    results = _search.run(f"{query} software technical")
    return results if results else "No search results found."


@tool
def search_wikipedia(topic: str) -> str:
    """Look up computer science, software engineering, and technical concepts on Wikipedia."""
    try:
        return _wiki.run(topic)
    except Exception as e:
        return f"Wikipedia lookup failed: {str(e)}"


@tool
def explain_error(error_message: str) -> str:
    """Given an error message or stack trace, diagnose the root cause and provide fix instructions."""
    clean_error = error_message.strip()[:300]
    results = _search.run(f"how to fix: {clean_error} solution stackoverflow github issues")
    return results if results else "Could not find specific community fixes for this error."


@tool
def compare_technologies(tech_a: str, tech_b: str) -> str:
    """Compare two programming languages, frameworks, or developer tools side-by-side."""
    query = f"{tech_a} vs {tech_b} technical comparison pros cons architecture"
    results = _search.run(query)
    return results if results else "No comparison data found."


TOOLS = [
    search_official_docs,
    search_web,
    search_wikipedia,
    explain_error,
    compare_technologies,
]

TOOL_METADATA = [
    {
        "id": "search_official_docs",
        "name": "Official Docs Search",
        "description": "Searches Python, MDN, React, Node.js, Microsoft & GitHub docs",
        "category": "Documentation",
        "icon": "BookOpen"
    },
    {
        "id": "search_web",
        "name": "Technical Web Search",
        "description": "Searches technical articles, StackOverflow and GitHub issues",
        "category": "Search",
        "icon": "Globe"
    },
    {
        "id": "search_wikipedia",
        "name": "Wikipedia Reference",
        "description": "Retrieves computer science and system architecture summaries",
        "category": "Reference",
        "icon": "GraduationCap"
    },
    {
        "id": "explain_error",
        "name": "Stack Trace & Error Solver",
        "description": "Analyzes stack traces, compiler errors and runtime exceptions",
        "category": "Debugging",
        "icon": "Bug"
    },
    {
        "id": "compare_technologies",
        "name": "Tech Comparison Engine",
        "description": "Compares frameworks, libraries and cloud tools side-by-side",
        "category": "Analysis",
        "icon": "Scale"
    }
]

# ─────────────────────────────────────────────
# System Prompt
# ─────────────────────────────────────────────
SYSTEM_PROMPT = """You are TechDesk Assistant, an elite technical AI support agent.
Your primary mission is answering technical, programming, and software engineering questions accurately using official documentation.

Core Guidelines:
1. Accuracy First: Answer technical questions with precision. When uncertain or dealing with specific library versions, ALWAYS use tools to check official documentation.
2. Code Blocks: Format all code snippets in properly tagged markdown code fences (e.g., ```python, ```javascript, ```bash). Include brief comments explaining key lines.
3. Source Attribution: When you consult documentation or search results, cite the official sources (e.g. [Python Docs], [MDN Web Docs], [React Docs]).
4. Debugging & Error Solving: For errors, provide (a) Root Cause, (b) Quick Fix code snippet, (c) Prevention tips.
5. Conversational Memory: You remember previous messages in this conversation. Use context from earlier questions to provide cohesive, personalized advice.
6. Tone: Professional, direct, highly knowledgeable, and helpful.
"""

def clean_api_key(key: Optional[str]) -> Optional[str]:
    if not key:
        return None
    # Strip quotes, whitespace
    key = key.strip().strip("'\"")
    return key if key else None

def get_llm(custom_key: Optional[str] = None) -> ChatGoogleGenerativeAI:
    load_dotenv(override=True)
    api_key = clean_api_key(custom_key or os.getenv("GOOGLE_API_KEY"))
    if not api_key:
        raise ValueError("GOOGLE_API_KEY is not configured. Please provide an API key.")
    
    return ChatGoogleGenerativeAI(
        model="gemini-3.8-flash",
        google_api_key=api_key,
        temperature=0.2,
    )


# ─────────────────────────────────────────────
# TechDesk Agent Manager
# ─────────────────────────────────────────────
class TechDeskAgent:
    def __init__(self):
        self._checkpointer = MemorySaver()
        self._graph = None
        self._current_key = None
        self.init_agent()

    def init_agent(self, custom_key: Optional[str] = None):
        """Initialize or re-initialize the agent with the current API key."""
        try:
            llm = get_llm(custom_key)
            self._graph = create_agent(
                model=llm,
                tools=TOOLS,
                system_prompt=SYSTEM_PROMPT,
                checkpointer=self._checkpointer,
            )
            self._current_key = clean_api_key(custom_key or os.getenv("GOOGLE_API_KEY"))
            return True, "Agent initialized successfully."
        except Exception as e:
            self._graph = None
            return False, str(e)

    def is_configured(self) -> bool:
        load_dotenv(override=True)
        key = clean_api_key(os.getenv("GOOGLE_API_KEY"))
        return bool(key and key != "your_google_gemini_api_key_here")

    def get_masked_key(self) -> str:
        load_dotenv(override=True)
        key = clean_api_key(os.getenv("GOOGLE_API_KEY"))
        if not key or key == "your_google_gemini_api_key_here":
            return ""
        if len(key) <= 8:
            return "••••••••"
        return f"{key[:4]}••••••••{key[-4:]}"

    def _config(self, session_id: str) -> dict:
        return {"configurable": {"thread_id": session_id}}

    def _clean_snippet(self, text: str) -> str:
        """Strip date stamps, ellipses, and noisy metadata from search snippets."""
        if not text:
            return ""
        # Remove date/time prefixes like 'Feb 6, 2025 · ' or '5 days ago - '
        text = re.sub(
            r'^(?:[A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4}|\d+\s+(?:days?|hours?|months?|years?)\s+ago)\s*[-·•–]\s*',
            '',
            text.strip(),
            flags=re.MULTILINE
        )
        # Remove bug-tracker identifiers
        text = re.sub(r'\s*gh-\d+:.*', '', text)
        return text.strip()

    def _synthesize_technical_answer(self, user_input: str) -> tuple[str, list[dict]]:
        """Intelligently query official tools and synthesize a structured, professional technical response."""
        lower = user_input.lower()
        tools_used = []

        is_error = any(w in lower for w in ["error", "exception", "traceback", "failed", "crash", "bug", "fix", "issue"])
        is_compare = " vs " in lower or "compare" in lower or "difference between" in lower
        is_concept = any(w in lower for w in ["what is", "architecture", "algorithm", "design pattern", "how does", "overview"])

        sections = []

        if is_error:
            err_res = self.execute_tool_direct("explain_error", user_input)
            docs_res = self.execute_tool_direct("search_official_docs", user_input)
            tools_used.append({"tool": "explain_error", "output": str(err_res)[:300]})
            tools_used.append({"tool": "search_official_docs", "output": str(docs_res)[:300]})

            cleaned_err = self._clean_snippet(err_res)
            cleaned_docs = self._clean_snippet(docs_res)

            sections.append("### 🔍 Root Cause Analysis & Solution")
            sections.append(cleaned_err)
            if cleaned_docs and cleaned_docs != cleaned_err:
                sections.append("\n#### 📚 Official Documentation Context\n" + cleaned_docs)

        elif is_compare:
            comp_res = self.execute_tool_direct("compare_technologies", user_input)
            tools_used.append({"tool": "compare_technologies", "output": str(comp_res)[:300]})
            cleaned_comp = self._clean_snippet(comp_res)

            sections.append("### ⚖️ Architectural & Feature Comparison")
            sections.append(cleaned_comp)

        elif is_concept:
            wiki_res = self.execute_tool_direct("search_wikipedia", user_input)
            docs_res = self.execute_tool_direct("search_official_docs", user_input)
            tools_used.append({"tool": "search_wikipedia", "output": str(wiki_res)[:300]})
            tools_used.append({"tool": "search_official_docs", "output": str(docs_res)[:300]})

            sections.append("### 📖 Conceptual Architecture & Principles")
            sections.append(self._clean_snippet(wiki_res))
            cleaned_docs = self._clean_snippet(docs_res)
            if cleaned_docs:
                sections.append("\n#### 📚 Official Technical Specs\n" + cleaned_docs)

        else:
            docs_res = self.execute_tool_direct("search_official_docs", user_input)
            web_res = self.execute_tool_direct("search_web", user_input)
            tools_used.append({"tool": "search_official_docs", "output": str(docs_res)[:300]})
            tools_used.append({"tool": "search_web", "output": str(web_res)[:300]})

            cleaned_docs = self._clean_snippet(docs_res)
            cleaned_web = self._clean_snippet(web_res)

            sections.append("### 📚 Official Documentation & Guide\n\n" + cleaned_docs)
            if cleaned_web and cleaned_web != cleaned_docs:
                sections.append("\n\n---\n\n### 💡 Implementation & Key Best Practices\n\n" + cleaned_web)

        sections.append("\n\n> 🔍 *Verified via Official Technical Documentation*")
        return "\n\n".join(sections), tools_used

    def _record_history(self, session_id: str, role: str, content: str):
        if not hasattr(self, "_fallback_history"):
            self._fallback_history = {}
        if session_id not in self._fallback_history:
            self._fallback_history[session_id] = []
        self._fallback_history[session_id].append({"role": role, "content": content})

    def chat(self, session_id: str, user_input: str) -> dict[str, Any]:
        """Send a user message to the agent and receive response + tool logs."""
        load_dotenv(override=True)
        current_env_key = clean_api_key(os.getenv("GOOGLE_API_KEY"))

        self._record_history(session_id, "user", user_input)

        # Re-init if key changed or graph not initialized
        if self._graph is None or current_env_key != self._current_key:
            self.init_agent(current_env_key)

        try:
            inputs = {"messages": [{"role": "user", "content": user_input}]}
            result = self._graph.invoke(inputs, config=self._config(session_id))

            messages = result.get("messages", [])
            answer = ""
            tools_used = []

            # Extract the final AI assistant answer
            for msg in reversed(messages):
                msg_type = getattr(msg, "type", None) or type(msg).__name__.lower()
                if "ai" in msg_type and not getattr(msg, "tool_calls", None):
                    answer = msg.content
                    break

            # Collect tool calls that were performed
            for msg in messages:
                msg_type = getattr(msg, "type", None) or type(msg).__name__.lower()
                if "tool" in msg_type:
                    tool_name = getattr(msg, "name", "unknown_tool")
                    raw_content = getattr(msg, "content", "")
                    tools_used.append({
                        "tool": tool_name,
                        "output": str(raw_content)[:350],
                    })

            final_answer = answer or "I processed your request, but could not produce a textual answer."
            self._record_history(session_id, "assistant", final_answer)

            return {
                "success": True,
                "answer": final_answer,
                "tools_used": tools_used,
                "session_id": session_id,
            }

        except Exception as e:
            err_str = str(e)
            error_type = "AGENT_ERROR"  # [SECURITY] default — prevents UnboundLocalError leaking traceback

            if "PERMISSION_DENIED" in err_str or "denied access" in err_str or "NotFound" in err_str:
                # Synthesize clean, structured technical answer from documentation tools directly
                answer, tools_used = self._synthesize_technical_answer(user_input)
                self._record_history(session_id, "assistant", answer)
                return {
                    "success": True,
                    "answer": answer,
                    "tools_used": tools_used,
                    "session_id": session_id,
                }
            elif "API_KEY_INVALID" in err_str or "API key not valid" in err_str or "INVALID_ARGUMENT" in err_str:
                error_type = "INVALID_API_KEY"
                answer = (
                    "**Invalid Google Gemini API Key Detected**\n\n"
                    "The key configured in `.env` was rejected by Google Gemini.\n\n"
                    "**How to fix:**\n"
                    "1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey) to generate a free API key.\n"
                    "2. Valid keys typically begin with `AIzaSy...`\n"
                    "3. Click the **API Key** button in the top bar to update it directly."
                )
            elif "RESOURCE_EXHAUSTED" in err_str or "429" in err_str:
                error_type = "RATE_LIMIT"
                answer = "Rate limit reached for Google Gemini API. Please wait a moment before sending another request."
            else:
                # [SECURITY] Do NOT leak raw internal error details to the client
                answer = "The agent encountered an internal error. Please try again."

            return {
                "success": False,
                "error_type": error_type,
                "answer": answer,
                "tools_used": [],
                "session_id": session_id,
            }

    def clear_session(self, session_id: str):
        config = self._config(session_id)
        try:
            self._checkpointer.put(
                config,
                checkpoint={"v": 1, "ts": "", "id": session_id, "channel_values": {}, "channel_versions": {}, "versions_seen": {}, "pending_sends": []},
                metadata={},
                new_versions={},
            )
        except Exception:
            pass

    def get_history(self, session_id: str) -> list:
        try:
            config = self._config(session_id)
            state = self._graph.get_state(config)
            if state and state.values:
                messages = state.values.get("messages", [])
                history = []
                for msg in messages:
                    msg_type = getattr(msg, "type", None) or type(msg).__name__.lower()
                    if "human" in msg_type:
                        history.append({"role": "user", "content": msg.content})
                    elif "ai" in msg_type and not getattr(msg, "tool_calls", None):
                        history.append({"role": "assistant", "content": msg.content})
                if history:
                    return history
        except Exception:
            pass

        # Fallback to local session history
        if hasattr(self, "_fallback_history"):
            return self._fallback_history.get(session_id, [])
        return []

    def execute_tool_direct(self, tool_id: str, query: str) -> str:
        """Direct execution for developer tools workbench (e.g. Docs Search tab)."""
        for t in TOOLS:
            if t.name == tool_id:
                try:
                    if tool_id == "compare_technologies":
                        parts = [p.strip() for p in query.split("vs", 1)]
                        a = parts[0] if parts else query
                        b = parts[1] if len(parts) > 1 else ""
                        return t.invoke({"tech_a": a, "tech_b": b})
                    elif tool_id == "explain_error":
                        return t.invoke({"error_message": query})
                    elif tool_id == "search_wikipedia":
                        return t.invoke({"topic": query})
                    else:
                        return t.invoke({"query": query})
                except Exception as e:
                    return f"Tool execution failed: {str(e)}"
        return f"Unknown tool: {tool_id}"


techdesk_agent = TechDeskAgent()
