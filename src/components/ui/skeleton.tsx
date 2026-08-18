import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r from-raised via-overlay to-raised bg-[length:400px_100%] animate-shimmer",
        className
      )}
      {...props}
    />
  );
}

export function SkeletonText({ className }: { className?: string }) {
  return <Skeleton className={cn("h-3.5 w-full", className)} />;
}