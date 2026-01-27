import { create } from "zustand";
import type { FormSchema } from "@/lib/types";
import { forms as seedForms } from "@/db/constants";

type FormsState = {
  forms: FormSchema[];
};

type FormsActions = {
  saveFormSchema: (schema: FormSchema) => void;
};

export const useFormsStore = create<FormsState & FormsActions>()(
  (set) => ({
    forms: seedForms,
    saveFormSchema: (schema) =>
      set((state) => {
        const exists = state.forms.some((form) => form.eventId === schema.eventId);
        return {
          forms: exists
            ? state.forms.map((form) =>
                form.eventId === schema.eventId ? schema : form,
              )
            : [...state.forms, schema],
        };
      }),
  }),
);
