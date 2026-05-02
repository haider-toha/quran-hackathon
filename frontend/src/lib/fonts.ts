import { Amiri_Quran, Geist, Geist_Mono, Newsreader } from "next/font/google";

export const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-display-stack",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans-stack",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const geistMono = Geist_Mono({
  subsets: ["latin"],
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
