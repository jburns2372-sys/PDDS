
import { cn } from "@/lib/utils";
import React from "react";

/**
 * @fileOverview Official PDDS Party Logo component.
 * Uses the party's color emblem with background blending for a clean look.
 */
export default function PddsLogo({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      // Using a placeholder that represents the uploaded logo asset. 
      // In a local environment, the user would place the transparent PNG in /public/logo.png
      src="https://picsum.photos/seed/pdds-emblem/400/400" 
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
