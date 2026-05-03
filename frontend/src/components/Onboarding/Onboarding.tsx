"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { usePreferences } from "@/hooks/usePreferences";
import {
  clearOnboardingStep,
  readOnboardingStep,
  writeOnboardingStep,
  type OnboardingStep,
} from "@/lib/onboarding-step-store";

import { ReadingPrefsStep } from "./ReadingPrefsStep";
import { SeedNoteStep } from "./SeedNoteStep";
import { SourcesStep } from "./SourcesStep";
import { WelcomeStep } from "./WelcomeStep";

const STEP_LABELS: Readonly<Record<OnboardingStep, string>> = {
  1: "Welcome",
  2: "Sources",
  3: "Reading",
  4: "First note",
};

const STEP_NUMBERS: readonly OnboardingStep[] = [1, 2, 3, 4];

function nextStep(step: OnboardingStep): OnboardingStep {
  if (step === 1) return 2;
  if (step === 2) return 3;
  if (step === 3) return 4;
  return 4;
}

function prevStep(step: OnboardingStep): OnboardingStep {
  if (step === 4) return 3;
  if (step === 3) return 2;
  if (step === 2) return 1;
  return 1;
}

export function Onboarding() {
  const router = useRouter();
  const { markOnboarded } = usePreferences();
  // Lazy initializer reads localStorage on the first client render so a
  // mid-flow refresh lands the user back where they were. SSR returns 1.
  const [step, setStep] = useState<OnboardingStep>(() => readOnboardingStep());

  // Persist the current step on every change. The clear happens in `skip`
  // and `finish` so a fresh-onboarded user doesn't carry stale cursor data.
  useEffect(() => {
    writeOnboardingStep(step);
  }, [step]);

  const advance = useCallback(() => {
    setStep((prev) => nextStep(prev));
  }, []);

  const back = useCallback(() => {
    setStep((prev) => prevStep(prev));
  }, []);

  const skip = useCallback(() => {
    clearOnboardingStep();
    markOnboarded();
    router.push("/");
  }, [markOnboarded, router]);

  const finish = useCallback(() => {
    clearOnboardingStep();
    markOnboarded();
    router.push("/");
  }, [markOnboarded, router]);

  return (
    <div className="onboarding">
      <header className="onboard-hd">
        <span className="onboard-brand">Mishkat</span>
        <ol className="onboard-steps" aria-label="Onboarding progress">
          {STEP_NUMBERS.map((n) => (
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
        {step === 2 ? <SourcesStep onContinue={advance} onBack={back} /> : null}
        {step === 3 ? <ReadingPrefsStep onContinue={advance} onBack={back} /> : null}
        {step === 4 ? <SeedNoteStep onContinue={finish} onBack={back} /> : null}
      </main>
    </div>
  );
}
