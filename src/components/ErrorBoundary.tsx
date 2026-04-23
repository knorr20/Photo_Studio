import React from 'react';
import { Camera } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-24 h-24 bg-gray-900 flex items-center justify-center mx-auto mb-6">
            <Camera className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-heading font-black text-gray-900 mb-3 uppercase">
            Something Went Wrong
          </h1>
          <div className="w-16 h-1 bg-studio-green mx-auto mb-6" />
          <p className="text-gray-500 text-lg mb-8">
            An unexpected error occurred. Please reload the page to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-studio-green text-white font-heading font-black uppercase hover:bg-studio-green-darker transition-all duration-200"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
