export type FunnelStage = {
  label: string;
  value: number;
};

const funnelColors = ["#1e293b", "#3b82f6", "#059669", "#d97706", "#dc2626", "#6366f1"];

function number(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const maxValue = stages.length > 0 ? stages[0].value : 0;

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => {
        const pct = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
        const prev = i > 0 ? stages[i - 1].value : stage.value;
        const dropOff = prev > 0 ? Math.round((stage.value / prev) * 100) : 100;
        const color = funnelColors[i % funnelColors.length];

        return (
          <div key={stage.label}>
            <div className="mb-1 flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-700">{stage.label}</span>
              <div className="flex items-center gap-3 tabular-nums">
                <span className="text-sm font-semibold text-slate-900">{number(stage.value)}</span>
                <span className="w-14 text-right text-xs text-slate-500">{pct.toFixed(1)}%</span>
                {i > 0 && (
                  <span className="w-16 text-right text-xs text-slate-400">{dropOff}%</span>
                )}
              </div>
            </div>
            <div className="h-7 w-full overflow-hidden rounded-lg bg-slate-100">
              <div
                className="h-full rounded-lg transition-all"
                style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
