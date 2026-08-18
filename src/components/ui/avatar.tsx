import { cn, initials as initialsOf } from "@/lib/utils";

const GRADIENTS = [
  "from-indigo-500 to-violet-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
];

export function Avatar({
  name,
  color,
  size = "md",
  className,
}: {
  name: string;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    xs: "size-5 text-[8px]",
    sm: "size-6.5 text-[10px]",
    md: "size-8 text-xs",
    lg: "size-10 text-sm",
  };
  const gradient = color ?? GRADIENTS[name.length % GRADIENTS.length];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white",
        gradient,
        sizes[size],
        className
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

export function SymbolIcon({
  symbol,
  color,
  size = "md",
  className,
}: {
  symbol: string;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    xs: "size-5 text-[8px]",
    sm: "size-6 text-[9px]",
    md: "size-8 text-[10px]",
    lg: "size-10 text-xs",
  };
  const bg = color
    ? { background: `${color}1a`, color }
    : { background: "rgba(99,102,241,0.15)", color: "#818cf8" };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-bold",
        sizes[size],
        className
      )}
      style={bg}
    >
      {symbol.slice(0, 4)}
    </span>
  );
}