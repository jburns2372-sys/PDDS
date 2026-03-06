"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { PDDS_LOGO_URL } from "@/lib/data";

interface PddsLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: "default" | "white";
}

/**
 * @fileOverview Standardized PDDS Logo Component.
 * Optimized for brand lockdown with fixed square geometry and gold glow.
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
        height: '60px',
        width: 'auto',
        filter: 'drop-shadow(0px 0px 8px rgba(255, 215, 0, 0.4))',
        ...style
      }}
      crossOrigin="anonymous"
      onError={(e) => console.error("Logo failed to load from Firebase. Check Storage permissions.")}
      {...props}
    />
  );
}