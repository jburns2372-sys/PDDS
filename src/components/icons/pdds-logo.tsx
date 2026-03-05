
"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { PDDS_LOGO_URL } from "@/lib/data";

interface PddsLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: "default" | "white";
}

/**
 * @fileOverview Official PDDS Party Logo component.
 * Hardened for visibility on all backgrounds and aspect ratio integrity.
 */
export default function PddsLogo({ className, variant = "default", ...props }: PddsLogoProps) {
  return (
    <img
      src={PDDS_LOGO_URL} 
      alt="PDDS Official Party Logo"
      className={cn(
        "object-contain aspect-square shrink-0 transition-all duration-300 bg-transparent", 
        className
      )}
      crossOrigin="anonymous"
      {...props}
    />
  );
}
