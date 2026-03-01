
import { cn } from "@/lib/utils";
import React from "react";

/**
 * @fileOverview Official PDDS Party Logo component.
 * Updated with the new 2025 official emblem featuring the fist and scales of justice.
 */
export default function PddsLogo({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="https://picsum.photos/seed/pdds-logo-2025-final/400/400" 
      alt="PDDS Official Logo"
      data-ai-hint="political logo"
      className={cn(
        "object-contain bg-transparent transition-opacity duration-300", 
        className
      )}
      {...props}
    />
  );
}
