
"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { PDDS_LOGO_URL } from "@/lib/data";

interface PddsLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: "default" | "white";
}

/**
 * @fileOverview Official PDDS Party Logo component.
 * Non-negotiable implementation of the PDDS emblem.
 * Supports a 'white' knockout variant for dark headers.
 */
export default function PddsLogo({ className, variant = "default", ...props }: PddsLogoProps) {
  return (
    <img
      src={PDDS_LOGO_URL} 
      alt="PDDS Official Party Logo"
      className={cn(
        "object-contain transition-all duration-300", 
        variant === "white" && "brightness-0 invert contrast-[200%]", // Enhanced knockout for better visibility on dark backgrounds
        className
      )}
      {...props}
    />
  );
}
