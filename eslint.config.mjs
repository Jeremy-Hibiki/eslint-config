import { getTypescriptConfig } from './dist/eslint.js';

const config = await getTypescriptConfig({
  extraIgnores: ['**/*.config.*'],
  tsconfigPath: './tsconfig.json',
});

export default config;
