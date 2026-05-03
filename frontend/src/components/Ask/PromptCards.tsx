"use client";

// PromptCards — the empty-state scaffolding grid. Four archetypes the user
// can click to drop a templated question into the input. Templates are
// expanded with the active scope's surah/verse references so the card label
// and the typed question reference exactly what the AI is currently looking
// at.

import { ColumnsIcon, type IconProps, LayersIcon, ReflectIcon, TimeIcon } from "@/components/Icon";
import { useScope } from "@/lib/scope-context";

type Props = {
  onPick: (question: string) => void;
};

type CardKey = "compare" | "asbab" | "themes" | "word";

type Card = {
  key: CardKey;
  label: string;
  example: string;
  icon: (props: IconProps) => React.ReactElement;
  buildQuestion: (scope: {
    surahLabel: string;
    surahNumber: number;
    range: { start: number; end: number };
  }) => string;
};

const CARDS: readonly Card[] = [
  {
    key: "compare",
    label: "Compare tafsirs",
    example: "How do Ibn Kathir and Al-Tabari differ on this passage?",
    icon: ColumnsIcon,
    buildQuestion: ({ surahLabel, surahNumber, range }) =>
      `How do Ibn Kathir and Al-Tabari differ on ${surahLabel} ${surahNumber}:${
        range.start === range.end ? range.start : `${range.start}-${range.end}`
      }?`,
  },
  {
    key: "asbab",
    label: "Asbab al-nuzul",
    example: "What was the occasion of revelation for this passage?",
    icon: TimeIcon,
    buildQuestion: ({ surahLabel, surahNumber, range }) =>
      `What was the occasion of revelation (asbab al-nuzul) for ${surahLabel} ${surahNumber}:${
        range.start === range.end ? range.start : `${range.start}-${range.end}`
      }?`,
  },
  {
    key: "themes",
    label: "Thematic links",
    example: "What other surahs discuss the themes here?",
    icon: LayersIcon,
    buildQuestion: ({ surahLabel, surahNumber, range }) =>
      `What other surahs discuss the themes in ${surahLabel} ${surahNumber}:${
        range.start === range.end ? range.start : `${range.start}-${range.end}`
      }?`,
  },
  {
    key: "word",
    label: "Word study",
    example: "What does a key word mean linguistically and in context?",
    icon: ReflectIcon,
    buildQuestion: ({ surahLabel, surahNumber, range }) =>
      `What does a key word in ${surahLabel} ${surahNumber}:${
        range.start === range.end ? range.start : `${range.start}-${range.end}`
      } mean linguistically and in context?`,
  },
];

export function PromptCards({ onPick }: Props) {
  const scope = useScope();
  return (
    <div className="prompt-cards" role="list">
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.key}
            type="button"
            role="listitem"
            className="prompt-card"
            onClick={() =>
              onPick(
                card.buildQuestion({
                  surahLabel: scope.surahLabel,
                  surahNumber: scope.surahNumber,
                  range: scope.range,
                }),
              )
            }
          >
            <span className="prompt-card-icon" aria-hidden>
              <Icon size={14} />
            </span>
            <span className="prompt-card-label">{card.label}</span>
            <span className="prompt-card-example">{card.example}</span>
          </button>
        );
      })}
    </div>
  );
}
