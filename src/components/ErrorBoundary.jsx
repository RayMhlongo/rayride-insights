import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Insight Rides render failure', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center bg-mist p-4 text-ink">
          <div className="panel max-w-md p-6">
            <h1 className="text-2xl font-bold text-navy">Insight Rides</h1>
            <p className="mt-2 text-sm text-slate-600">
              The app hit a startup error, but the page loaded. Refresh once, then check your Google credentials if this continues.
            </p>
            <pre className="mt-4 max-h-36 overflow-auto rounded-lg bg-slate-100 p-3 text-xs text-slate-700">
              {this.state.error.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
