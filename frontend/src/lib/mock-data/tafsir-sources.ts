import type { TafsirSource } from "@/types";

export const TAFSIR_SOURCES: readonly TafsirSource[] = [
  {
    id: "sadi",
    name: "Tafsir As-Sadi",
    author: "Abd ar-Rahman as-Sadi",
    century: "14th AH / 20th CE",
    language: "Arabic",
    methodology:
      "Tafsir bil-mathur — accessible, pastoral, weighted toward meaning over linguistic minutiae.",
    enabledByDefault: true,
    isCanonical: true,
  },
  {
    id: "kathir",
    name: "Tafsir Ibn Kathir",
    author: "Ismail ibn Kathir",
    century: "8th AH / 14th CE",
    language: "Arabic",
    methodology:
      "Tafsir bil-mathur — heavy use of hadith, asbab al-nuzul, and salaf interpretations. The standard reference.",
    enabledByDefault: true,
    isCanonical: true,
  },
  {
    id: "qurtubi",
    name: "Tafsir al-Qurtubi",
    author: "Muhammad al-Qurtubi",
    century: "7th AH / 13th CE",
    language: "Arabic",
    methodology:
      "Comprehensive — fiqh-oriented, draws across schools, dense with linguistic analysis.",
    enabledByDefault: true,
    isCanonical: false,
  },
  {
    id: "tabari",
    name: "Tafsir at-Tabari",
    author: "Muhammad ibn Jarir at-Tabari",
    century: "4th AH / 10th CE",
    language: "Arabic",
    methodology: "Foundational. Catalogs early commentary; preserves chains of transmission.",
    enabledByDefault: true,
    isCanonical: false,
  },
  {
    id: "maududi",
    name: "Tafhim al-Quran",
    author: "Abu al-Ala Mawdudi",
    century: "14th AH / 20th CE",
    language: "Urdu / English",
    methodology: "Modern, thematic, oriented to contemporary social and political concerns.",
    enabledByDefault: false,
    isCanonical: false,
  },
  {
    id: "razi",
    name: "Tafsir al-Razi",
    author: "Fakhr ad-Din ar-Razi",
    century: "6th AH / 12th CE",
    language: "Arabic",
    methodology:
      "Theological/philosophical — explores kalam, rational arguments, multiple interpretive possibilities.",
    enabledByDefault: false,
    isCanonical: false,
  },
];
