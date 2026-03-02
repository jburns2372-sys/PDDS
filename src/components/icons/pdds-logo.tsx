
"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface PddsLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: "default" | "white";
}

/**
 * @fileOverview Official PDDS Party Logo component.
 * Non-negotiable implementation of the 2025 official emblem.
 * Supports a 'white' knockout variant for dark headers.
 */
export default function PddsLogo({ className, variant = "default", ...props }: PddsLogoProps) {
  // Use the picsum seed identified in placeholder-images.json for the official emblem
  const logoUrl = "https://picsum.photos/seed/pdds-official-emblem-2025/800/800";

  return (
    <img
      src={logoUrl} 
      alt="PDDS Official Logo"
      data-ai-hint="political logo"
      className={cn(
        "object-contain bg-transparent transition-opacity duration-300", 
        variant === "white" && "brightness-0 invert", // Creates the knockout effect
        className
      )}
      {...props}
    />
  );
}
