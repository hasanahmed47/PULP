import { createContext, useContext } from 'react';

const SceneStartContext = createContext(true);

export function SceneStartProvider({ allowed, children }) {
  return (
    <SceneStartContext.Provider value={allowed}>
      {children}
    </SceneStartContext.Provider>
  );
}

export function useSceneStartAllowed() {
  return useContext(SceneStartContext);
}