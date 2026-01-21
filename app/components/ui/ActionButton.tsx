import React from "react";
import { cn } from "@/lib/utils";

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "destructive" | "ghost" | "outline";
    size?: "sm" | "md" | "lg" | "icon";
    isLoading?: boolean;
    icon?: string; // FontAwesome class
}

export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, icon, children, disabled, ...props }, ref) => {

        const variants = {
            primary: "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 border-0",
            secondary: "bg-white/10 text-white hover:bg-white/15 border border-white/5",
            destructive: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20",
            outline: "bg-transparent border border-white/20 text-white hover:border-white/40",
            ghost: "bg-transparent text-muted-foreground hover:text-white hover:bg-white/5",
        };

        const sizes = {
            sm: "px-3 py-1.5 text-xs rounded-xl",
            md: "px-6 py-3 text-sm rounded-2xl",
            lg: "px-8 py-4 text-base rounded-2xl font-black tracking-wide",
            icon: "w-10 h-10 flex items-center justify-center rounded-xl p-0",
        };

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(
                    "font-bold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {isLoading ? (
                    <i className="fa-solid fa-spinner animate-spin"></i>
                ) : icon ? (
                    <i className={cn("fa-solid", icon)}></i>
                ) : null}
                {children}
            </button>
        );
    }
);

ActionButton.displayName = "ActionButton";
