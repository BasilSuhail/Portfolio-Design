"use client";

import React, { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface LiquidGlassCardProps extends HTMLMotionProps<"div"> {
  children?: React.ReactNode;
  glowIntensity?: "none" | "sm" | "md" | "lg";
  shadowIntensity?: "none" | "sm" | "md" | "lg";
  borderRadius?: string;
  blurIntensity?: "none" | "sm" | "md" | "lg";
  draggable?: boolean;
}

const glowVariants = {
  none: "0px",
  sm: "0 0 10px rgba(255, 255, 255, 0.1)",
  md: "0 0 20px rgba(255, 255, 255, 0.2)",
  lg: "0 0 30px rgba(255, 255, 255, 0.3)",
};

const shadowVariants = {
  none: "none",
  sm: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  md: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  lg: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
};

const blurVariants = {
  none: "none",
  sm: "blur(4px)",
  md: "blur(8px)",
  lg: "blur(12px)",
};

export const LiquidGlassCard = React.forwardRef<HTMLDivElement, LiquidGlassCardProps>(
  (
    {
      className,
      children,
      glowIntensity = "sm",
      shadowIntensity = "sm",
      borderRadius = "12px",
      blurIntensity = "md",
      draggable = false,
      style,
      ...props
    },
    ref
  ) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const cardRef = useRef<HTMLDivElement>(null);

    // Combine forwarded ref and local ref
    React.useImperativeHandle(ref, () => cardRef.current!);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }

    const maskImage = useMotionTemplate`radial-gradient(240px at ${mouseX}px ${mouseY}px, white, transparent)`;
    const styleProperties = {
      boxShadow: shadowVariants[shadowIntensity],
      backdropFilter: blurVariants[blurIntensity],
      borderRadius,
      ...style,
    };

    return (
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        drag={draggable}
        dragConstraints={draggable ? { left: 0, right: 0, top: 0, bottom: 0 } : undefined}
        dragElastic={0.1}
        className={cn(
          "relative overflow-hidden bg-white/10 border border-white/20",
          "hover:bg-white/15 transition-colors duration-300",
          className
        )}
        style={styleProperties}
        {...props}
      >
        {/* Shine effect */}
        <motion.div
          className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            maskImage,
            WebkitMaskImage: maskImage,
          }}
        >
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-20" />
        </motion.div>

        {/* Content */}
        <div className="relative z-10">{children}</div>

        {/* Gradient border */}
        <div 
            className="absolute inset-0 pointer-events-none"
            style={{
                borderRadius,
                border: "1px solid rgba(255, 255, 255, 0.2)",
                boxShadow: `inset 0 0 20px rgba(255, 255, 255, 0.05), ${glowVariants[glowIntensity]}`
            }}
        />
      </motion.div>
    );
  }
);

LiquidGlassCard.displayName = "LiquidGlassCard";

interface LiquidGlassButtonProps extends HTMLMotionProps<"button"> {
    children?: React.ReactNode;
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
}

export const LiquidGlassButton = React.forwardRef<HTMLButtonElement, LiquidGlassButtonProps>(
    ({ className, children, disabled, variant = "default", size = "default", ...props }, ref) => {
        const sizeClasses = {
            default: "px-4 py-2 text-sm",
            sm: "px-3 py-1.5 text-xs",
            lg: "px-8 py-3 text-base",
            icon: "p-2",
        };

        return (
            <motion.button
                ref={ref}
                className={cn(
                    "relative inline-flex items-center justify-center font-medium rounded-lg",
                    // Light mode: dark tints for visibility
                    "bg-black/[0.03] border border-black/20 backdrop-blur-sm",
                    "shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.08),0_3px_8px_rgba(0,0,0,0.1)]",
                    "hover:bg-black/[0.08]",
                    // Dark mode: white tints for glass effect
                    "dark:bg-white/[0.025] dark:border-white/50",
                    "dark:shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]",
                    "dark:hover:bg-white/30",
                    "transition-all duration-300",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "text-gray-800 dark:text-white",
                    sizeClasses[size],
                    variant === "outline" && "bg-transparent border-black/20 dark:border-white/30",
                    variant === "ghost" && "bg-transparent border-transparent shadow-none hover:bg-black/[0.05] dark:hover:bg-white/10",
                    className
                )}
                disabled={disabled}
                whileTap={!disabled ? { scale: 0.98 } : undefined}
                whileHover={!disabled ? { scale: 1.02 } : undefined}
                {...props}
            >
                {/* Top-left gradient overlay - dark tint for light mode, white for dark mode */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-black/10 via-transparent to-transparent opacity-70 pointer-events-none dark:from-white/60" />

                {/* Bottom-right gradient overlay */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-tl from-black/5 via-transparent to-transparent opacity-50 pointer-events-none dark:from-white/30" />

                {/* Content */}
                <span className="relative z-10 flex items-center justify-center gap-2">
                    {children}
                </span>
            </motion.button>
        );
    }
);

LiquidGlassButton.displayName = "LiquidGlassButton";
