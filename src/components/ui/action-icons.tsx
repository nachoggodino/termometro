import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReportActionIcon({ className }: { className?: string }) {
  return <TriangleAlert aria-hidden="true" className={cn("shrink-0", className)} />;
}

export function ExploreActionIcon({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("flex shrink-0 items-end justify-center gap-1.5", className)}>
      <span className="h-4 w-1.5 rounded-sm bg-heat-fresco" />
      <span className="h-6 w-1.5 rounded-sm bg-success" />
      <span className="h-5 w-1.5 rounded-sm bg-heat-infierno" />
    </span>
  );
}
