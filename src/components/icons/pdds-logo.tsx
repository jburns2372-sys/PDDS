
import { cn } from "@/lib/utils";
import React from "react";

/**
 * @fileOverview Official PDDS Party Logo component.
 * Uses the party's official emblem across all platforms.
 */
export default function PddsLogo({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="https://picsum.photos/seed/pdds-official-emblem/400/400" 
      alt="PDDS Official Logo"
      data-ai-hint="political logo"
      className={cn(
        "object-contain mix-blend-multiply bg-transparent", 
        className
      )}
      {...props}
    />
  );
}
