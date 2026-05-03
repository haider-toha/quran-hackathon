"use client";

type Props = {
  onContinue: () => void;
};

export function WelcomeStep({ onContinue }: Props) {
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
        <button type="button" className="btn primary lg" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
