"use client";

import { SUGGESTED_CHAT_ACTIONS } from "@/lib/ai/suggested-actions";
import { Button } from "@/components/ui/button";

type SuggestedActionsProps = {
  disabled?: boolean;
  onSelect: (prompt: string) => void;
};

export function SuggestedActions({ disabled, onSelect }: SuggestedActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUGGESTED_CHAT_ACTIONS.map((action) => (
        <Button
          key={action.id}
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => onSelect(action.prompt)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
