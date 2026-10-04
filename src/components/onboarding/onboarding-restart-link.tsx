"use client";

import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OnboardingRestartLink() {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full justify-start gap-2 sm:w-auto"
      onClick={() => window.dispatchEvent(new Event("onboarding:restart"))}
    >
      <Compass className="size-4" aria-hidden />
      Refazer tour de boas-vindas
    </Button>
  );
}
