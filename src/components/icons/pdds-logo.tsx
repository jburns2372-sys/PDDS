"use client";

import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { PDDS_LOGO_URL } from "@/lib/data";

interface PddsLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: "default" | "white";
}

/**
 * @fileOverview Standardized PDDS Logo Component.
 * Optimized for brand lockdown with high-intensity gold glow and force-refresh key.
 */
export default function PddsLogo({ className, variant = "default", style, ...props }: PddsLogoProps) {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="flex items-center justify-start bg-transparent">
      {!logoError ? (
        <img
          key="pdds-logo-v1" // Forces browser refresh
          src={PDDS_LOGO_URL}
          alt="Official PDDS Party Logo"
          crossOrigin="anonymous"
          className={cn(
            "object-contain aspect-square shrink-0 duration-300 shadow-none opacity-80 group-hover:opacity-100 transition-opacity",
            variant === "white" && "brightness-0 invert",
            className
          )}
          style={{
            height: '50px',
            width: 'auto',
            filter: 'drop-shadow(0px 0px 10px rgba(255, 215, 0, 0.5))',
            ...style
          }}
          onError={(e) => {
            console.error("Firebase Storage still blocking access. Check CORS or Rules.");
            setLogoError(true);
          }}
          {...props}
        />
      ) : (
        <span className="font-black text-yellow-500 text-xl uppercase italic drop-shadow-md">
          PDDS OFFICIAL
        </span>
      )}
    </div>
  );
}
