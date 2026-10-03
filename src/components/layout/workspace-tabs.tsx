"use client";

import type { KeyboardEvent } from "react";

type WorkspaceTabId = "video" | "transcript" | "chat";

type WorkspaceTabsProps = {
  tabs: Array<{ id: WorkspaceTabId; label: string }>;
  active: WorkspaceTabId;
  onChange: (tab: WorkspaceTabId) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  className?: string;
};

export function WorkspaceTabs({ tabs, active, onChange, onKeyDown, className = "" }: WorkspaceTabsProps) {
  return (
    <div
      className={`surface-card flex gap-1 p-1 ${className}`.trim()}
      role="tablist"
      aria-label="Seções do espaço de trabalho"
      onKeyDown={onKeyDown}
    >
      {tabs.map((item) => {
        const selected = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`workspace-tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`workspace-panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              selected ? "workspace-tab-active text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
