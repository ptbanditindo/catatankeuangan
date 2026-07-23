"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "blue" | "green" | "red" | "yellow" | "purple";
}

const colorClasses = {
  blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  green: "bg-green-500/10 text-green-500 border-green-500/20",
  red: "bg-red-500/10 text-red-500 border-red-500/20",
  yellow: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: TrendingUp,
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = "blue",
}: StatCardProps) {
  const TrendIcon = trend ? trendIcons[trend] : null;

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="stat-label">{label}</p>
          <p className="stat-value text-light-text dark:text-white">{value}</p>
          {trend && trendValue && (
            <div className="flex items-center gap-1 text-xs">
              {TrendIcon && (
                <TrendIcon
                  className={cn(
                    "w-3 h-3",
                    trend === "up" && "text-green-500",
                    trend === "down" && "text-red-500"
                  )}
                />
              )}
              <span
                className={cn(
                  trend === "up" && "text-green-500",
                  trend === "down" && "text-red-500",
                  trend === "neutral" && "text-gray-500"
                )}
              >
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "p-3 rounded-xl border",
            colorClasses[color]
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}