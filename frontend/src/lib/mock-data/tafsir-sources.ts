import type { TafsirSource } from "@/types";

export const TAFSIR_SOURCES: readonly TafsirSource[] = [
  {
    id: "sadi",
    name: "Tafsir As-Saʿdī",
    author: "ʿAbd ar-Raḥmān as-Saʿdī",
    century: "14th AH / 20th CE",
    language: "Arabic",
    methodology:
      "Tafsīr bil-maʾthūr — accessible, pastoral, weighted toward meaning over linguistic minutiae.",
    enabledByDefault: true,
    isCanonical: true,
  },
  {
    id: "kathir",
    name: "Tafsir Ibn Kathīr",
    author: "Ismāʿīl ibn Kathīr",
    century: "8th AH / 14th CE",
    language: "Arabic",
    methodology:
      "Tafsīr bil-maʾthūr — heavy use of hadith, asbāb al-nuzūl, and salaf interpretations. The standard reference.",
    enabledByDefault: true,
    isCanonical: true,
  },
  {
    id: "qurtubi",
    name: "Tafsir al-Qurṭubī (Al-Jāmiʿ li-Aḥkām al-Qurʾān)",
    author: "Muḥammad al-Qurṭubī",
    century: "7th AH / 13th CE",
    language: "Arabic",
    methodology:
      "Comprehensive — fiqh-oriented, draws across schools, dense with linguistic analysis.",
    enabledByDefault: true,
    isCanonical: false,
  },
  {
    id: "tabari",
    name: "Tafsir aṭ-Ṭabarī (Jāmiʿ al-Bayān)",
    author: "Muḥammad ibn Jarīr aṭ-Ṭabarī",
    century: "4th AH / 10th CE",
    language: "Arabic",
    methodology: "Foundational. Catalogs early commentary; preserves chains of transmission.",
    enabledByDefault: true,
    isCanonical: false,
  },
  {
    id: "maududi",
    name: "Tafhīm al-Qurʾān",
    author: "Abū al-Aʿlā Mawdūdī",
    century: "14th AH / 20th CE",
    language: "Urdu / English",
    methodology: "Modern, thematic, oriented to contemporary social and political concerns.",
    enabledByDefault: false,
    isCanonical: false,
  },
  {
    id: "razi",
    name: "Tafsir al-Kabīr (Mafātīḥ al-Ghayb)",
    author: "Fakhr ad-Dīn ar-Rāzī",
    century: "6th AH / 12th CE",
    language: "Arabic",
    methodology:
      "Theological/philosophical — explores kalām, rational arguments, multiple interpretive possibilities.",
    enabledByDefault: false,
    isCanonical: false,
  },
];
