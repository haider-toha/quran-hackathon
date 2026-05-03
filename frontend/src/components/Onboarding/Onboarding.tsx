"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { usePreferences } from "@/lib/preferences-context";

import { ReadingPrefsStep } from "./ReadingPrefsStep";
import { SeedNoteStep } from "./SeedNoteStep";
import { SourcesStep } from "./SourcesStep";
import { WelcomeStep } from "./WelcomeStep";

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: Readonly<Record<Step, string>> = {
  1: "Welcome",
  2: "Sources",
  3: "Reading",
  4: "First note",
};

export function Onboarding() {
  const router = useRouter();
  const { markOnboarded } = usePreferences();
  const [step, setStep] = useState<Step>(1);

  const advance = useCallback(() => {
    setStep((prev) => (prev < 4 ? ((prev + 1) as Step) : prev));
  }, []);

  const skip = useCallback(() => {
    markOnboarded();
    router.push("/");
  }, [markOnboarded, router]);

  const finish = useCallback(() => {
    markOnboarded();
    router.push("/");
  }, [markOnboarded, router]);

  return (
    <div className="onboarding">
      <header className="onboard-hd">
        <span className="onboard-brand">Mishkāt</span>
        <ol className="onboard-steps" aria-label="Onboarding progress">
          {([1, 2, 3, 4] as const).map((n) => (
            <li
              key={n}
              className={
                n === step
                  ? "onboard-step-pip on"
                  : n < step
                    ? "onboard-step-pip done"
                    : "onboard-step-pip"
              }
              aria-current={n === step ? "step" : undefined}
            >
              <span className="onboard-step-pip-n">{n}</span>
              <span className="onboard-step-pip-label">{STEP_LABELS[n]}</span>
            </li>
          ))}
        </ol>
        <button type="button" className="onboard-skip" onClick={skip}>
          Skip for now
        </button>
      </header>

      <main className="onboard-main">
        {step === 1 ? <WelcomeStep onContinue={advance} /> : null}
        {step === 2 ? <SourcesStep onContinue={advance} /> : null}
        {step === 3 ? <ReadingPrefsStep onContinue={advance} /> : null}
        {step === 4 ? <SeedNoteStep onContinue={finish} /> : null}
      </main>
    </div>
  );
}
