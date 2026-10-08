import type { Level } from '../types/game';

const levelFiles = import.meta.glob('./*/*.json', { eager: true }) as Record<
  string,
  Level | { default: Level }
>;

export const loadLevel = async (levelId: number): Promise<Level | null> => {
  const path = `./${levelId}/${levelId}.json`;
  const importedLevel =
    levelFiles[path] ??
    Object.entries(levelFiles).find(([key]) => key.endsWith(`/${levelId}/${levelId}.json`))?.[1];

  if (!importedLevel) {
    return null;
  }

  if ('default' in importedLevel) {
    return importedLevel.default ?? null;
  }

  return importedLevel ?? null;
};