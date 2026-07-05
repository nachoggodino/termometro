import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "heat";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-contrast hover:brightness-95",
  secondary: "border border-border bg-surface-raised text-foreground hover:bg-surface",
  ghost: "bg-transparent text-foreground hover:bg-surface",
  heat: "bg-heat-calor text-foreground hover:brightness-98",
};

export function Button({ asChild, className, variant = "primary", ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-3 text-[0.875rem] font-semibold leading-none transition duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-55",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
