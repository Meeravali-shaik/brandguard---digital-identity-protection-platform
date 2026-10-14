import React, { useEffect, useState } from 'react';
import { BarChart3, AlertTriangle, Info, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { EvaluationSummary } from '../types/brandguard';
import { apiClient } from '../services/apiClient';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const EvaluationPage: React.FC = () => {
  const [evaluation, setEvaluation] = useState<EvaluationSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiClient.getEvaluationSummary().then(res => {
      if (isMounted) {
        setEvaluation(res);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

  if (loading || !evaluation) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        Assembling isolated ground truth evaluation benchmark...
      </div>
    );
  }

  const chartData = evaluation.techniques.map(t => ({
    name: t.technique_name,
    Precision: Math.round(t.precision * 100),
    Recall: Math.round(t.recall * 100),
    Samples: t.sample_count
  }));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Benchmark Performance & Evaluation</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Detector precision, recall, and exclusion correctness measured against isolated ground-truth labels
          </p>
        </div>

        <div className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-3 py-1.5 rounded-lg">
          Benchmark Dataset: {evaluation.total_evaluated_records} Labelled Entities
        </div>
      </div>

      {/* Mandatory Limitations & Synthetic Data Disclaimer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-white">Controlled Benchmark Methodology Notice</div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            {evaluation.limitations_disclaimer} Ground-truth labels are permanently isolated from the detection engine during inference.
            Performance numbers reflect deterministic rule execution on the synthetic test fixture and do not claim universal real-world immunity.
          </p>
        </div>
      </div>

      {/* Core Detection Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Precision */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Precision</span>
            <span className="text-[10px] text-slate-500 font-mono">TP / (TP + FP)</span>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            {(evaluation.precision * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Accuracy of positive alarms</div>
        </div>

        {/* Recall */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Recall</span>
            <span className="text-[10px] text-slate-500 font-mono">TP / (TP + FN)</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {(evaluation.recall * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Coverage of true impersonators</div>
        </div>

        {/* False Positive Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">False Positive Rate</span>
            <span className="text-[10px] text-slate-500 font-mono">FP / (FP + TN)</span>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
            {(evaluation.false_positive_rate * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Benign entities flagged</div>
        </div>

        {/* F1 Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">F1 Score</span>
            <span className="text-[10px] text-slate-500 font-mono">Harmonic Mean</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {(evaluation.f1_score * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Balanced precision & recall</div>
        </div>

        {/* Exclusion Correctness */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Exclusion Accuracy</span>
            <span className="text-[10px] text-slate-500 font-mono">Official Excl.</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {(evaluation.exclusion_correctness_rate * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">No friendly fire on official assets</div>
        </div>
      </div>

      {/* Confusion Matrix + Technique Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Confusion Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
            2×2 Confusion Matrix
          </h2>
          <p className="text-xs text-slate-400 mb-4">Empirical cross-tabulation</p>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            {/* TP */}
            <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/40 rounded-lg">
              <div className="text-[10px] text-emerald-400 font-semibold uppercase">True Positive (TP)</div>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                {evaluation.confusion_matrix.true_positives}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Impersonators detected</div>
            </div>

            {/* FP */}
            <div className="p-3.5 bg-rose-950/30 border border-rose-800/30 rounded-lg">
              <div className="text-[10px] text-rose-400 font-semibold uppercase">False Positive (FP)</div>
              <div className="text-2xl font-bold font-mono text-rose-300 mt-1">
                {evaluation.confusion_matrix.false_positives}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Benign entities flagged</div>
            </div>

            {/* FN */}
            <div className="p-3.5 bg-amber-950/30 border border-amber-800/30 rounded-lg">
              <div className="text-[10px] text-amber-400 font-semibold uppercase">False Negative (FN)</div>
              <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                {evaluation.confusion_matrix.false_negatives}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Missed threats</div>
            </div>

            {/* TN */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">True Negative (TN)</div>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                {evaluation.confusion_matrix.true_negatives}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Benign/Excluded passed</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div>• Positive classification threshold: Composite Score ≥ 55 with Corroboration.</div>
            <div>• Official assets are filtered prior to scoring via strict identity exclusion.</div>
          </div>
        </div>

        {/* Per-Technique Performance Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
            Performance By Threat Technique
          </h2>
          <p className="text-xs text-slate-400 mb-4">Precision & Recall across distinct attack surfaces</p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="Precision" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Recall" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Per-Technique Detailed Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Technique Breakdown Forensic Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Disaggregated telemetry against synthetic attack categories</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Threat Technique</th>
                <th className="py-3 px-4">Evaluation Samples</th>
                <th className="py-3 px-4">TP / FP</th>
                <th className="py-3 px-4">FN / TN</th>
                <th className="py-3 px-4">Precision</th>
                <th className="py-3 px-4">Recall</th>
                <th className="py-3 px-4 text-right">F1 Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {evaluation.techniques.map((t, idx) => (
                <tr key={idx} className="hover:bg-slate-850/40">
                  <td className="py-3 px-4 font-semibold text-white">
                    {t.technique_name}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {t.sample_count} records
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    <span className="text-emerald-400">{t.true_positives} TP</span> / <span className="text-rose-400">{t.false_positives} FP</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    <span className="text-amber-400">{t.false_negatives} FN</span> / <span className="text-slate-400">{t.true_negatives} TN</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-cyan-400 font-semibold">
                    {(t.precision * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                    {(t.recall * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-white font-semibold">
                    {(t.f1_score * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
