"""
Domain Councils and Adversarial Role Definitions for Nexus AI.
"""

from typing import List, Dict, Any, Optional

class AgentRole:
    def __init__(self, id: str, name: str, stance: str, icon: str, system_prompt: str):
        self.id = id
        self.name = name
        self.stance = stance
        self.icon = icon
        self.system_prompt = system_prompt

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "stance": self.stance,
            "icon": self.icon,
        }

class Council:
    def __init__(self, id: str, name: str, description: str, requires_pro: bool, roles: List[AgentRole]):
        self.id = id
        self.name = name
        self.description = description
        self.requires_pro = requires_pro
        self.roles = roles

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "requiresPro": self.requires_pro,
            "roles": [r.to_dict() for r in self.roles],
        }

# Defined Domain Councils
COUNCILS: Dict[str, Council] = {
    "general": Council(
        id="general",
        name="General Conversation Council",
        description="Balanced 3-way conversation featuring optimistic, skeptical, and empirical perspectives.",
        requires_pro=False, # FREE Tier accessible
        roles=[
            AgentRole(
                id="optimist",
                name="Optimist",
                stance="Encouraging & Visionary",
                icon="trending-up",
                system_prompt=(
                    "You are the Optimist agent in a multi-agent council. Your goal is to highlight opportunities, "
                    "positive potential, creative solutions, and upside value in the query. Be constructive and enthusiastic, "
                    "while remaining helpful."
                )
            ),
            AgentRole(
                id="skeptic",
                name="Skeptic",
                stance="Critical & Risk-Focused",
                icon="shield-alert",
                system_prompt=(
                    "You are the Skeptic agent in a multi-agent council. Your goal is to challenge assumptions, "
                    "identify potential pitfalls, hidden risks, and flaws in reasoning. Be rigorous, critical, and questioning."
                )
            ),
            AgentRole(
                id="fact_checker",
                name="Fact-Checker",
                stance="Empirical & Data-Driven",
                icon="check-circle",
                system_prompt=(
                    "You are the Fact-Checker agent in a multi-agent council. Your goal is to provide pragmatic, "
                    "evidence-based facts, historical context, statistics, and verifiable realities. Stay objective and neutral."
                )
            )
        ]
    ),
    "startup": Council(
        id="startup",
        name="Startup & VC Council",
        description="Evaluate business ideas from Product, Investor, and Market Analyst stances.",
        requires_pro=True, # PRO Tier required
        roles=[
            AgentRole(
                id="product_visionary",
                name="Product Visionary",
                stance="User Value & Growth",
                icon="rocket",
                system_prompt=(
                    "You are a startup Product Visionary. Evaluate the idea focusing on user experience, "
                    "growth loops, product-market fit potential, and disruptive innovation."
                )
            ),
            AgentRole(
                id="vc_investor",
                name="VC Investor",
                stance="ROIC & Unit Economics",
                icon="briefcase",
                system_prompt=(
                    "You are a ruthless Venture Capitalist. Evaluate moat, market size (TAM), unit economics, "
                    "customer acquisition cost (CAC), and scalability risks."
                )
            ),
            AgentRole(
                id="market_analyst",
                name="Market Analyst",
                stance="Competitive Intelligence",
                icon="bar-chart",
                system_prompt=(
                    "You are a Market Analyst. Examine existing competitors, industry trends, regulatory hurdles, "
                    "and go-to-market execution requirements."
                )
            )
        ]
    ),
    "legal": Council(
        id="legal",
        name="Legal & Compliance Council",
        description="Examine issues through Defense, Regulatory, and Compliance viewpoints.",
        requires_pro=True, # PRO Tier required
        roles=[
            AgentRole(
                id="defense_counsel",
                name="Defense Perspective",
                stance="Rights & Argumentation",
                icon="scale",
                system_prompt="Analyze legal questions advocating for rights, creative defense arguments, and precedents."
            ),
            AgentRole(
                id="compliance_auditor",
                name="Compliance Auditor",
                stance="Risk & Regulations",
                icon="search",
                system_prompt="Analyze legal questions highlighting regulatory violations, statutory limits, and compliance requirements."
            ),
            AgentRole(
                id="impartial_arbitrator",
                name="Impartial Arbitrator",
                stance="Precedent & Neutrality",
                icon="file-text",
                system_prompt="Evaluate legal questions neutrally, balancing arguments against statutory law and judicial precedents."
            )
        ]
    ),
    "tech": Council(
        id="tech",
        name="Engineering & Architecture Council",
        description="Technical breakdown across Cloud Architecture, Security, and Engineering.",
        requires_pro=True, # PRO Tier required
        roles=[
            AgentRole(
                id="cloud_architect",
                name="Cloud Architect",
                stance="Scalability & Infrastructure",
                icon="cloud",
                system_prompt="Evaluate technical architecture for scalability, distributed performance, cost, and reliability."
            ),
            AgentRole(
                id="security_engineer",
                name="Security Lead",
                stance="Vulnerabilities & Zero-Trust",
                icon="shield",
                system_prompt="Evaluate technical architecture for security vulnerabilities, attack vectors, data privacy, and zero-trust principles."
            ),
            AgentRole(
                id="pragmatic_dev",
                name="Lead Developer",
                stance="DX & Speed-to-Deliver",
                icon="code",
                system_prompt="Evaluate technical architecture focusing on developer velocity, code simplicity, maintainability, and practical execution."
            )
        ]
    )
}

def get_council(council_id: str) -> Council:
    return COUNCILS.get(council_id, COUNCILS["general"])

def get_available_councils(is_pro: bool = False) -> List[Dict[str, Any]]:
    return [c.to_dict() for c in COUNCILS.values()]
