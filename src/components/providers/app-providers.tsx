"use client";

import { useEffect, type ReactNode } from "react";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { ThemeSync } from "@/components/providers/theme-sync";
import { useProjectStore } from "@/stores/project-store";
import { useSettingsStore } from "@/stores/settings-store";

/** Hydrates browser-only state after the server and first client render agree. */
export function AppProviders({ children }: { children: ReactNode }) {
  const hydrateProjects = useProjectStore((state) => state.hydrate);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);

  useEffect(() => {
    hydrateProjects();
    hydrateSettings();
  }, [hydrateProjects, hydrateSettings]);

  return (
    <>
      <ThemeSync />
      <OnboardingTour />
      {children}
    </>
  );
}
