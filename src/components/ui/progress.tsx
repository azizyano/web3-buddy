"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  indicatorColor?: string;
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, indicatorColor, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "h-2 w-full overflow-hidden rounded-full bg-gray-800",
          className
        )}
        {...props}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${value}%`,
            backgroundColor: indicatorColor || "#3b82f6", // Default to blue
          }}
        />
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };