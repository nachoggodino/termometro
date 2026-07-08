import { LINE_COLORS, type MetroLine } from "@/lib/domain/lines";
import { cn } from "@/lib/utils";

export function LineBadge({
  line,
  className,
}: {
  line: MetroLine;
  className?: string;
}) {
  return (
    <span
      className={cn("rounded-sm px-1.5 py-1 text-xs font-bold", className)}
      style={{
        background: LINE_COLORS[line].fill,
        color: LINE_COLORS[line].textOnFill,
      }}
    >
      {line}
    </span>
  );
}
