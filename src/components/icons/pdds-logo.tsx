
"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { PDDS_LOGO_URL } from "@/lib/data";

interface PddsLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: "default" | "white";
}

/**
 * @fileOverview Official PDDS Party Logo component.
 * Synchronized with the global constant PDDS_LOGO_URL.
 * Supports a 'white' knockout variant for primary-colored headers.
 * Set to a high-impact default height for maximum brand visibility.
 */
export default function PddsLogo({ className, variant = "default", ...props }: PddsLogoProps) {
  return (
    <img
      src={PDDS_LOGO_URL} 
      alt="PDDS Official Party Logo"
      className={cn(
        "object-contain transition-all duration-300 bg-transparent h-20 w-auto", 
        variant === "white" && "brightness-0 invert",
        className
      )}
      {...props}
    />
  );
}
