"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { PDDS_LOGO_URL } from "@/lib/data";

interface PddsLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: "default" | "white";
}

/**
 * @fileOverview Reusable PDDS Logo Component.
 * Optimized for high-fidelity rendering across all organizational terminals.
 */
export default function PddsLogo({ className, variant = "default", style, ...props }: PddsLogoProps) {
  return (
    <div className="flex items-center justify-start bg-transparent shrink-0">
      <img
        src={PDDS_LOGO_URL}
        alt="Official PDDS Party Logo"
        crossOrigin="anonymous"
        className={cn(
          "object-contain aspect-square duration-300 shadow-none transition-opacity",
          variant === "white" && "brightness-0 invert",
          className
        )}
        style={{
          filter: 'drop-shadow(0px 0px 10px rgba(212, 175, 55, 0.5))',
          ...style
        }}
        {...props}
        onError={(e) => {
          console.error("❌ Registry Component: Logo access denied.");
        }}
      />
    </div>
  );
}
