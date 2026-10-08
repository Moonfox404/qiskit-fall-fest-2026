import type { Level } from '../types/game';

const levelFiles = import.meta.glob('./*/*.json');

export const loadLevel = async (levelId: number): Promise<Level | null> => {
  const path = `./${levelId}/${levelId}.json`;

  const loader = levelFiles[path];

  if (!loader) {
    return null;
  }

  const module = await loader() as { default: Level };

  return module.default;
};