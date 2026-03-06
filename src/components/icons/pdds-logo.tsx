"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { PDDS_LOGO_URL } from "@/lib/data";

interface PddsLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: "default" | "white";
}

/**
 * @fileOverview Standardized PDDS Logo Component.
 * Optimized for brand lockdown with high-intensity gold glow and public link.
 */
export default function PddsLogo({ className, variant = "default", style, ...props }: PddsLogoProps) {
  return (
    <img
      src={PDDS_LOGO_URL} 
      alt="Official PDDS Party Logo"
      className={cn(
        "object-contain aspect-square shrink-0 transition-all duration-300", 
        variant === "white" && "brightness-0 invert",
        className
      )}
      style={{
        height: '50px',
        width: 'auto',
        filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.5))',
        ...style
      }}
      crossOrigin="anonymous"
      onError={(e) => console.error("Branding Error: Official Logo failed to load. Check Firebase Rules.")}
      {...props}
    />
  );
}
