import { AlertTriangle, RefreshCw } from "lucide-react";

interface DashboardErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function DashboardErrorState({
  title = "Không thể tải dữ liệu",
  message,
  onRetry,
  className = "",
}: DashboardErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-card border border-border rounded-lg shadow-sm min-h-[300px] ${className}`}>
      <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <RefreshCw className="w-4 h-4" />
          Thử lại
        </button>
      )}
    </div>
  );
}
