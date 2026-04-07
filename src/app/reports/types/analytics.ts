// ============================================
// Reports/Analytics Dashboard - Shared Types
// Generated: 2026-04-07
// ============================================

// Period filter options
export type PeriodFilter = "week" | "month" | "quarter" | "year";

export type IncludeSection =
  | "executive"
  | "funnel"
  | "leadScoring"
  | "goals"
  | "activity"
  | "advisor"
  | "pipeline"
  | "contacts"
  | "trends";

// ============================================
// API Response Types
// ============================================

export interface ReportsAnalyticsResponse {
  generatedAt: string;
  executive: ExecutiveMetrics;
  funnel: FunnelMetrics;
  leadScoring: LeadScoringMetrics;
  goals: GoalsMetrics;
  activity: ActivityMetrics;
  advisor: AdvisorMetrics;
  pipeline: PipelineMetrics;
  contacts: ContactsMetrics;
  trends: TrendsMetrics;
}

// ============================================
// Executive Summary
// ============================================

export interface ExecutiveMetrics {
  pipelineValue: number;
  weightedPipeline: number; // pipeline * leadScore/30
  pipelineChange: number; // % vs previous period
  totalContacts: number;
  activeContacts: number;
  contactsChange: number;
  winRate: number; // 0-100
  avgDealSize: number;
  pipelineVelocity: number; // avg days to close
  healthScore: number; // 0-100 composite
  healthScoreChange: number;
  staleContacts: number; // no activity in 14+ days
  overdueTasks: number;
  overdueTasksChange: number;
  avgGoalProgress: number;
  revenueForecast: number; // weighted pipeline
  revenueForecastChange: number;
  meetingsHeld: number;
  meetingsChange: number;
}

// ============================================
// Funnel Analytics
// ============================================

export interface FunnelMetrics {
  stages: FunnelStage[];
  totalContacts: number;
  lostContacts: number;
  lostContactsValue: number;
  overallConversionRate: number; // first_to_last as %
}

export interface FunnelStage {
  id: string;
  name: string;
  color: string;
  order: number;
  count: number;
  value: number;
  conversionRate: number | null; // % from previous stage
  avgTimeInStage: number | null; // days
  isLost: boolean; // Caido/Caida/Cuenta vacia stage
}

// ============================================
// Lead Scoring
// ============================================

export interface LeadScoringMetrics {
  distribution: LeadScoreBucket[];
  avgScoreBySegment: AvgScoreBySegment[];
  scoreEffectiveness: ScoreEffectiveness;
}

export type LeadScoreBucketLabel = "cold" | "warm" | "hot" | "scorching";

export interface LeadScoreBucket {
  bucket: LeadScoreBucketLabel;
  range: string; // "0-5", "6-10", "11-20", "21-30"
  count: number;
  percentage: number; // 0-100
  avgValue: number;
  color: string;
}

export interface AvgScoreBySegment {
  segment: string;
  avgScore: number;
  count: number;
}

export interface ScoreEffectiveness {
  highScoreAvgValue: number; // avg value for leads with score >= 20
  lowScoreAvgValue: number; // avg value for leads with score < 10
  lift: number; // highScoreAvgValue / lowScoreAvgValue
}

// ============================================
// Goals
// ============================================

export interface GoalsMetrics {
  byType: GoalTypeSummary[];
  overall: GoalsOverall;
  byTeam: TeamGoalSummary[];
}

export interface GoalTypeSummary {
  type: string; // new_aum | new_clients | meetings | revenue
  label: string;
  targetValue: number;
  currentValue: number;
  progress: number; // 0-100
  onTrack: boolean; // pacing index >= 0.8
  goalsCount: number;
  completedCount: number;
  atRiskCount: number;
}

export interface GoalsOverall {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  atRiskGoals: number;
  avgProgress: number;
  pacingIndex: number; // 1.0 = on pace
}

export interface TeamGoalSummary {
  teamId: string;
  teamName: string;
  totalGoals: number;
  completedGoals: number;
  avgProgress: number;
  goals: GoalSummary[];
}

export interface GoalSummary {
  id: string;
  title: string;
  type: string;
  targetValue: number;
  currentValue: number;
  progress: number; // 0-100
  status: string; // active | completed | missed | cancelled
  pacingIndex: number; // currentProgress / timeProgress
}

// ============================================
// Activity
// ============================================

export interface ActivityMetrics {
  tasks: TaskMetrics;
  meetings: MeetingMetrics;
  trend: ActivityTrendPoint[];
}

export interface TaskMetrics {
  total: number;
  completed: number;
  overdue: number;
  pending: number;
  inProgress: number;
  completionRate: number; // 0-100
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface MeetingMetrics {
  total: number;
  totalChange: number; // % vs previous period
}

export interface ActivityTrendPoint {
  label: string; // e.g. "Sem 1", "Ene"
  tasksCompleted: number;
  meetings: number;
  contactsCreated: number;
}

// ============================================
// Advisor Performance
// ============================================

export interface AdvisorMetrics {
  rankings: AdvisorRanking[];
  comparisons: AdvisorComparisons;
}

export interface AdvisorRanking {
  advisorId: string;
  advisorName: string;
  contacts: number;
  pipelineValue: number;
  dealsClosed: number;
  revenue: number;
  goalAttainment: number; // 0-100
  tasksCompleted: number;
  compositeScore: number; // weighted ranking score
  rank: number;
}

export interface AdvisorComparisons {
  bestPerformer: string; // advisorId
  bestPerformerName: string;
  mostImproved: string; // advisorId
  mostImprovedName: string;
  needsAttention: string; // advisorId
  needsAttentionName: string;
}

// ============================================
// Pipeline Insights
// ============================================

export interface PipelineMetrics {
  stageDistribution: StageDistribution[];
  weightedPipeline: number;
  velocityMetrics: VelocityMetrics;
  revenueForecast: RevenueForecast;
}

export interface StageDistribution {
  stageId: string;
  stageName: string;
  color: string;
  count: number;
  value: number;
  probability: number; // avg probability for deals in this stage
}

export interface VelocityMetrics {
  avgDaysToClose: number;
  avgDaysToCloseChange: number; // % vs previous period
  bottleneckStage: string | null; // stage name with highest avg time
}

export interface RevenueForecast {
  bestCase: number; // sum of all deal values
  mostLikely: number; // weighted by probability
  closedThisPeriod: number;
  forecastVsTarget: number | null; // % of team goal target
  byMonth: MonthlyForecast[];
}

export interface MonthlyForecast {
  month: string; // "Ene 2026"
  value: number;
  weightedValue: number;
}

// ============================================
// Contacts Insights
// ============================================

export interface ContactsMetrics {
  atRisk: ContactsAtRisk;
  bySegment: SegmentSummary[];
  bySource: SourceSummary[];
  newVsReturning: NewVsReturning;
}

export interface ContactsAtRisk {
  total: number;
  stale: number; // no activity in 14+ days
  unassigned: number; // no assigned advisor
  noFinancialPlan: number;
  highRiskContacts: RiskContact[]; // top 10 by risk score
}

export interface RiskContact {
  id: string;
  name: string;
  daysSinceActivity: number;
  assignedTo: string | null;
  assignedToName: string | null;
  riskScore: number;
  pipelineStage: string | null;
  leadScore: number;
}

export interface SegmentSummary {
  segment: string;
  count: number;
  value: number;
  avgLeadScore: number;
}

export interface SourceSummary {
  source: string;
  count: number;
  avgLeadScore: number;
  conversionRate: number | null; // % that reached active stage
}

export interface NewVsReturning {
  newContacts: number;
  returningContacts: number;
  retentionRate: number; // 0-100
}

// ============================================
// Trends
// ============================================

export interface TrendsMetrics {
  contacts: TrendPoint[];
  revenue: TrendPoint[];
  activity: ActivityTrendPoint[];
  comparison: TrendsComparison;
}

export interface TrendPoint {
  label: string;
  value: number;
  cumulative: number;
  previousValue: number | null; // for comparison
}

export interface TrendsComparison {
  contactsChange: number; // % vs previous period
  revenueChange: number;
  activityChange: number;
}

// ============================================
// Chart Component Props
// ============================================

export interface ChartDataPoint {
  label: string;
  [key: string]: number | string;
}

export interface FunnelChartData {
  name: string;
  count: number;
  value: number;
  conversionRate: number | null;
  color: string;
}

export interface AreaChartSeries {
  key: string;
  name: string;
  color: string;
  dashed?: boolean;
}

// ============================================
// KPI Card Props
// ============================================

export interface KPICardProps {
  title: string;
  value: string | number;
  change?: number; // % change, positive = up, negative = down
  changeLabel?: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  suffix?: string;
  alert?: boolean; // if true, show warning style
}
