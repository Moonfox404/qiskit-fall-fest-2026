export interface LevelClearMetrics {
  estimate: number;
  idealExpectation: number;
  accuracy: number;
  distance: number;
  uncertainty: number;
  funding: number;
  recommendedFunding: number;
}

export const LevelClearedScreen = ({
  levelNumber,
  isFinalLevel,
  metrics,
  onRetry,
  onContinue,
}: {
  levelNumber: number;
  isFinalLevel: boolean;
  metrics: LevelClearMetrics;
  onRetry: () => void;
  onContinue: () => void;
}) => {
  const belowRecommendedFunding = metrics.funding < metrics.recommendedFunding;
  const proximity = metrics.accuracy >= 0.95
    ? 'Very close'
    : metrics.accuracy >= 0.85
      ? 'Close'
      : metrics.accuracy >= 0.7
        ? 'Some room to improve'
        : 'Needs refinement';

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/80 p-4 text-game-text">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="level-cleared-title"
        className="w-full max-w-xl rounded-xl border border-game-accent/30 bg-game-card p-6 shadow-2xl sm:p-8"
      >
        <h1 id="level-cleared-title" className="text-center text-3xl font-bold text-game-accent">
          Level {levelNumber} cleared!
        </h1>
        <div className="mt-6 rounded-lg bg-game-primary p-5">
          <h2 className="mb-3 font-semibold">How close was your result?</h2>
          <dl className="space-y-2 text-sm text-game-text/75">
            <div className="flex justify-between gap-4">
              <dt>Estimate quality</dt>
              <dd className="font-semibold text-game-text">{proximity}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Trial variation (standard deviation)</dt>
              <dd className="font-mono text-game-text">{metrics.uncertainty.toFixed(3)}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-4 rounded-lg border border-game-accent/30 bg-game-accent/10 p-5">
          <div className="flex justify-between gap-4">
            <span>Funding awarded</span>
            <strong className="text-game-accent">${metrics.funding}</strong>
          </div>
          <div className="mt-2 flex justify-between gap-4 text-sm text-game-text/70">
            <span>Recommended funding</span>
            <span>${metrics.recommendedFunding}</span>
          </div>
        </div>

        {belowRecommendedFunding && (
          <p className="mt-4 text-center text-game-text/80">
            You earned less than the recommended funding. Retry this level for a better result, or continue with your current funding.
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {belowRecommendedFunding && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md border border-game-text/20 px-5 py-3 font-semibold text-game-text transition-colors hover:bg-game-primary"
            >
              Retry level
            </button>
          )}
          <button
            type="button"
            onClick={onContinue}
            className="rounded-md bg-game-accent px-5 py-3 font-semibold text-game-primary transition-colors hover:bg-game-accent/80"
          >
            {isFinalLevel ? 'Finish game' : 'Continue to next level'}
          </button>
        </div>
      </section>
    </div>
  );
};
