"use client";

import { Check } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SearchComboboxOption = {
  id: string;
  label: string;
};

export function SearchCombobox<T extends SearchComboboxOption>({
  ariaDescribedBy,
  ariaInvalid = false,
  inputId,
  invalidMessage,
  leadingIcon,
  onQueryChange,
  onQueryEdited,
  onSelect,
  options,
  placeholder,
  query,
  renderOption,
  selectedId,
}: {
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
  inputId?: string;
  invalidMessage?: string;
  leadingIcon?: ReactNode;
  onQueryChange: (value: string) => void;
  onQueryEdited?: () => void;
  onSelect: (option: T) => void;
  options: T[];
  placeholder: string;
  query: string;
  renderOption?: (option: T) => ReactNode;
  selectedId: string | null;
}) {
  const generatedInputId = useId();
  const listboxId = useId();
  const internalErrorId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [invalid, setInvalid] = useState(false);
  const resolvedInputId = inputId ?? generatedInputId;
  const selected = selectedId ? options.find((option) => option.id === selectedId) ?? null : null;
  const selectedMatchesQuery = selected && normalize(selected.label) === normalize(query);

  function choose(option: T) {
    onQueryChange(option.label);
    onSelect(option);
    setOpen(false);
    setActiveIndex(0);
    setInvalid(false);
  }

  function findExact() {
    const normalizedQuery = normalize(query);
    return options.find((option) => normalize(option.label) === normalizedQuery) ?? null;
  }

  function handleBlur() {
    const exact = findExact();
    if (exact) choose(exact);
    window.setTimeout(() => setOpen(false), 0);
  }

  const describedBy = [ariaDescribedBy, invalid && invalidMessage ? internalErrorId : null]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div>
      <div className="relative">
        {leadingIcon}
        <input
          aria-activedescendant={
            open && options[activeIndex] ? `${listboxId}-${options[activeIndex].id}` : undefined
          }
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-describedby={describedBy}
          aria-expanded={open}
          aria-invalid={ariaInvalid || invalid}
          className="min-h-11 w-full rounded-md border border-border bg-background py-2 pl-9 pr-9 text-sm font-semibold outline-none transition duration-200 ease-out placeholder:text-muted focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          id={resolvedInputId}
          onBlur={handleBlur}
          onChange={(event) => {
            onQueryChange(event.target.value);
            onQueryEdited?.();
            setInvalid(false);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => Math.min(index + 1, Math.max(0, options.length - 1)));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => Math.max(0, index - 1));
            } else if (event.key === "Enter") {
              event.preventDefault();
              if (open && options[activeIndex]) {
                choose(options[activeIndex]);
                return;
              }
              const exact = findExact();
              if (exact) choose(exact);
              else if (invalidMessage) setInvalid(true);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          role="combobox"
          value={query}
        />
        {selectedMatchesQuery ? (
          <Check
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-primary"
          />
        ) : null}

        {open && options.length > 0 ? (
          <ul
            className="absolute left-0 right-0 top-full z-[var(--z-popover)] mt-1 max-h-60 overflow-y-auto rounded-md border border-border bg-surface-raised p-1 shadow-[var(--shadow-popover)]"
            id={listboxId}
            role="listbox"
          >
            {options.map((option, index) => {
              const active = index === activeIndex;
              const isSelected = option.id === selectedId;
              return (
                <li
                  aria-selected={isSelected}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-2 text-sm transition",
                    active ? "bg-surface text-foreground" : "text-foreground hover:bg-surface",
                  )}
                  id={`${listboxId}-${option.id}`}
                  key={option.id}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    choose(option);
                  }}
                  role="option"
                >
                  {renderOption ? renderOption(option) : <span>{option.label}</span>}
                  {isSelected ? <Check aria-hidden="true" className="size-4 shrink-0 text-primary" /> : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      {invalid && invalidMessage ? (
        <p className="mt-2 text-[0.6875rem] font-semibold leading-4 text-danger" id={internalErrorId}>
          {invalidMessage}
        </p>
      ) : null}
    </div>
  );
}

function normalize(value: string) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
