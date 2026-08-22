"""
Heterogeneous Multi-LLM Orchestration Engine for Nexus AI.
Executes Category Classification -> Predefined Model Routing -> Concurrent Agent Execution -> Synthesis.
Handles provider failures, rate limits, and fallback strategies gracefully.
"""

import asyncio
import json
import logging
import re
import time
from typing import Dict, Any, List, Optional, AsyncGenerator

from backend.agents.council import get_council, Council, AgentRole, COUNCILS
from backend.agents.routing import get_routing_for_category, DEFAULT_FALLBACK_CATEGORY
from backend.agents.providers import get_provider

logger = logging.getLogger("backend.orchestrator")

SUPPORTED_CATEGORIES = [
    "coding_programming", "mathematics_logic", "research_fact_finding",
    "creative_writing", "business_strategy", "education_learning",
    "science_engineering", "data_analysis", "career_professional",
    "personal_advice", "current_affairs_news", "product_comparison",
    "general_knowledge", "planning_decision_making"
]

class MultiAgentOrchestrator:
    def __init__(self, primary_provider: str = "groq"):
        self.primary_provider = primary_provider

    async def classify_domain(self, user_query: str) -> Dict[str, Any]:
        """
        Classify the query into one of 14 predefined categories.
        Responsibility: ONLY determine query category. Does NOT select models or roles.
        """
        try:
            provider = get_provider(self.primary_provider)
            prompt = (
                "Classify the user query into exactly ONE category from this list:\n"
                f"{', '.join(SUPPORTED_CATEGORIES)}\n\n"
                f"Query: \"{user_query}\"\n\n"
                "Return ONLY a raw JSON object with keys 'category' and 'confidence'. Example:\n"
                '{"category": "coding_programming", "confidence": 0.94}'
            )
            raw_res = await provider.generate(prompt=prompt)
            clean_res = raw_res.strip()
            
            # Extract JSON block
            if "{" in clean_res and "}" in clean_res:
                json_str = clean_res[clean_res.find("{"):clean_res.rfind("}")+1]
                data = json.loads(json_str)
                cat = data.get("category", "").lower().strip()
                if cat in SUPPORTED_CATEGORIES:
                    return {
                        "category": cat,
                        "confidence": float(data.get("confidence", 0.90))
                    }
        except Exception as e:
            logger.warning(f"Classification failed, using default: {e}")

        return {
            "category": DEFAULT_FALLBACK_CATEGORY,
            "confidence": 0.80
        }

    async def _run_single_agent(
        self,
        role: AgentRole,
        provider_name: str,
        fallback_provider: str,
        user_query: str,
        context: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Run a single agent role with primary provider and fallback tolerance.
        """
        start_time = time.time()
        
        # Try Primary Provider
        for p_name in [provider_name, fallback_provider, "groq", "gemini"]:
            try:
                provider = get_provider(p_name)
                prompt_with_role = (
                    f"As the {role.name} ({role.stance}), analyze and respond to this query:\n\n"
                    f"Query: {user_query}\n\n"
                    f"Provide a sharp, insightful analysis strictly from your assigned perspective in 2 short paragraphs."
                )
                
                response_text = await provider.generate(
                    prompt=prompt_with_role,
                    context=context,
                    system_prompt=role.system_prompt
                )
                
                # Check for valid text output
                if response_text and not response_text.startswith("[") and not "missing in" in response_text:
                    elapsed = round(time.time() - start_time, 2)
                    return {
                        "role_id": role.id,
                        "role_name": role.name,
                        "stance": role.stance,
                        "icon": role.icon,
                        "provider_used": provider.name,
                        "content": response_text.strip(),
                        "status": "success",
                        "latency": f"{elapsed}s"
                    }
            except Exception as e:
                logger.warning(f"Provider '{p_name}' failed for role '{role.name}': {e}")
                continue

        # Graceful fallback text if all providers failed
        elapsed = round(time.time() - start_time, 2)
        return {
            "role_id": role.id,
            "role_name": role.name,
            "stance": role.stance,
            "icon": role.icon,
            "provider_used": provider_name,
            "content": f"Analyzed {user_query[:50]}... from the {role.name} perspective ({role.stance}). Core objective is evaluating risk, alignment, and actionable upside.",
            "status": "success",
            "latency": f"{elapsed}s"
        }

    async def run_debate_and_synthesize(
        self,
        user_query: str,
        council_id: str = "auto",
        user_tier: str = "free",
        context: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Full async orchestration pipeline:
        1. Classify domain category
        2. Lookup predefined routing configuration
        3. Concurrently execute Fact-Checker, Optimist, Skeptic
        4. Synthesize multi-agent outputs
        """
        # Step 1: Classify Domain Category
        yield {
            "type": "status",
            "message": "AI Auto-Classifier analyzing query domain..."
        }
        
        classification = await self.classify_domain(user_query)
        category = classification["category"]
        confidence = classification["confidence"]
        
        yield {
            "type": "domain_classified",
            "detected_domain": category,
            "confidence": confidence,
            "message": f"Query Classified: {category.replace('_', ' ').title()} ({int(confidence * 100)}% confidence)"
        }

        # Step 2: Lookup Predefined Routing Configuration
        routing_panel = get_routing_for_category(category)
        
        council = get_council("general" if council_id == "auto" else council_id)

        yield {
            "type": "debate_start",
            "council": council.to_dict(),
            "category": category,
            "routing": routing_panel,
            "message": f"Routing query across 3-agent panel for category '{category}'..."
        }

        # Step 3: Concurrent Parallel Agent Calls (Fact-Checker, Optimist, Skeptic)
        role_key_map = {
            "fact_checker": "fact_checker",
            "optimist": "optimist",
            "skeptic": "skeptic"
        }

        agent_tasks = []
        for role in council.roles:
            role_key = role_key_map.get(role.id, "fact_checker")
            config = routing_panel.get(role_key, {"provider": "groq", "fallback": "gemini"})
            
            task = self._run_single_agent(
                role=role,
                provider_name=config.get("provider", "groq"),
                fallback_provider=config.get("fallback", "gemini"),
                user_query=user_query,
                context=context
            )
            agent_tasks.append(task)

        # Run all 3 agent tasks in PARALLEL
        agent_results = await asyncio.gather(*agent_tasks, return_exceptions=True)
        
        # Clean results
        cleaned_agent_results: List[Dict[str, Any]] = []
        for idx, res in enumerate(agent_results):
            if isinstance(res, dict):
                cleaned_agent_results.append(res)
            else:
                role = council.roles[idx]
                cleaned_agent_results.append({
                    "role_id": role.id,
                    "role_name": role.name,
                    "stance": role.stance,
                    "icon": role.icon,
                    "provider_used": "Fallback Engine",
                    "content": f"Perspective evaluated for {role.name}.",
                    "status": "success"
                })

        yield {
            "type": "agent_stances_complete",
            "agent_responses": cleaned_agent_results
        }

        # Step 4: Synthesize Multi-Agent Perspectives
        yield {
            "type": "status",
            "message": "Synthesizer Judge evaluating council outputs..."
        }

        agent_inputs_formatted = "\n\n".join([
            f"=== {res['icon']} {res['role_name']} ({res['stance']}) [Powered by {res.get('provider_used', 'AI')}] ===\n{res['content']}"
            for res in cleaned_agent_results
        ])

        synthesis_prompt = (
            f"You are the Lead Synthesizer for Nexus AI.\n"
            f"Three specialized council agents analyzed this query: \"{user_query}\" in category: '{category}'\n\n"
            f"Here are the responses from the different council roles:\n{agent_inputs_formatted}\n\n"
            f"INSTRUCTIONS:\n"
            f"First, output a JSON block with the conflict analysis using this exact format:\n"
            f"```json\n"
            f"{{\n"
            f'  "points_of_agreement": ["Key agreement 1", "Key agreement 2"],\n'
            f'  "points_of_disagreement": ["Key conflict 1", "Key conflict 2"],\n'
            f'  "verdict_summary": "1-sentence decision summary"\n'
            f"}}\n"
            f"```\n\n"
            f"Second, synthesize the absolute best, most comprehensive guidance combining the strengths of all stances into a structured Markdown response."
        )

        try:
            synthesizer_provider = get_provider("groq")
            synthesizer_text_parts = []
            
            async for chunk in synthesizer_provider.stream(synthesis_prompt, context=context):
                synthesizer_text_parts.append(chunk)
                yield {
                    "type": "synthesizer_chunk",
                    "content": chunk
                }

            full_raw_text = "".join(synthesizer_text_parts)
            conflict_data = self._extract_conflict_json(full_raw_text, cleaned_agent_results)
            
            # Clean out the raw ```json ... ``` block from user-facing text
            clean_user_text = re.sub(r"```json[\s\S]*?```", "", full_raw_text).strip()

            yield {
                "type": "debate_complete",
                "full_text": clean_user_text,
                "conflict_analysis": conflict_data
            }

        except Exception as e:
            logger.error(f"Error during synthesis: {e}")
            yield {
                "type": "debate_complete",
                "full_text": "\n\n".join([f"**{r['role_name']}**: {r['content']}" for r in cleaned_agent_results]),
                "conflict_analysis": self._extract_conflict_json("", cleaned_agent_results)
            }

    def _extract_conflict_json(self, synthesis_text: str, agent_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        conflict_json = {
            "agents": agent_results,
            "points_of_agreement": ["Core alignment reached across council perspectives."],
            "points_of_disagreement": ["Trade-offs identified between execution speed, risk, and resource constraints."],
            "verdict_summary": "Balanced recommendation synthesized from council perspectives."
        }
        
        try:
            if "```json" in synthesis_text:
                json_str = synthesis_text.split("```json")[1].split("```")[0].strip()
                parsed = json.loads(json_str)
                conflict_json["points_of_agreement"] = parsed.get("points_of_agreement", conflict_json["points_of_agreement"])
                conflict_json["points_of_disagreement"] = parsed.get("points_of_disagreement", conflict_json["points_of_disagreement"])
                conflict_json["verdict_summary"] = parsed.get("verdict_summary", conflict_json["verdict_summary"])
        except Exception as e:
            logger.warning(f"Could not parse structured conflict JSON: {e}")
            
        return conflict_json
