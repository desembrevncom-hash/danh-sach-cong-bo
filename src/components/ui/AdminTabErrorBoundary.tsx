import React, { ErrorInfo } from 'react';
import { AlertTriangle, RefreshCcw, ArrowLeft } from 'lucide-react';

interface Props {
  tabName: string;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminTabErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`AdminTabErrorBoundary caught an error in tab "${this.props.tabName}":`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-card border border-destructive/20 rounded-lg shadow-sm">
          <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold text-card-foreground mb-2">
            Không thể tải giao diện {this.props.tabName}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Đã xảy ra lỗi kỹ thuật khi hiển thị tab này. Vui lòng tải lại hoặc thử lại.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Thử lại
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Tải lại trang
            </button>
          </div>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <div className="mt-8 p-4 bg-muted text-left rounded-md w-full max-w-2xl overflow-auto text-xs text-muted-foreground border border-border">
              <p className="font-semibold text-destructive">{this.state.error.toString()}</p>
              <pre className="mt-2 whitespace-pre-wrap">{this.state.error.stack}</pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
