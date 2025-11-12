import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Specialized error boundary for Map component
 * Handles Leaflet-specific errors gracefully
 */
export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ [Map Error Boundary] Error caught:', error, errorInfo);
    
    // Check for common Leaflet errors
    if (error.message.includes('Leaflet') || error.message.includes('map')) {
      console.error('🗺️ Leaflet-specific error detected');
    }
    
    // Check for hook errors
    if (error.message.includes('hook')) {
      console.error('🪝 React Hook error detected');
    }
  }

  handleReset = () => {
    console.log('[Map Error Boundary] Resetting error state');
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleClearCacheAndReload = () => {
    console.log('[Map Error Boundary] Clearing cache and reloading');
    
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Clear storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Force reload
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isLeafletError = this.state.error?.message.includes('Leaflet') || 
                             this.state.error?.message.includes('map');
      const isHookError = this.state.error?.message.includes('hook');

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 pb-20 pt-16">
          <Card className="max-w-md w-full border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Kartan kunde inte laddas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {isHookError && (
                  'Det verkar finnas en konflikt med appens kod. Prova att rensa cache och ladda om.'
                )}
                {isLeafletError && !isHookError && (
                  'Kartmodulen kunde inte initialiseras korrekt. Försök igen.'
                )}
                {!isLeafletError && !isHookError && (
                  'Ett oväntat fel uppstod när kartan laddades.'
                )}
              </p>

              {this.state.error && (
                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-xs font-mono text-destructive break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReset} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Försök igen
                </Button>
                
                <Button 
                  onClick={this.handleClearCacheAndReload} 
                  variant="outline" 
                  className="w-full"
                >
                  🗑️ Rensa cache och ladda om
                </Button>
                
                <Button 
                  onClick={() => window.location.href = '/'} 
                  variant="outline" 
                  className="w-full"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Gå till startsidan
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Tips: Om problemet kvarstår, försök ladda om hela sidan (Ctrl/Cmd + Shift + R)
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
