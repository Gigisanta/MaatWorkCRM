CREATE TABLE "pipeline_stage_history" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"contact_id" text NOT NULL,
	"from_stage_id" text,
	"to_stage_id" text,
	"reason" text,
	"changed_by_user_id" text,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"contact_id" text NOT NULL,
	"annual_income" integer,
	"net_worth" integer,
	"liquid_assets" integer,
	"other_assets" integer,
	"liabilities" integer,
	"risk_tolerance" text,
	"investment_horizon" text,
	"investment_experience" text,
	"primary_goal" text,
	"secondary_goal" text,
	"target_return" integer,
	"time_horizon_years" integer,
	"marital_status" text,
	"dependents" integer,
	"spouse_employed" text,
	"spouse_income" integer,
	"employment_status" text,
	"occupation" text,
	"employer" text,
	"years_at_employer" integer,
	"tax_bracket" text,
	"tax_id" text,
	"legal_residence" text,
	"has_life_insurance" text,
	"life_insurance_amount" integer,
	"has_disability_insurance" text,
	"has_will" text,
	"has_trust" text,
	"estate_beneficiaries" text,
	"financial_notes" text,
	"special_considerations" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "financial_profiles_contact_id_unique" UNIQUE("contact_id")
);
--> statement-breakpoint
CREATE TABLE "portfolio_allocations" (
	"id" text PRIMARY KEY NOT NULL,
	"portfolio_id" text NOT NULL,
	"asset_class" text NOT NULL,
	"asset_name" text NOT NULL,
	"ticker" text,
	"isin" text,
	"target_percentage" numeric(5, 2),
	"actual_percentage" numeric(5, 2),
	"shares" numeric(20, 10),
	"price_per_share" integer,
	"value" integer,
	"cost_basis" integer,
	"unrealized_gain_loss" integer,
	"realized_gain_loss" integer,
	"purchase_date" timestamp,
	"last_updated" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"portfolio_id" text NOT NULL,
	"snapshot_date" timestamp NOT NULL,
	"total_value" integer NOT NULL,
	"cash_value" integer,
	"daily_return" numeric(8, 4),
	"weekly_return" numeric(8, 4),
	"monthly_return" numeric(8, 4),
	"ytd_return" numeric(8, 4),
	"benchmark_return" numeric(8, 4),
	"sharpe_ratio" numeric(6, 3),
	"volatility" numeric(6, 3),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"portfolio_id" text NOT NULL,
	"allocation_id" text,
	"type" text NOT NULL,
	"asset_name" text,
	"ticker" text,
	"shares" numeric(20, 10),
	"price_per_share" integer,
	"total_amount" integer,
	"fees" integer,
	"transaction_date" timestamp NOT NULL,
	"settlement_date" timestamp,
	"notes" text,
	"broker_reference" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolios" (
	"id" text PRIMARY KEY NOT NULL,
	"contact_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'client' NOT NULL,
	"total_value" integer,
	"target_value" integer,
	"cash_balance" integer,
	"risk_profile" text,
	"investment_strategy" text,
	"rebalance_threshold" integer DEFAULT 5,
	"is_active" boolean DEFAULT true,
	"last_rebalanced_at" timestamp,
	"last_synced_at" timestamp,
	"advisor_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advisor_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"advisor_id" text NOT NULL,
	"total_aum" integer DEFAULT 0,
	"total_clients" integer DEFAULT 0,
	"active_clients" integer DEFAULT 0,
	"average_aum_per_client" integer,
	"median_aum_per_client" integer,
	"ytd_revenue" integer DEFAULT 0,
	"mtd_revenue" integer DEFAULT 0,
	"ytd_commissions" integer DEFAULT 0,
	"mtd_commissions" integer DEFAULT 0,
	"trailing_twelve_month_revenue" integer DEFAULT 0,
	"trailing_twelve_month_commissions" integer DEFAULT 0,
	"client_retention_rate" integer,
	"client_growth_rate" integer,
	"aum_growth_rate" integer,
	"average_client_tenure_months" integer,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "advisor_metrics_advisor_id_unique" UNIQUE("advisor_id")
);
--> statement-breakpoint
CREATE TABLE "aum_by_client" (
	"id" text PRIMARY KEY NOT NULL,
	"snapshot_id" text NOT NULL,
	"contact_id" text NOT NULL,
	"value" integer NOT NULL,
	"previous_value" integer,
	"change" integer,
	"change_percentage" integer,
	"number_of_accounts" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aum_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"advisor_id" text NOT NULL,
	"snapshot_date" timestamp NOT NULL,
	"period" text DEFAULT 'monthly' NOT NULL,
	"total_aum" integer NOT NULL,
	"previous_aum" integer,
	"new_money" integer DEFAULT 0,
	"market_gains" integer DEFAULT 0,
	"withdrawals" integer DEFAULT 0,
	"fees" integer DEFAULT 0,
	"number_of_clients" integer DEFAULT 0,
	"number_of_accounts" integer DEFAULT 0,
	"average_account_size" integer,
	"median_account_size" integer,
	"new_clients" integer DEFAULT 0,
	"lost_clients" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commission_records" (
	"id" text PRIMARY KEY NOT NULL,
	"advisor_id" text NOT NULL,
	"contact_id" text,
	"date" timestamp NOT NULL,
	"type" text NOT NULL,
	"gross_amount" integer NOT NULL,
	"dealer_split" integer DEFAULT 0,
	"net_amount" integer NOT NULL,
	"aum_at_time" integer,
	"description" text,
	"reference" text,
	"status" text DEFAULT 'pending',
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pipeline_stages" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "pipeline_stages" ADD COLUMN "wip_limit" integer;--> statement-breakpoint
ALTER TABLE "pipeline_stages" ADD COLUMN "sla_hours" integer;--> statement-breakpoint
ALTER TABLE "pipeline_stages" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "pipeline_stage_history" ADD CONSTRAINT "pipeline_stage_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_stage_history" ADD CONSTRAINT "pipeline_stage_history_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_stage_history" ADD CONSTRAINT "pipeline_stage_history_from_stage_id_pipeline_stages_id_fk" FOREIGN KEY ("from_stage_id") REFERENCES "public"."pipeline_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_stage_history" ADD CONSTRAINT "pipeline_stage_history_to_stage_id_pipeline_stages_id_fk" FOREIGN KEY ("to_stage_id") REFERENCES "public"."pipeline_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_stage_history" ADD CONSTRAINT "pipeline_stage_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_profiles" ADD CONSTRAINT "financial_profiles_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_allocations" ADD CONSTRAINT "portfolio_allocations_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_snapshots" ADD CONSTRAINT "portfolio_snapshots_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_transactions" ADD CONSTRAINT "portfolio_transactions_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_transactions" ADD CONSTRAINT "portfolio_transactions_allocation_id_portfolio_allocations_id_fk" FOREIGN KEY ("allocation_id") REFERENCES "public"."portfolio_allocations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_advisor_id_users_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advisor_metrics" ADD CONSTRAINT "advisor_metrics_advisor_id_users_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aum_by_client" ADD CONSTRAINT "aum_by_client_snapshot_id_aum_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."aum_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aum_by_client" ADD CONSTRAINT "aum_by_client_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aum_snapshots" ADD CONSTRAINT "aum_snapshots_advisor_id_users_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_advisor_id_users_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;