import { Component } from 'react';

// Last line of defense: if any render throws, show a recoverable page instead
// of the blank white screen React leaves behind. Uses existing design tokens
// only — no new styling decisions.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Render error caught by ErrorBoundary:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
        <p className="eyebrow text-xs font-bold uppercase text-orange-500 mb-4">Something went wrong</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">
          This page hit a snag
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8">
          Try reloading. If it keeps happening, your connection or our service may be briefly unavailable.
        </p>
        <button
          onClick={() => window.location.assign('/')}
          className="btn-primary text-white font-bold rounded-full"
        >
          Reload PCC Mastery
        </button>
      </div>
    );
  }
}
