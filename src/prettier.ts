import type { Config } from 'prettier';

const prettierConfig = {
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  printWidth: 120,
  arrowParens: 'always',
  endOfLine: 'lf',
} as Config;

export default prettierConfig;
