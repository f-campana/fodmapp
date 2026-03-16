export const scoreBarRecommendedUsageCode = `import { ScoreBar } from "@fodmapp/ui/score-bar";

export function SafetyScoreSummary() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span>FODMAP safety score</span>
        <span>0.62</span>
      </div>
      <ScoreBar label="FODMAP safety score" value={0.62} />
    </div>
  );
}`;
