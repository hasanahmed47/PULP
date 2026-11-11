let sceneModule;

export function loadCanSceneModule() {
  sceneModule ??= import('./createCanScene');
  return sceneModule;
}