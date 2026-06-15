export type IndustryCategory =
  | "Fintech" | "Edutech" | "E-commerce" | "Agritech"
  | "Healthtech" | "F&B" | "Logistik" | "SaaS"
  | "Properti" | "Hiburan" | "Manufaktur" | "Jasa Profesional";

export type OperatingModel = "Daring" | "Luring" | "Hibrida";
export type InitialCapital = "< Rp50 juta" | "Rp50–500 juta" | "Rp500 juta–2 miliar" | "> Rp2 miliar";
export type ReadinessLevel = "Ide" | "Prototipe" | "MVP" | "Sudah Berjalan";
export type TeamExpertise = "Teknologi" | "Pemasaran" | "Keuangan" | "Operasional" | "Desain";
export type RiskProfile = "Konservatif" | "Moderat" | "Agresif";
export type DynamicScenario =
  | "Penambahan Modal di Tengah Jalan"
  | "Pembukaan Outlet/Cabang"
  | "Ekspansi Wilayah"
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

export interface FeasibilityBreakdown {
  market_score: number;
  business_model_score: number;
  risk_score: number;
  competitive_advantage_score: number;
}

export interface FeasibilityScore {
  total: number;
  classification: "LAYAK" | "CUKUP LAYAK" | "TIDAK LAYAK";
  breakdown: FeasibilityBreakdown;
  scenario_impact: {
    base_score: number;
    scenario_adjustments: number;
    final_score: number;
    scenario_notes: string;
  };
}

export interface StrategicRecommendation {
  priority: "HIGH" | "MEDIUM" | "LOW";
  action: string;
  timeline: string;
  expected_impact: string;
}

export interface AnalysisResult {
  session_id: string;
  params: StartupParameters;
  orchestrator: {
    startup_summary: string;
    industry_context: string;
    analysis_priorities: string[];
    early_warnings: string[];
    execution_plan: Record<string, string[]>;
    key_assumptions: string[];
  };
  bmc: {
    value_propositions: {
      core_value: string;
      pain_relievers: string[];
      gain_creators: string[];
      differentiator: string;
    };
    customer_segments: {
      primary_segment: string;
      secondary_segments: string[];
      customer_profile: string;
      estimated_size: string;
    };
    revenue_streams: {
      primary_revenue: string;
      revenue_model: string;
      pricing_strategy: string;
      estimated_monthly_revenue_year1: string;
    };
    channels: {
      primary_channels: string[];
      channel_strategy: string;
      digital_presence: string;
    };
    key_resources: {
      human_resources: string[];
      physical_resources: string[];
      intellectual_resources: string[];
      financial_requirements: string;
    };
  };
  market: {
    market_overview: string;
    tam: { value: string; source: string; year: number };
    sam: { value: string; rationale: string; percentage_of_tam: string };
    som: { value: string; rationale: string; percentage_of_sam: string; year_1_target: string };
    market_trends: string[];
    growth_rate: string;
    market_maturity: string;
    key_market_drivers: string[];
    regulatory_environment: string;
  };
  competitor: {
    direct_competitors: Array<{
      name: string;
      description: string;
      estimated_market_share: string;
      strengths: string[];
      weaknesses: string[];
      funding_status: string;
      url: string;
    }>;
    indirect_competitors: Array<{ name: string; description: string; threat_level: string }>;
    competitive_landscape: string;
    our_differentiation: string;
    competitive_moat: string;
    entry_barriers: string[];
    competitive_advantage_score: number;
  };
  risk: {
    overall_risk_score: number;
    risk_level: string;
    dimensions: Record<string, {
      score: number;
      level: string;
      risks: Array<{ risk: string; probability: string; impact: string; mitigation: string }>;
    }>;
    top_3_critical_risks: string[];
    runway_estimate: string;
    risk_mitigation_summary: string;
  };
  recommendation: {
    feasibility_score: FeasibilityScore;
    executive_summary: string;
    key_strengths: string[];
    critical_challenges: string[];
    strategic_recommendations: StrategicRecommendation[];
    go_nogo_recommendation: "GO" | "CONDITIONAL GO" | "NO GO";
    next_steps: string[];
    confidence_level: "High" | "Medium" | "Low";
    validation_notes: string;
  };
  monitoring: {
    session_id: string;
    total_elapsed_seconds: number;
    agents: Record<string, { elapsed: number; tokens: number }>;
    total_tokens: number;
  };
}

export interface AgentEvent {
  event: "agent_start" | "agent_done" | "agent_error" | "complete";
  agent: string;
  progress: number;
  data?: Partial<AnalysisResult> | Record<string, unknown>;
  elapsed_seconds?: number;
  tokens_used?: number;
}
