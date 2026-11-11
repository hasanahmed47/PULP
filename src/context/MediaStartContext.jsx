import { createContext, useContext } from 'react';

const MediaStartContext = createContext(true);

export function MediaStartProvider({ allowed, children }) {
  return (
    <MediaStartContext.Provider value={allowed}>
      {children}
    </MediaStartContext.Provider>
  );
}

export function useMediaStartAllowed() {
  return useContext(MediaStartContext);
}