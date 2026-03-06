"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { PDDS_LOGO_URL } from "@/lib/data";

interface PddsLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: "default" | "white";
}

/**
 * @fileOverview Official PDDS Party Logo component.
 * Hardened for brand lockdown with standardized source and layout integrity.
 */
export default function PddsLogo({ className, variant = "default", ...props }: PddsLogoProps) {
  return (
    <img
      src={PDDS_LOGO_URL} 
      alt="Official PDDS Party Logo"
      className={cn(
        "object-contain aspect-square shrink-0 transition-all duration-300", 
        variant === "white" && "brightness-0 invert",
        className
      )}
      crossOrigin="anonymous"
      {...props}
    />
  );
}
