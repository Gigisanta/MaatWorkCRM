import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Users, Briefcase, FileText, Shield } from "lucide-react";
import { FinancialProfileFormData } from "~/lib/validations/financial-profile";
import { cn } from "~/lib/utils";

interface FinancialProfileDisplayProps {
  profile: FinancialProfileFormData | null | undefined;
  onEdit?: () => void;
}

export function FinancialProfileDisplay({ profile, onEdit }: FinancialProfileDisplayProps) {
  if (!profile) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-hover flex items-center justify-center">
          <DollarSign className="w-8 h-8 text-text-muted" />
        </div>
        <p className="text-text-muted mb-4">No financial profile created yet</p>
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-primary hover:text-primary-hover font-semibold text-sm"
          >
            Create Financial Profile
          </button>
        )}
      </div>
    );
  }

  const formatCurrency = (value: number | undefined) => {
    if (!value) return "Not specified";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const sections = [
    {
      title: "Income & Wealth",
      icon: DollarSign,
      items: [
        { label: "Annual Income", value: formatCurrency(profile.annualIncome) },
        { label: "Net Worth", value: formatCurrency(profile.netWorth) },
        { label: "Liquid Assets", value: formatCurrency(profile.liquidAssets) },
        { label: "Other Assets", value: formatCurrency(profile.otherAssets) },
        { label: "Liabilities", value: formatCurrency(profile.liabilities) },
      ],
    },
    {
      title: "Risk Profile",
      icon: TrendingUp,
      items: [
        { 
          label: "Risk Tolerance", 
          value: profile.riskTolerance?.replace("_", " ") || "Not specified" 
        },
        { 
          label: "Investment Horizon", 
          value: profile.investmentHorizon?.replace("_", " ") || "Not specified" 
        },
        { 
          label: "Experience Level", 
          value: profile.investmentExperience || "Not specified" 
        },
      ],
    },
    {
      title: "Investment Goals",
      icon: TrendingUp,
      items: [
        { 
          label: "Primary Goal", 
          value: profile.primaryGoal?.replace("_", " ") || "Not specified" 
        },
        { label: "Target Return", value: profile.targetReturn ? `${profile.targetReturn}%` : "Not specified" },
        { label: "Time Horizon", value: profile.timeHorizonYears ? `${profile.timeHorizonYears} years` : "Not specified" },
      ],
    },
    {
      title: "Family Information",
      icon: Users,
      items: [
        { label: "Marital Status", value: profile.maritalStatus || "Not specified" },
        { label: "Dependents", value: profile.dependents?.toString() || "Not specified" },
        { label: "Spouse Employed", value: profile.spouseEmployed || "Not specified" },
        { label: "Spouse Income", value: formatCurrency(profile.spouseIncome) },
      ],
    },
    {
      title: "Employment",
      icon: Briefcase,
      items: [
        { label: "Status", value: profile.employmentStatus?.replace("_", " ") || "Not specified" },
        { label: "Occupation", value: profile.occupation || "Not specified" },
        { label: "Employer", value: profile.employer || "Not specified" },
        { label: "Years at Employer", value: profile.yearsAtEmployer?.toString() || "Not specified" },
      ],
    },
    {
      title: "Insurance & Estate",
      icon: Shield,
      items: [
        { label: "Life Insurance", value: profile.hasLifeInsurance || "Not specified" },
        { label: "Coverage Amount", value: formatCurrency(profile.lifeInsuranceAmount) },
        { label: "Disability Insurance", value: profile.hasDisabilityInsurance || "Not specified" },
        { label: "Has Will", value: profile.hasWill || "Not specified" },
        { label: "Has Trust", value: profile.hasTrust || "Not specified" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {sections.map((section, idx) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-surface rounded-xl border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <section.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-text">{section.title}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {section.items.map((item) => (
              <div key={item.label}>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                  {item.label}
                </p>
                <p className={cn(
                  "text-sm",
                  item.value === "Not specified" ? "text-text-muted italic" : "text-text"
                )}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {(profile.financialNotes || profile.specialConsiderations) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-surface rounded-xl border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-text">Notes & Considerations</h3>
          </div>
          {profile.financialNotes && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Financial Notes
              </p>
              <p className="text-sm text-text">{profile.financialNotes}</p>
            </div>
          )}
          {profile.specialConsiderations && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Special Considerations
              </p>
              <p className="text-sm text-text">{profile.specialConsiderations}</p>
            </div>
          )}
        </motion.div>
      )}

      {onEdit && (
        <div className="flex justify-end">
          <button
            onClick={onEdit}
            className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold text-sm transition-colors"
          >
            Edit Financial Profile
          </button>
        </div>
      )}
    </div>
  );
}
