import type { Patch, PatchCountSummary, TotalCountSummary } from "../types";

type PatchSummaryProps = {
  patches: Patch[];
  patchCounts: PatchCountSummary[];
  totalCounts: TotalCountSummary;
  manualCounts: Record<string, number>;
  onManualCountChange: (patchId: string, value: number) => void;
  onPatchOpen: (patchId: string) => void;
};

function PatchSummary({ patches, patchCounts, totalCounts, manualCounts: _manualCounts, onManualCountChange: _onManualCountChange, onPatchOpen }: PatchSummaryProps) {
  const patchMap = new Map(patchCounts.map((patchCount) => [patchCount.patchId, patchCount]));

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
              <button type="button" onClick={() => onPatchOpen(patch.id)}>
                Patch 상세 보기
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default PatchSummary;
