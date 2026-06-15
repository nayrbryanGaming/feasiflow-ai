// ══════════════════════════════════════════════════════════════════════════════
// FeasiFlow AI — Type Definitions
// 9 Agents × 7 Sifat Penilaian × 7 Metode Scraping
// ══════════════════════════════════════════════════════════════════════════════

export type IndustryCategory =
  | "Fintech"
  | "Edutech"
  | "Healthtech"
  | "E-commerce & Marketplace"
  | "Agritech"
  | "F&B"
  | "SaaS & Enterprise Software";

export type OperatingModel = "Daring" | "Luring" | "Hibrida";

export type InitialCapital =
  | "< Rp 10 Juta"
  | "Rp 10-50 Juta"
  | "Rp 50-100 Juta"
  | "Rp 100-500 Juta"
  | "Rp 500 Juta - 1 Miliar"
  | "> Rp 1 Miliar";

export type ReadinessLevel = "Ide" | "Prototipe" | "MVP" | "Sudah Berjalan";

export type TeamExpertise =
  | "Teknologi"
  | "Pemasaran"
  | "Keuangan"
  | "Operasional"
  | "Desain"
  | "Domain Expert";

export type RiskProfile = "Konservatif" | "Moderat" | "Agresif";

export type DynamicScenario =
  | "Penambahan Modal di Tengah Jalan"
  | "Pembukaan Outlet Fisik Baru"
  | "Ekspansi ke Wilayah Baru"
  | "Pivot Model Bisnis";

export interface StartupParameters {
  industryCategory: IndustryCategory;
  topicSubField: string;
  operatingModel: OperatingModel;
  location?: string;
  platform?: string;
  initialCapital: InitialCapital;
  readinessLevel: ReadinessLevel;
  teamExpertise: TeamExpertise[];
  riskProfile: RiskProfile;
  dynamicScenarios?: DynamicScenario[];
  ideaDescription: string;
}

// ── 7 Sifat Penilaian Breakdown ──────────────────────────────────────────────
export interface SevenDimensionBreakdown {
  market_score: number;
  market_weight: number;
  market_contribution: number;
  business_model_score: number;
  business_model_weight: number;
  business_model_contribution: number;
  risk_score: number;
  risk_weight: number;
  risk_contribution: number;
  competitive_advantage_score: number;
  competitive_advantage_weight: number;
  competitive_advantage_contribution: number;
  financial_sustainability_score: number;
  financial_sustainability_weight: number;
  financial_sustainability_contribution: number;
  demand_validation_score: number;
  demand_validation_weight: number;
  demand_validation_contribution: number;
  regulatory_feasibility_score: number;
  regulatory_feasibility_weight: number;
  regulatory_feasibility_contribution: number;
}

export interface FeasibilityScore {
  total_score: number;
  classification: "LAYAK" | "CUKUP LAYAK" | "TIDAK LAYAK";
  classification_icon: string;
  breakdown: SevenDimensionBreakdown;
  confidence_level: "rendah" | "sedang" | "tinggi";
  confidence_reasoning: string;
  weakest_dimension: string;
  strongest_dimension: string;
  scenario_impact: {
    base_score: number;
    with_scenarios: number;
    delta: number;
    active_scenarios: string[];
  };
}

// ── Agent 5: Sentiment & Social Intelligence ─────────────────────────────────
export interface SentimentDimension {
  score: number;
  evidence: string;
}

export interface SentimentResult {
  sentiment_dimensions: {
    urgency: SentimentDimension;
    frequency: SentimentDimension;
    willingness_to_pay: SentimentDimension;
    trust_deficit: SentimentDimension;
    viral_potential: SentimentDimension;
    community_strength: SentimentDimension;
    regulatory_acceptance: SentimentDimension;
  };
  validated_demand_score: number;
  pain_point_evidence: string[];
  positive_signals: string[];
  negative_signals: string[];
  key_insight: string;
  target_community: string;
  sentiment_summary: string;
}

// ── Agent 7: Regulatory Intelligence ─────────────────────────────────────────
export interface RegulatoryDimension {
  score: number;
  reasoning: string;
}

export interface ComplianceCostBreakdown {
  minimum: string;
  realistic: string;
  maximum: string;
  main_cost_drivers: string[];
}

export interface RegulatoryResult {
  regulatory_dimensions: {
    regulatory_clarity: RegulatoryDimension;
    licensing_accessibility: RegulatoryDimension;
    compliance_cost_feasibility: RegulatoryDimension;
    regulatory_timeline: RegulatoryDimension;
    regulatory_trend: RegulatoryDimension;
    enforcement_risk: RegulatoryDimension;
    government_support: RegulatoryDimension;
  };
  regulatory_feasibility_score: number;
  primary_regulator: string;
  required_licenses: string[];
  compliance_roadmap: string[];
  compliance_cost_breakdown: ComplianceCostBreakdown;
  critical_regulatory_risks: string[];
  quick_win_path: string;
  regulatory_summary: string;
}

// ── Agent 8: Financial Modeling ───────────────────────────────────────────────
export interface FinancialDimension {
  score: number;
  reasoning: string;
}

export interface RunwayProjection {
  initial_capital_idr: number;
  estimated_monthly_burn: string;
  runway_months: number;
  runway_assessment: string;
}

export interface RevenueProjection {
  month_3: string;
  month_6: string;
  month_12: string;
  break_even_month: string;
}

export interface FundingRecommendation {
  next_fundraise_timing: string;
  recommended_amount: string;
  investor_type: string;
  use_of_funds: string[];
}

export interface FinancialResult {
  financial_dimensions: {
    capital_sufficiency: FinancialDimension;
    revenue_model_clarity: FinancialDimension;
    gross_margin_health: FinancialDimension;
    cash_efficiency: FinancialDimension;
    break_even_achievability: FinancialDimension;
    funding_pathway: FinancialDimension;
    unit_economics_viability: FinancialDimension;
  };
  financial_sustainability_score: number;
  runway_projection: RunwayProjection;
  revenue_projection: RevenueProjection;
  cost_structure: {
    fixed_costs: string[];
    variable_costs: string[];
    total_estimated_monthly_burn: string;
  };
  funding_recommendation: FundingRecommendation;
  financial_risks: string[];
  financial_summary: string;
}

// ── Full Analysis Result (9 Agents) ──────────────────────────────────────────
export interface AnalysisResult {
  session_id: string;
  params: StartupParameters;

  // Agent 1
  orchestrator: {
    startup_summary: string;
    industry_context: string;
    analysis_priorities: string[];
    early_warnings: string[];
    execution_plan: Record<string, string[]>;
    key_assumptions: string[];
    feasibility_context: string;
  };

  // Agent 2
  bmc: {
    value_proposition_strength: string;
    business_model_score: number;
    score_breakdown: Record<string, number>;
    revenue_model_risk: string;
    time_to_first_revenue: string;
    bmc_summary: string;
    value_propositions?: Record<string, unknown>;
    customer_segments?: Record<string, unknown>;
    revenue_streams?: Record<string, unknown>;
  };

  // Agent 3
  market: {
    market_score: number;
    market_overview: string;
    tam: { value: string; source: string; year: number };
    sam: { value: string; rationale: string; percentage_of_tam: string };
    som: { value: string; rationale: string; percentage_of_sam: string; year_1_target: string };
    market_trends: string[];
    growth_rate: string;
    market_maturity: string;
    key_market_drivers: string[];
    regulatory_environment: string;
    market_summary: string;
  };

  // Agent 4
  competitor: {
    competitive_advantage_score: number;
    direct_competitors: Array<{
      name: string;
      description: string;
      estimated_market_share?: string;
      strengths: string[];
      weaknesses: string[];
      funding_status?: string;
      url?: string;
    }>;
    indirect_competitors?: Array<{ name: string; description: string; threat_level: string }>;
    competitive_landscape: string;
    our_differentiation: string;
    competitive_moat?: string;
    market_gaps: string[];
    recommended_positioning: string;
    competition_intensity: string;
  };

  // Agent 5 (NEW)
  sentiment: SentimentResult;

  // Agent 6
  risk: {
    overall_risk_score: number;
    risk_level: string;
    risk_breakdown?: Record<string, number>;
    dimensions?: Record<string, unknown>;
    top_3_critical_risks: string[];
    runway_estimate: string;
    risk_summary: string;
  };

  // Agent 7 (NEW)
  regulatory: RegulatoryResult;

  // Agent 8 (NEW)
  financial: FinancialResult;

  // Agent 9
  recommendation: {
    feasibility_score: FeasibilityScore;
    go_nogo_recommendation: "GO" | "NO-GO" | "CONDITIONAL GO";
    go_nogo_reasoning: string;
    strengths: string[];
    challenges: string[];
    strategic_recommendations: string[];
    next_steps: string[];
    executive_summary: string;
    key_success_factors: string[];
    red_flags_summary: string;
    comparable_successes: string;
  };

  monitoring: {
    session_id: string;
    total_elapsed_seconds: number;
    agents: Record<string, { elapsed: number; tokens: number }>;
    total_tokens: number;
    events_count: number;
  };

  meta?: {
    agent_count: number;
    assessment_dimensions: number;
    scraping_methods_count: number;
    formula: string;
  };
}

// ── SSE Event Types ───────────────────────────────────────────────────────────
export type AgentName =
  | "orchestrator"
  | "bmc"
  | "market_research"
  | "competitor"
  | "sentiment"
  | "risk"
  | "regulatory"
  | "financial"
  | "recommendation";

export interface AgentEvent {
  event: "agent_start" | "agent_done" | "agent_error" | "complete";
  agent: AgentName;
  progress: number;
  data?: Partial<AnalysisResult> | Record<string, unknown>;
  elapsed_seconds?: number;
  tokens_used?: number;
}

// ── UI Display Helpers ────────────────────────────────────────────────────────
export const AGENT_LABELS: Record<AgentName, string> = {
  orchestrator: "Orchestrator",
  bmc: "Business Model Canvas",
  market_research: "Market Research",
  competitor: "Competitor Analysis",
  sentiment: "Sentiment & Social Intelligence",
  risk: "Risk Analysis",
  regulatory: "Regulatory Intelligence",
  financial: "Financial Modeling",
  recommendation: "Final Recommendation",
};

export const ASSESSMENT_DIMENSIONS = [
  { key: "market", label: "Validasi Pasar", weight: "20%", agent: "market_research" },
  { key: "business_model", label: "Kekuatan Model Bisnis", weight: "18%", agent: "bmc" },
  { key: "risk", label: "Profil Risiko", weight: "17%", agent: "risk" },
  { key: "competitive_advantage", label: "Posisi Kompetitif", weight: "15%", agent: "competitor" },
  { key: "financial_sustainability", label: "Keberlanjutan Finansial", weight: "12%", agent: "financial" },
  { key: "demand_validation", label: "Validasi Demand Publik", weight: "10%", agent: "sentiment" },
  { key: "regulatory_feasibility", label: "Kelayakan Regulasi", weight: "8%", agent: "regulatory" },
] as const;
