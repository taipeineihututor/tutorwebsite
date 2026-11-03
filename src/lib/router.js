import { useEffect, useState } from 'react';

// Tiny hash router: links look like <a href="#/teachers">. No server config needed.
const read = () => window.location.hash.replace(/^#/, '') || '/';

export function useRoute() {
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export const go = (path) => {
  window.location.hash = path;
};
