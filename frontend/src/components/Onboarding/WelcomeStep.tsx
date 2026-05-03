"use client";

import { useTransition } from "react";

type Props = {
  onContinue: () => void;
};

export function WelcomeStep({ onContinue }: Props) {
  // Use a transition for the Continue tap. There's no Server Action wired
  // yet, but staging the handler through `startTransition` lets us flip the
  // button into a `disabled={pending}` state once a real persistence call
  // (e.g. a Server Action that records "user accepted onboarding step 1")
  // is added. Today the body is sync, so `pending` flips off in the same
  // tick — but the wiring stays put.
  const [pending, startTransition] = useTransition();

  const handleContinue = () => {
    startTransition(() => {
      onContinue();
    });
  };

  return (
    <div className="onboard-step">
      <div className="onboard-body">
        <h2 className="onboard-title">Welcome to Mishkāt</h2>
        <p className="onboard-lede">
          Mishkāt is a study companion grounded in tafsir. Not a fatwa engine. Not a substitute for
          scholars.
        </p>
      </div>
      <div className="onboard-actions">
        <button
          type="button"
          className="btn primary lg"
          onClick={handleContinue}
          disabled={pending}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
