import React from "react";
import { cn } from "@/lib/utils"; // Assuming utils exists, otherwise I'll add a minimal utility or remove cn

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ children, className, hoverEffect = false, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "bg-[#121212]/50 backdrop-blur-xl border border-white/5 shadow-xl shadow-black/20 rounded-[2.5rem] overflow-hidden p-6 md:p-8 relative",
                    hoverEffect && "hover:bg-white/[0.03] transition-colors duration-300",
                    className
                )}
                {...props}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
                <div className="relative z-10">{children}</div>
            </div>
        );
    }
);

GlassCard.displayName = "GlassCard";
