import path from 'path';

export const getAbsolutePath = (...paths: string[]) => {
  return path.join(process.cwd(), ...paths);
};
