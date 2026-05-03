"use client";

import clsx from "clsx";

import { CheckIcon, LockIcon, PlusIcon } from "@/components/Icon";

/**
 * Sources chip row for the Ask screen. Tafsir and Quran are always-on and
 * locked (rendered with a lock icon, `cursor: not-allowed`, and a title
 * explaining why). My notes is the only user-controllable toggle.
 *
 * External research lives only on the Research screen, so it is not present
 * here.
 */
export type SourceModeValue = {
  myNotes: boolean;
};

export const DEFAULT_SOURCE_MODE: SourceModeValue = {
  myNotes: false,
};

type Props = {
  value: SourceModeValue;
  onChange: (value: SourceModeValue) => void;
};

const LOCKED_REASON = "Quran and Tafsir are always-on for grounded answers.";

export function SourceMode({ value, onChange }: Props) {
  function toggleMyNotes() {
    onChange({ ...value, myNotes: !value.myNotes });
  }

  return (
    <div className="source-mode">
      <span className="lbl">Sources</span>
      <span
        className={clsx("opt", "on")}
        aria-disabled="true"
        title={LOCKED_REASON}
        style={{ cursor: "not-allowed" }}
      >
        <LockIcon size={11} />
        Tafsir
      </span>
      <span
        className={clsx("opt", "on")}
        aria-disabled="true"
        title={LOCKED_REASON}
        style={{ cursor: "not-allowed" }}
      >
        <LockIcon size={11} />
        Quran
      </span>
      <button
        type="button"
        className={clsx("opt", value.myNotes && "on")}
        onClick={toggleMyNotes}
        aria-pressed={value.myNotes}
      >
        {value.myNotes ? <CheckIcon size={11} /> : <PlusIcon size={11} />}
        My notes
      </button>
    </div>
  );
}
