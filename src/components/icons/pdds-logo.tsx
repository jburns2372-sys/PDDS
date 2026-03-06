"use client";

import { cn } from "@/lib/utils";
import React, { useMemo } from "react";
import { PDDS_LOGO_URL } from "@/lib/data";

interface PddsLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: "default" | "white";
}

/**
 * @fileOverview Reusable PDDS Logo Component.
 * Synchronized with the Architect's Direct-Link Force Fix: 
 * Timestamp cache-busting, CORS handling, and no typographic fallbacks.
 */
export default function PddsLogo({ className, variant = "default", style, ...props }: PddsLogoProps) {
  // FORCE-FIX: Cache-busting protocol to ensure fresh logo load
  const finalLogoUrl = useMemo(() => {
    return `${PDDS_LOGO_URL}&t=${Date.now()}`;
  }, []);

  return (
    <div className="flex items-center justify-start bg-transparent">
      <img
        src={finalLogoUrl}
        alt="Official PDDS Party Logo"
        crossOrigin="anonymous"
        className={cn(
          "object-contain aspect-square shrink-0 duration-300 shadow-none transition-opacity",
          variant === "white" && "brightness-0 invert",
          className
        )}
        style={{
          filter: 'drop-shadow(0px 0px 10px rgba(255, 215, 0, 0.5))',
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
