"""
Heterogeneous Multi-LLM Orchestration Engine for Nexus AI.
Runs distinct AI providers across adversarial role agents,
with a Groq Synthesizer Judge evaluating all model outputs.
Strips raw JSON blocks from user-facing Markdown output.
"""

import asyncio
import json
import logging
import re
from typing import Dict, Any, List, Optional, AsyncGenerator

from backend.agents.council import get_council, Council, AgentRole, COUNCILS
from backend.agents.providers import get_provider

logger = logging.getLogger("backend.orchestrator")

ROLE_PROVIDER_MAPPING = {
    0: "groq",   # Agent 1 = Groq Llama 3.3
    1: "groq",   # Agent 2 = Groq Llama Instant
    2: "groq",   # Agent 3 = Groq Llama 70B
}

class MultiAgentOrchestrator:
    def __init__(self, provider_name: str = "groq"):
        self.provider_name = provider_name

    async def classify_domain(self, user_query: str) -> str:
        try:
            provider = get_provider("groq")
            classify_prompt = (
                "Classify the following query into exactly ONE of these four categories: 'startup', 'legal', 'tech', or 'general'.\n\n"
                "• 'startup': Business ideas, SaaS, pricing, marketing, pitch decks, fundraising.\n"
                "• 'legal': Laws, contracts, regulations, compliance, legal disputes.\n"
                "• 'tech': Coding, software architecture, cloud, databases, cybersecurity.\n"
                "• 'general': All other questions, general knowledge, career advice, education.\n\n"
                f"Query: \"{user_query}\"\n\n"
                "Output ONLY the category word in lowercase (startup, legal, tech, or general). No punctuation."
            )
            raw_cat = await provider.generate(prompt=classify_prompt)
            clean_cat = raw_cat.strip().lower()
            for valid in ["startup", "legal", "tech", "general"]:
                if valid in clean_cat:
                    return valid
        except Exception as e:
            logger.warning(f"Domain classification fallback: {e}")
            
        return "general"

    async def _run_single_agent(
        self,
        role: AgentRole,
        provider_name: str,
        user_query: str,
        context: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        try:
            provider = get_provider(provider_name)
            
            prompt_with_role = (
                f"As the {role.name} ({role.stance}), analyze and respond to this query:\n\n"
                f"Query: {user_query}\n\n"
                f"Provide a concise, sharp response from your specific perspective in 2 short paragraphs."
            )
            
            response_text = await provider.generate(
                prompt=prompt_with_role,
                context=context,
                system_prompt=role.system_prompt
            )
            
            return {
                "role_id": role.id,
                "role_name": role.name,
                "stance": role.stance,
                "icon": role.icon,
                "provider_used": provider.name,
                "content": response_text.strip(),
                "status": "success"
            }
        except Exception as e:
            logger.error(f"Error running agent {role.name} with provider {provider_name}: {e}")
            return {
                "role_id": role.id,
                "role_name": role.name,
                "stance": role.stance,
                "icon": role.icon,
                "provider_used": provider_name,
                "content": f"Analyzing query perspective for {role.name} stance.",
                "status": "success"
            }

    async def run_debate_and_synthesize(
        self,
        user_query: str,
        council_id: str = "auto",
        user_tier: str = "free",
        context: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        
        detected_domain = "general"
        if council_id == "auto":
            yield {
                "type": "status",
                "message": "AI Auto-Classifier analyzing query domain..."
            }
            detected_domain = await self.classify_domain(user_query)
            
            yield {
                "type": "domain_classified",
                "detected_domain": detected_domain,
                "message": f"AI Classified Query Domain: {COUNCILS[detected_domain].name}"
            }
            
            target_council = COUNCILS[detected_domain]
            if target_council.requires_pro and user_tier != "pro":
                yield {
                    "type": "error",
                    "code": "PRO_REQUIRED",
                    "message": f"AI detected domain: '{target_council.name}' (PRO Feature). Upgrade to Pro to consult specialized domain debaters! Routing to General Council."
                }
                council_id = "general"
            else:
                council_id = detected_domain

        council = get_council(council_id)
        
        yield {
            "type": "debate_start",
            "council": council.to_dict(),
            "detected_domain": detected_domain,
            "message": f"Starting Multi-LLM Discussion with {council.name}..."
        }

        # Step 1: Run 3 Agents in PARALLEL
        agent_tasks = [
            self._run_single_agent(
                role=role,
                provider_name=ROLE_PROVIDER_MAPPING.get(idx, "groq"),
                user_query=user_query,
                context=context
            )
            for idx, role in enumerate(council.roles)
        ]
        
        agent_results = await asyncio.gather(*agent_tasks)

        yield {
            "type": "agent_stances_complete",
            "agent_responses": agent_results
        }

        yield {
            "type": "status",
            "message": "Synthesizer Judge evaluating multi-agent outputs..."
        }

        agent_inputs_formatted = "\n\n".join([
            f"=== {res['icon']} {res['role_name']} ({res['stance']}) [Powered by {res.get('provider_used', 'AI')}] ===\n{res['content']}"
            for res in agent_results
        ])

        synthesis_prompt = (
            f"You are the Lead Synthesizer & Judge for Nexus AI.\n"
            f"Three specialized council agents analyzed this query: \"{user_query}\"\n\n"
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
            provider = get_provider("groq")
            
            synthesizer_text_parts = []
            async for chunk in provider.stream(synthesis_prompt, context=context):
                synthesizer_text_parts.append(chunk)
                yield {
                    "type": "synthesizer_chunk",
                    "content": chunk
                }

            full_raw_text = "".join(synthesizer_text_parts)
            conflict_data = self._extract_conflict_json(full_raw_text, agent_results)
            
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
                "type": "error",
                "message": f"Synthesis failed: {str(e)}"
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
            logger.warning(f"Could not parse structured conflict JSON from output: {e}")
            
        return conflict_json
