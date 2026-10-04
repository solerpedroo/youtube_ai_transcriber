"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  clearOnboardingCompleted,
  markOnboardingCompleted,
  readOnboardingCompleted,
} from "@/lib/onboarding/storage";
import { cn } from "cn";
import { ONBOARDING_STEPS, type OnboardingStep } from "./onboarding-steps";

const HIGHLIGHT_CLASS = "onboarding-highlight-ring";

function scrollToHighlight(step: OnboardingStep): void {
  if (!step.highlightSelector) return;
  window.requestAnimationFrame(() => {
    const target = document.querySelector(step.highlightSelector!);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function applyHighlight(selector?: string): () => void {
  if (!selector) return () => undefined;
  const target = document.querySelector(selector);
  if (!target || !(target instanceof HTMLElement)) return () => undefined;
  target.classList.add(HIGHLIGHT_CLASS);
  return () => target.classList.remove(HIGHLIGHT_CLASS);
}

export function OnboardingTour() {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const step = ONBOARDING_STEPS[stepIndex]!;
  const isLast = stepIndex === ONBOARDING_STEPS.length - 1;

  const finish = useCallback(() => {
    markOnboardingCompleted();
    setActive(false);
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      const next = ONBOARDING_STEPS[index];
      if (!next) return;
      setStepIndex(index);
      router.push(next.hash ? `${next.pathname}#${next.hash}` : next.pathname);
    },
    [router],
  );

  useEffect(() => {
    if (!readOnboardingCompleted()) {
      setActive(true);
    }
  }, []);

  useEffect(() => {
    function onRestart() {
      clearOnboardingCompleted();
      setStepIndex(0);
      setActive(true);
      router.push("/");
    }
    window.addEventListener("onboarding:restart", onRestart);
    return () => window.removeEventListener("onboarding:restart", onRestart);
  }, [router]);

  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const cleanupHighlight = applyHighlight(step.highlightSelector);
    const timer = window.setTimeout(() => scrollToHighlight(step), 350);
    return () => {
      window.clearTimeout(timer);
      cleanupHighlight();
    };
  }, [active, step]);

  useEffect(() => {
    if (!active || !step.hash) return;
    scrollToHighlight(step);
  }, [active, pathname, step]);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-lead"
    >
      <div
        className="absolute inset-0 bg-background/75 backdrop-blur-sm"
        aria-hidden
        onClick={finish}
      />

      <Card className="relative z-10 max-h-[min(90vh,720px)] w-full max-w-2xl overflow-y-auto shadow-xl ring-1 ring-border/80">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="label-caps text-brand">{step.eyebrow}</p>
              <CardTitle id="onboarding-title" className="text-xl font-semibold tracking-tight">
                {step.title}
              </CardTitle>
              <CardDescription id="onboarding-lead" className="text-sm leading-6">
                {step.lead}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              aria-label="Fechar tour"
              onClick={finish}
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Passo {stepIndex + 1} de {ONBOARDING_STEPS.length}
              </span>
              <span>{Math.round(((stepIndex + 1) / ONBOARDING_STEPS.length) * 100)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-300 ease-out"
                style={{ width: `${((stepIndex + 1) / ONBOARDING_STEPS.length) * 100}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {ONBOARDING_STEPS.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Ir para passo ${index + 1}: ${item.title}`}
                  aria-current={index === stepIndex ? "step" : undefined}
                  className={cn(
                    "size-2 rounded-full transition-colors",
                    index === stepIndex ? "bg-brand" : index < stepIndex ? "bg-brand/40" : "bg-muted-foreground/30",
                  )}
                  onClick={() => goToStep(index)}
                />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {step.body}

          {step.featureCards && (
            <div className="grid gap-3 sm:grid-cols-2">
              {step.featureCards.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="surface-inset rounded-xl border border-border/50 p-4 transition-colors hover:border-brand/25"
                >
                  <span className="icon-tile mb-3 grid size-9 place-items-center rounded-lg">
                    <Icon className="size-4 text-brand" strokeWidth={2} aria-hidden />
                  </span>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col-reverse gap-2 border-t border-border/60 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={finish}
          >
            Pular tour
          </Button>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={stepIndex === 0}
              onClick={() => goToStep(stepIndex - 1)}
            >
              <ArrowLeft className="size-4" />
              Voltar
            </Button>
            {isLast ? (
              <Button
                type="button"
                variant="brand"
                className="w-full sm:w-auto"
                onClick={finish}
              >
                <Check className="size-4" />
                Concluir
              </Button>
            ) : (
              <Button
                type="button"
                variant="brand"
                className="w-full sm:w-auto"
                onClick={() => goToStep(stepIndex + 1)}
              >
                Próximo
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
