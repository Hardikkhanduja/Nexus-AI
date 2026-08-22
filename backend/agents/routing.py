"""
Centralized Predefined Model Routing Configuration for Nexus AI.
Maps user query categories across active providers: Perplexity, Gemini, Groq (Llama), NVIDIA NIM (Qwen/Nemotron).
"""

from typing import Dict, Any

CATEGORY_ROUTING: Dict[str, Dict[str, Dict[str, str]]] = {
    "coding_programming": {
        "fact_checker": {"provider": "perplexity", "model": "sonar", "fallback": "groq"},
        "optimist": {"provider": "nvidia", "model": "qwen/qwen2.5-coder-32b-instruct", "fallback": "gemini"},
        "skeptic": {"provider": "groq", "model": "llama-3.3-70b-versatile", "fallback": "perplexity"}
    },
    "mathematics_logic": {
        "fact_checker": {"provider": "nvidia", "model": "qwen/qwen2.5-coder-32b-instruct", "fallback": "groq"},
        "optimist": {"provider": "gemini", "model": "gemini-1.5-flash", "fallback": "perplexity"},
        "skeptic": {"provider": "groq", "model": "llama-3.3-70b-versatile", "fallback": "perplexity"}
    },
    "research_fact_finding": {
        "fact_checker": {"provider": "perplexity", "model": "sonar", "fallback": "gemini"},
        "optimist": {"provider": "gemini", "model": "gemini-1.5-flash", "fallback": "groq"},
        "skeptic": {"provider": "nvidia", "model": "nvidia/nemotron-4-340b-instruct", "fallback": "groq"}
    },
    "creative_writing": {
        "fact_checker": {"provider": "gemini", "model": "gemini-1.5-flash", "fallback": "perplexity"},
        "optimist": {"provider": "groq", "model": "llama-3.3-70b-versatile", "fallback": "gemini"},
        "skeptic": {"provider": "perplexity", "model": "sonar", "fallback": "groq"}
    },
    "business_strategy": {
        "fact_checker": {"provider": "perplexity", "model": "sonar", "fallback": "groq"},
        "optimist": {"provider": "nvidia", "model": "nvidia/nemotron-4-340b-instruct", "fallback": "gemini"},
        "skeptic": {"provider": "groq", "model": "llama-3.3-70b-versatile", "fallback": "gemini"}
    },
    "education_learning": {
        "fact_checker": {"provider": "perplexity", "model": "sonar", "fallback": "groq"},
        "optimist": {"provider": "gemini", "model": "gemini-1.5-flash", "fallback": "groq"},
        "skeptic": {"provider": "groq", "model": "llama-3.3-70b-versatile", "fallback": "perplexity"}
    },
    "science_engineering": {
        "fact_checker": {"provider": "nvidia", "model": "qwen/qwen2.5-coder-32b-instruct", "fallback": "perplexity"},
        "optimist": {"provider": "groq", "model": "llama-3.3-70b-versatile", "fallback": "gemini"},
        "skeptic": {"provider": "perplexity", "model": "sonar", "fallback": "groq"}
    },
    "data_analysis": {
        "fact_checker": {"provider": "perplexity", "model": "sonar", "fallback": "groq"},
        "optimist": {"provider": "gemini", "model": "gemini-1.5-flash", "fallback": "nvidia"},
        "skeptic": {"provider": "groq", "model": "llama-3.3-70b-versatile", "fallback": "perplexity"}
    },
    "career_professional": {
        "fact_checker": {"provider": "perplexity", "model": "sonar", "fallback": "gemini"},
        "optimist": {"provider": "groq", "model": "llama-3.3-70b-versatile", "fallback": "gemini"},
        "skeptic": {"provider": "gemini", "model": "gemini-1.5-flash", "fallback": "perplexity"}
    },
    "personal_advice": {
        "fact_checker": {"provider": "perplexity", "model": "sonar", "fallback": "gemini"},
        "optimist": {"provider": "groq", "model": "llama-3.3-70b-versatile", "fallback": "gemini"},
        "skeptic": {"provider": "gemini", "model": "gemini-1.5-flash", "fallback": "perplexity"}
    },
    "current_affairs_news": {
        "fact_checker": {"provider": "perplexity", "model": "sonar", "fallback": "gemini"},
        "optimist": {"provider": "gemini", "model": "gemini-1.5-flash", "fallback": "groq"},
        "skeptic": {"provider": "groq", "model": "llama-3.3-70b-versatile", "fallback": "perplexity"}
    },
    "product_comparison": {
        "fact_checker": {"provider": "perplexity", "model": "sonar", "fallback": "groq"},
        "optimist": {"provider": "gemini", "model": "gemini-1.5-flash", "fallback": "nvidia"},
        "skeptic": {"provider": "groq", "model": "llama-3.3-70b-versatile", "fallback": "perplexity"}
    },
    "general_knowledge": {
        "fact_checker": {"provider": "perplexity", "model": "sonar", "fallback": "gemini"},
        "optimist": {"provider": "gemini", "model": "gemini-1.5-flash", "fallback": "groq"},
        "skeptic": {"provider": "groq", "model": "llama-3.3-70b-versatile", "fallback": "nvidia"}
    },
    "planning_decision_making": {
        "fact_checker": {"provider": "perplexity", "model": "sonar", "fallback": "groq"},
        "optimist": {"provider": "nvidia", "model": "nvidia/nemotron-4-340b-instruct", "fallback": "gemini"},
        "skeptic": {"provider": "groq", "model": "llama-3.3-70b-versatile", "fallback": "perplexity"}
    }
}

DEFAULT_FALLBACK_CATEGORY = "general_knowledge"

def get_routing_for_category(category: str) -> Dict[str, Dict[str, str]]:
    """Return routing panel configuration for category using active keys."""
    cat_clean = category.lower().strip()
    return CATEGORY_ROUTING.get(cat_clean, CATEGORY_ROUTING[DEFAULT_FALLBACK_CATEGORY])
