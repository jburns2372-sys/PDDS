
"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { PDDS_LOGO_URL } from "@/lib/data";

interface PddsLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: "default" | "white";
}

/**
 * @fileOverview Official PDDS Party Logo component.
 * Hardened for visibility on all backgrounds.
 * Uses the official PDDS_LOGO_URL defined in the data layer.
 */
export default function PddsLogo({ className, variant = "default", ...props }: PddsLogoProps) {
  // We use a high-fidelity image source. 
  // Restricted filters removed to ensure the original branding is always visible.
  return (
    <img
      src={PDDS_LOGO_URL} 
      alt="PDDS Official Party Logo"
      className={cn(
        "object-contain transition-all duration-300 bg-transparent h-20 w-auto", 
        className
      )}
      crossOrigin="anonymous"
      {...props}
    />
  );
}
