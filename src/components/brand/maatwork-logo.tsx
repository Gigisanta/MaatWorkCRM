"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MaatWorkLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  showWordmark?: boolean;
  showTagline?: boolean;
  variant?: "default" | "light" | "accent";
  className?: string;
}

const sizes = {
  sm: { icon: 24, wordmark: "text-sm", tagline: "text-[8px]" },
  md: { icon: 32, wordmark: "text-base", tagline: "text-[9px]" },
  lg: { icon: 48, wordmark: "text-xl", tagline: "text-[10px]" },
  xl: { icon: 64, wordmark: "text-2xl", tagline: "text-xs" },
  "2xl": { icon: 80, wordmark: "text-3xl", tagline: "text-sm" },
};

export function MaatWorkLogo({
  size = "md",
  showWordmark = true,
  showTagline = false,
  variant = "default",
  className,
}: MaatWorkLogoProps) {
  const { icon: iconSize, wordmark, tagline } = sizes[size];
  
  const colors = {
    default: {
      pyramid: "#8B5CF6",
      pyramidHighlight: "rgba(139, 92, 246, 0.4)",
      eye: "#A78BFA",
      pupil: "#8B5CF6",
      aura: "rgba(139, 92, 246, 0.05)",
      text: "#F0EFE9",
      taglineText: "#666666",
    },
    light: {
      pyramid: "#8B5CF6",
      pyramidHighlight: "rgba(139, 92, 246, 0.4)",
      eye: "#A78BFA",
      pupil: "#8B5CF6",
      aura: "rgba(139, 92, 246, 0.05)",
      text: "#1C1D21",
      taglineText: "#666666",
    },
    accent: {
      pyramid: "#A78BFA",
      pyramidHighlight: "rgba(167, 139, 250, 0.5)",
      eye: "#C4B5FD",
      pupil: "#A78BFA",
      aura: "rgba(167, 139, 250, 0.08)",
      text: "#F0EFE9",
      taglineText: "#A78BFA",
    },
  };
  
  const color = colors[variant];
  
  // Simplified eye for small sizes
  const isSmall = iconSize <= 24;
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Pyramid outline */}
        <polygon
          points="40,10 72,66 8,66"
          fill="none"
          stroke={color.pyramid}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        
        {/* Base highlight */}
        <line
          x1="8"
          y1="66"
          x2="72"
          y2="66"
          stroke={color.pyramid}
          strokeWidth="2.2"
          strokeOpacity="0.4"
        />
        
        {/* Eye */}
        {!isSmall ? (
          <>
            {/* Eye: exterior shape */}
            <ellipse
              cx="40"
              cy="42"
              rx="10"
              ry="6.5"
              fill="none"
              stroke={color.eye}
              strokeWidth="1.4"
              strokeOpacity="0.85"
            />
            {/* Eye: iris */}
            <circle
              cx="40"
              cy="42"
              r="3.5"
              fill="none"
              stroke={color.eye}
              strokeWidth="1.2"
              strokeOpacity="0.75"
            />
            {/* Eye: pupil */}
            <circle
              cx="40"
              cy="42"
              r="1.4"
              fill={color.pupil}
              fillOpacity="0.9"
            />
            {/* Aura sutil */}
            <ellipse
              cx="40"
              cy="42"
              rx="10"
              ry="6.5"
              fill={color.aura}
            />
          </>
        ) : (
          // Simplified eye for small sizes
          <circle
            cx="40"
            cy="42"
            r="2.5"
            fill={color.eye}
          />
        )}
      </svg>
      
      {/* Wordmark & Tagline */}
      {showWordmark && (
        <div className="flex flex-col">
          <span
            className={cn(
              "font-['DM_Sans'] font-bold tracking-tight",
              wordmark
            )}
            style={{ color: color.text }}
          >
            Maat<span style={{ color: color.pyramid }}>Work</span>
          </span>
          {showTagline && (
            <span
              className={cn(
                "font-['Outfit'] font-normal tracking-[0.12em] uppercase mt-0.5",
                tagline
              )}
              style={{ color: color.taglineText }}
            >
              CRM Platform
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Icon-only variant for favicons, app icons, etc.
export function MaatWorkIcon({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const isSmall = size <= 24;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Pyramid outline */}
      <polygon
        points="40,10 72,66 8,66"
        fill="none"
        stroke="#8B5CF6"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      
      {/* Base highlight */}
      <line
        x1="8"
        y1="66"
        x2="72"
        y2="66"
        stroke="#8B5CF6"
        strokeWidth="2.2"
        strokeOpacity="0.4"
      />
      
      {/* Eye */}
      {!isSmall ? (
        <>
          <ellipse
            cx="40"
            cy="42"
            rx="10"
            ry="6.5"
            fill="none"
            stroke="#A78BFA"
            strokeWidth="1.4"
            strokeOpacity="0.85"
          />
          <circle
            cx="40"
            cy="42"
            r="3.5"
            fill="none"
            stroke="#A78BFA"
            strokeWidth="1.2"
            strokeOpacity="0.75"
          />
          <circle
            cx="40"
            cy="42"
            r="1.4"
            fill="#8B5CF6"
            fillOpacity="0.9"
          />
        </>
      ) : (
        <circle cx="40" cy="42" r="2.5" fill="#A78BFA" />
      )}
    </svg>
  );
}

// App Icon variant (for app icons with background)
export function MaatWorkAppIcon({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const borderRadius = size * 0.22; // 22% border radius per brandbook
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background */}
      <rect
        width="80"
        height="80"
        rx={borderRadius}
        fill="#8B5CF6"
      />
      
      {/* Pyramid outline (white) */}
      <polygon
        points="40,12 70,64 10,64"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      
      {/* Base highlight */}
      <line
        x1="10"
        y1="64"
        x2="70"
        y2="64"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeOpacity="0.5"
      />
      
      {/* Eye (white) */}
      <ellipse
        cx="40"
        cy="42"
        rx="8"
        ry="5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeOpacity="0.9"
      />
      <circle
        cx="40"
        cy="42"
        r="2.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeOpacity="0.8"
      />
      <circle
        cx="40"
        cy="42"
        r="1"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export default MaatWorkLogo;
