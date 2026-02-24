import * as fs from 'fs';
import * as path from 'path';

export const registerSlices = (): string[] => {
  const settings = {
    specialSlices: ['./slices/setup', './slices/user'],
  };

  const slices = fs.readdirSync('./slices').filter((entry) => {
    const fullPath = path.join('./slices', entry);
    return fs.statSync(fullPath).isDirectory();
  });

  if (!slices.length) return [];

  const result: string[] = [];

  const collectSlices = (dirPath: string) => {
    if (fs.existsSync(`${dirPath}/nuxt.config.ts`)) {
      if (!result.includes(dirPath)) {
        result.push(dirPath);
      }
    } else {
      const subPaths = fs.readdirSync(dirPath).filter((entry) => {
        const fullPath = `${dirPath}/${entry}`;
        return fs.statSync(fullPath).isDirectory();
      });
      for (const subPath of subPaths) {
        collectSlices(`${dirPath}/${subPath}`);
      }
    }
  };

  for (const specialSlice of settings.specialSlices) {
    collectSlices(specialSlice);
  }

  for (const slice of slices) {
    const slicePath = `./slices/${slice}`;
    collectSlices(slicePath);
  }

  return result;
};
