"use client";

// Deep-research running and completed states. Idle is no longer a
// dedicated card — the entry point is now the inline "Run deep research"
// link beneath the query input.

export function DeepRunningState() {
  return (
    <div role="status" aria-live="polite" className="deep-research-state running">
      <div className="deep-research-state-title">Deep research running…</div>
      <div className="deep-research-state-body">We&rsquo;ll notify you when this completes.</div>
      <div aria-hidden="true" className="deep-research-state-progress">
        <span />
      </div>
    </div>
  );
}

export function DeepCompletedState({ onView }: { onView: () => void }) {
  return (
    <div className="deep-research-state completed">
      <div className="deep-research-state-title">Deep research complete</div>
      <div className="deep-research-state-body">The report is ready for review.</div>
      <div>
        <button type="button" className="btn sm primary" onClick={onView}>
          View results
        </button>
      </div>
    </div>
  );
}
