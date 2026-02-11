import * as React from "react";
import { Checkbox } from "@/ui/primitives/checkbox";
import type { Operator } from "@/habilitaciones/types";

type OperatorPickerProps = {
  operators: Operator[];
  selected: string[];
  onChange: (next: string[]) => void;
};

export const OperatorPicker = ({ operators, selected, onChange }: OperatorPickerProps) => {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-3">
      {operators.map((operator) => (
        <div
          key={operator.id}
          className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/70 px-3 py-2"
        >
          <Checkbox
            checked={selected.includes(operator.id)}
            onCheckedChange={() => toggle(operator.id)}
          />
          <div>
            <p className="text-sm font-semibold text-foreground">{operator.name}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {operator.slug}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
