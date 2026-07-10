import { AdminHealthAlert } from "../utils/adminHealthAlerts";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";

export function AdminHealthAlerts({ alerts }: { alerts: AdminHealthAlert[] }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        let bgColor = "bg-muted";
        let borderColor = "border-border";
        let iconColor = "text-muted-foreground";
        let Icon = Info;

        if (alert.severity === "warning") {
          bgColor = "bg-amber-50 dark:bg-amber-950/20";
          borderColor = "border-amber-200 dark:border-amber-800";
          iconColor = "text-amber-600 dark:text-amber-500";
          Icon = AlertTriangle;
        } else if (alert.severity === "error") {
          bgColor = "bg-red-50 dark:bg-red-950/20";
          borderColor = "border-red-200 dark:border-red-800";
          iconColor = "text-red-600 dark:text-red-500";
          Icon = AlertTriangle;
        } else if (alert.severity === "success") {
          bgColor = "bg-emerald-50 dark:bg-emerald-950/20";
          borderColor = "border-emerald-200 dark:border-emerald-800";
          iconColor = "text-emerald-600 dark:text-emerald-500";
          Icon = CheckCircle2;
        } else if (alert.severity === "info") {
          bgColor = "bg-blue-50 dark:bg-blue-950/20";
          borderColor = "border-blue-200 dark:border-blue-800";
          iconColor = "text-blue-600 dark:text-blue-500";
          Icon = Info;
        }

        return (
          <div
            key={alert.id}
            className={`flex items-start gap-3 p-4 rounded-lg border ${bgColor} ${borderColor}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground">
                {alert.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {alert.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
