import React from 'react';

// Stops a crash in one part of the site from turning the whole page blank.
// A page that was opened before a new version of the site went live can fail to load a file that no longer exists
// ("chunk" errors): for those the page reloads itself once, which fetches the new version.
const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|Loading chunk|Failed to fetch dynamically|error loading dynamically|Unexpected token '<'/i;

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    if (CHUNK_ERROR.test(String(error?.message || error))) {
      try {
        if (!sessionStorage.getItem('tf_reloaded_for_update')) {
          sessionStorage.setItem('tf_reloaded_for_update', '1');
          window.location.reload();
          return;
        }
      } catch { /* storage unavailable: fall through to the message */ }
    }
    // eslint-disable-next-line no-console
    console.error(error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const small = this.props.small;
    return (
      <div className={`text-center ${small ? 'py-10 px-4 text-slate-700' : 'min-h-screen flex flex-col items-center justify-center px-6 text-white'}`} role="alert">
        <p className="text-xl font-black">Something went wrong on this page.</p>
        <p className={`mt-2 max-w-md ${small ? 'text-slate-600' : 'text-slate-200'}`}>
          Please reload the page. If this keeps happening, email teachformosa@gmail.com and tell us what you clicked.
        </p>
        <button
          type="button"
          onClick={() => { try { sessionStorage.removeItem('tf_reloaded_for_update'); } catch { /* ignore */ } window.location.reload(); }}
          className="mt-5 inline-flex bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl font-bold transition"
        >
          Reload the page
        </button>
      </div>
    );
  }
}
