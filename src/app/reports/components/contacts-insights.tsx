"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Users, TrendingUp, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/utils";
import LazyBarChart from "@/components/charts/lazy-bar-chart";
import LazyPieChart from "@/components/charts/lazy-pie-chart";
import type { ContactsMetrics } from "../types/analytics";

interface ContactsInsightsProps {
  data: ContactsMetrics;
}

function RiskContactRow({
  contact,
  index,
}: {
  contact: ContactsMetrics["atRisk"]["highRiskContacts"][number];
  index: number;
}) {
  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-rose-400";
    if (score >= 40) return "text-amber-400";
    return "text-emerald-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.35,
        ease: [0.16, 1, 0.3, 1],
        delay: index * 0.05,
      }}
      className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
            contact.riskScore >= 70
              ? "bg-rose-500/20 text-rose-400"
              : contact.riskScore >= 40
              ? "bg-amber-500/20 text-amber-400"
              : "bg-emerald-500/20 text-emerald-400"
          )}
        >
          {contact.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-white truncate">{contact.name}</p>
          <p className="text-xs text-slate-500 truncate">
            {contact.assignedToName || "Sin asignar"} • {contact.daysSinceActivity}d sin actividad
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-slate-400">{contact.leadScore} pts</span>
        <span className={cn("font-medium", getRiskColor(contact.riskScore))}>
          {contact.riskScore}
        </span>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-500">
      <Users className="h-8 w-8 mb-2 opacity-50" />
      <p className="text-sm">No hay datos de contactos disponibles</p>
    </div>
  );
}

export default function ContactsInsights({ data }: ContactsInsightsProps) {
  const hasData = data && data.atRisk && (data.bySegment || data.bySource);

  // Segment data for pie chart
  const segmentData = React.useMemo(() => {
    if (!data?.bySegment || data.bySegment.length === 0) return [];
    return data.bySegment.map((seg, i) => {
      const colors = ["#8B5CF6", "#4ADE80", "#FBBF24", "#38BDF8", "#F87171", "#A78BFA"];
      return {
        name: seg.segment,
        value: seg.count,
        color: colors[i % colors.length],
      };
    });
  }, [data]);

  // Source data for bar chart
  const sourceData = React.useMemo(() => {
    if (!data?.bySource || data.bySource.length === 0) return [];
    return data.bySource.map((src, i) => {
      const colors = ["#8B5CF6", "#4ADE80", "#FBBF24", "#38BDF8", "#F87171", "#A78BFA"];
      return {
        name: src.source,
        value: src.count,
        avgScore: src.avgLeadScore,
        color: colors[i % colors.length],
      };
    });
  }, [data]);

  return (
    <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
      <CardHeader>
        <p className="text-xs text-violet-400 uppercase tracking-widest">INSIGHTS</p>
        <CardTitle className="text-lg font-bold text-white">Insights de Contactos</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {/* At Risk Summary */}
            {data.atRisk && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <div>
                    <p className="text-xs text-slate-400">Total en Riesgo</p>
                    <p className="text-lg font-bold text-rose-400">{data.atRisk.total}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                  <div>
                    <p className="text-xs text-slate-400">Sin Actividad</p>
                    <p className="text-lg font-bold text-white">{data.atRisk.stale}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50">
                  <UserX className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Sin Asignar</p>
                    <p className="text-lg font-bold text-white">{data.atRisk.unassigned}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50">
                  <Users className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Sin Plan Fin.</p>
                    <p className="text-lg font-bold text-white">{data.atRisk.noFinancialPlan}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Lead Score Gauge Placeholder */}
              <div className="p-4 rounded-lg bg-slate-800/30">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                  Puntuación de Leads
                </p>
                {data.atRisk && data.atRisk.highRiskContacts.length > 0 ? (
                  <div className="space-y-3">
                    {/* Simple gauge visualization */}
                    <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 w-full" />
                      <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white" />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>0</span>
                      <span>15</span>
                      <span>30</span>
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-2">
                      {data.atRisk.highRiskContacts.length} contactos de alto riesgo
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[100px] text-slate-500 text-sm">
                    No hay datos de leads
                  </div>
                )}
              </div>

              {/* Segment Distribution */}
              <div className="p-4 rounded-lg bg-slate-800/30">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                  Por Segmento
                </p>
                {segmentData.length > 0 ? (
                  <div className="h-[150px]">
                    <LazyPieChart
                      data={segmentData}
                      innerRadius={50}
                      outerRadius={80}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[150px] text-slate-500 text-sm">
                    No hay datos de segmentos
                  </div>
                )}
              </div>
            </div>

            {/* Source Distribution */}
            {sourceData.length > 0 && (
              <div className="p-4 rounded-lg bg-slate-800/30">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                  Por Fuente
                </p>
                <div className="h-[180px]">
                  <LazyBarChart data={sourceData} layout="vertical" dataKey="value" nameKey="name" />
                </div>
              </div>
            )}

            {/* High Risk Contacts List */}
            {data.atRisk?.highRiskContacts && data.atRisk.highRiskContacts.length > 0 && (
              <div className="p-4 rounded-lg bg-slate-800/30">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                  Contactos de Alto Riesgo
                </p>
                <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                  {data.atRisk.highRiskContacts.slice(0, 5).map((contact, index) => (
                    <RiskContactRow key={contact.id} contact={contact} index={index} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
