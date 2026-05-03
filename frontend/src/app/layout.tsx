import type { Metadata } from "next";

import { AppShell } from "@/components/AppShell";
import { FlagsProvider } from "@/hooks/useFeatureFlags";
import { PreferencesProvider } from "@/hooks/usePreferences";
import { fontVariableClassName } from "@/lib/fonts";
import { PREFERENCES_BOOTSTRAP_SCRIPT } from "@/lib/preferences-bootstrap";

import "./globals.css";

export const metadata: Metadata = {
  title: "Mishkat — A reader for the Quran",
  description:
    "Read, ask, and write alongside the classical tafsir corpus. A contemplative, source-first companion for the Quran.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariableClassName} suppressHydrationWarning>
      <head>
        <script
          // Set theme + rooting attributes before paint to avoid flash.
          // The script reads from the same localStorage key the provider uses.
          dangerouslySetInnerHTML={{ __html: PREFERENCES_BOOTSTRAP_SCRIPT }}
        />
      </head>
      <body>
        <PreferencesProvider>
          <FlagsProvider>
            <AppShell>{children}</AppShell>
          </FlagsProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
