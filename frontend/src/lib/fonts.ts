import { Amiri_Quran, Geist, Geist_Mono, Newsreader } from "next/font/google";

// `latin-ext` is critical: Latin Extended Additional (ḍ, ḥ, ẓ, ṣ, ṭ, ī, ā,
// ū, ʿ, ʾ etc.) lives there. Without it the browser silently falls back to
// the next font in the stack for any glyph in that range, which renders at
// a different weight than the surrounding Newsreader text — that's why
// Arabic transliteration looked like it was being rendered bold.
export const newsreader = Newsreader({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display-stack",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const geistSans = Geist({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans-stack",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const geistMono = Geist_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono-stack",
  display: "swap",
  weight: ["400", "500"],
});

export const amiriQuran = Amiri_Quran({
  subsets: ["arabic"],
  variable: "--font-arabic-stack",
  display: "swap",
  weight: "400",
});

export const fontVariableClassName = [
  newsreader.variable,
  geistSans.variable,
  geistMono.variable,
  amiriQuran.variable,
].join(" ");
