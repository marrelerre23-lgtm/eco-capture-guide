import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw, Home, Mail } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  // #22: Report error via email
  private handleReportError = () => {
    const errorDetails = encodeURIComponent(
      `Felmeddelande: ${this.state.error?.message || 'Okänt fel'}\n\n` +
      `Stack: ${this.state.error?.stack || 'Ingen stack tillgänglig'}\n\n` +
      `URL: ${window.location.href}\n` +
      `User Agent: ${navigator.userAgent}\n` +
      `Tidpunkt: ${new Date().toISOString()}`
    );
    window.location.href = `mailto:support@example.com?subject=Felrapport från EcoCapture&body=${errorDetails}`;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl">Något gick fel</CardTitle>
              <CardDescription>
                Ett oväntat fel inträffade. Vi beklagar besväret.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground font-mono">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    onClick={this.handleReset}
                    className="flex-1"
                    variant="outline"
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Försök igen
                  </Button>
                  <Button
                    onClick={this.handleGoHome}
                    className="flex-1"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Hem
                  </Button>
                </div>
                <Button
                  onClick={this.handleReportError}
                  className="w-full"
                  variant="secondary"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Rapportera fel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
