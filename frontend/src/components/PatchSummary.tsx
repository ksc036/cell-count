import type { ChangeEvent } from "react";
import type { Patch, PatchCountSummary, TotalCountSummary } from "../types";

type PatchSummaryProps = {
  patches: Patch[];
  patchCounts: PatchCountSummary[];
  totalCounts: TotalCountSummary;
  manualCounts: Record<string, number>;
  onManualCountChange: (patchId: string, value: number) => void;
};

function PatchSummary({ patches, patchCounts, totalCounts, manualCounts, onManualCountChange }: PatchSummaryProps) {
  const patchMap = new Map(patchCounts.map((patchCount) => [patchCount.patchId, patchCount]));

  function handleChange(patchId: string, event: ChangeEvent<HTMLInputElement>) {
    const parsed = Number.parseInt(event.target.value || "0", 10);
    onManualCountChange(patchId, Number.isNaN(parsed) || parsed < 0 ? 0 : parsed);
  }

  return (
    <section className="panel summary-panel">
      <div className="summary-header">
        <div>
          <p className="panel-label">5. Patch review</p>
          <h2>Per-patch counts</h2>
        </div>
        <div className="totals-card">
          <span>Auto {totalCounts.automaticCount}</span>
          <span>Manual {totalCounts.manualAddedCount}</span>
          <strong>Total {totalCounts.finalCount}</strong>
        </div>
      </div>

      <div className="summary-list">
        {patches.map((patch) => {
          const count = patchMap.get(patch.id) ?? {
            patchId: patch.id,
            automaticCount: 0,
            manualAddedCount: 0,
            finalCount: 0
          };

          return (
            <article key={patch.id} className="patch-card">
              <header>
                <strong>{patch.label}</strong>
                <span>
                  {patch.width} x {patch.height}
                </span>
              </header>
              <div className="patch-metrics">
                <span>Auto {count.automaticCount}</span>
                <span>Final {count.finalCount}</span>
              </div>
              <label>
                Manual add
                <input
                  aria-label={`${patch.label} manual count`}
                  inputMode="numeric"
                  min={0}
                  type="number"
                  value={manualCounts[patch.id] ?? 0}
                  onChange={(event) => handleChange(patch.id, event)}
                />
              </label>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default PatchSummary;
