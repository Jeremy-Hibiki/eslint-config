import type { Awaitable, TypedFlatConfigItem } from '@antfu/eslint-config';

import {
  imports as antfuImports,
  combine,
  comments,
  ignores,
  javascript,
  jsdoc,
  jsonc,
  node,
  perfectionist,
  react,
  regexp,
  sortPackageJson,
  sortTsconfig,
  typescript,
  unicorn,
  unocss,
} from '@antfu/eslint-config';
import { merge } from 'es-toolkit';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export function prettier({ withTypescript = false }: { withTypescript?: boolean } = {}): TypedFlatConfigItem {
  const { rules = {} } = eslintPluginPrettierRecommended;
  rules['prettier/prettier'] = 'warn';
  if (withTypescript) {
    Object.entries(rules).forEach(([key, value]) => {
      if (key.startsWith('@typescript-eslint/')) {
        delete rules[key];
        rules[key.replace('@typescript-eslint/', 'ts/')] = value;
      }
    });
  }
  return merge(eslintPluginPrettierRecommended, {
    name: 'prettier',
    rules,
    files: withTypescript ? ['**/*.?([cm])ts', '**/*.?([cm])tsx'] : undefined,
  });
}

export function dts(): TypedFlatConfigItem {
  return {
    name: 'dts',
    files: ['*.d.ts'],
    rules: {
      'no-restricted-syntax': 'off',
      'import/no-duplicates': 'off',
      'eslint-comments/no-unlimited-disable': 'off',
    },
  };
}

export function imports({ stylistic = false }: { stylistic?: boolean } = {}): Awaitable<TypedFlatConfigItem[]> {
  return antfuImports({ stylistic }).then((c) => {
    c.at(-1)!.rules = {
      ...c.at(-1)!.rules,
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/order': 'off',
    };
    return c;
  });
}

type DefaultConfigOptions = {
  extraIgnores?: string[];
};
export const getDefaultConfig = async (options?: DefaultConfigOptions) => {
  const { extraIgnores } = options ?? {};

  return combine(
    ignores(extraIgnores),
    javascript({
      overrides: {
        'no-empty': ['error', { allowEmptyCatch: true }],
        'no-unused-vars': 'off',
        'sort-imports': 'off',
        'unused-imports/no-unused-vars': [
          'error',
          {
            args: 'after-used',
            argsIgnorePattern: '^_',
            vars: 'all',
            varsIgnorePattern: '^(?:_|set[A-Z]).*',
            caughtErrors: 'none',
            ignoreRestSiblings: true,
          },
        ],
        'unused-imports/no-unused-imports': 'error',
      },
    }),
    comments(),
    imports({ stylistic: false }),
    node(),
    perfectionist().then((c) => {
      c[0].rules = {
        ...c[0].rules,
        'perfectionist/sort-imports': [
          'error',
          {
            groups: [
              'type',
              ['builtin', 'external'],
              ['internal-type', 'parent-type', 'sibling-type', 'index-type'],
              ['internal', 'parent', 'sibling', 'index'],
              'object',
              'unknown',
            ],
            // newlinesBetween: 'ignore',
            order: 'asc',
            type: 'natural',
          },
        ],
        'perfectionist/sort-jsx-props': [
          'error',
          {
            customGroups: {
              callback: ['^on[A-Z].*$'],
              builtin: ['^className$', '^style$', '^key$', '^ref$', '^id$', '^name$', '^htmlFor$', '^src$'],
              data: ['^data-.*$'],
            },
            groups: ['builtin', 'data', ['multiline', 'unknown'], 'shorthand', 'callback'],
          },
        ],
      };
      return c;
    }),
    prettier(),
    regexp(),
    jsdoc({ stylistic: false }),
    jsonc({ stylistic: false }),
    unicorn(),
    sortPackageJson()
  );
};

export type TypescriptConfigOptions = DefaultConfigOptions & {
  tsconfigPath?: string;
};
export const getTypescriptConfig = async (options?: TypescriptConfigOptions) => {
  const { tsconfigPath } = options ?? {};
  return combine(
    getDefaultConfig(options),
    typescript({
      tsconfigPath,
      overrides: {
        'ts/ban-ts-comment': 'off',
        'ts/consistent-type-definitions': 'off',
        'ts/consistent-type-imports': 'warn',
        'ts/no-empty-interface': 'off',
        'ts/no-explicit-any': 'off',
        'ts/no-unused-vars': 'off',
      },
      overridesTypeAware: {
        'ts/consistent-type-exports': 'warn',
      },
    }),
    dts(),
    prettier({ withTypescript: true }),
    sortTsconfig()
  );
};

type ReactHookName = `use${Capitalize<string>}`;
const EXTRA_REACT_HOOKS = [
  'useUpdateEffect',
  'useUpdateLayoutEffect',
  'useAsyncEffect',
  'useDebounceEffect',
  'useThrottleEffect',
  'useDeepCompareEffect',
  'useDeepCompareLayoutEffect',
  'useIsomorphicLayoutEffect',
  'useTrackedEffect',
] as const satisfies ReactHookName[];

type JoinArrayElements<T extends readonly string[], D extends string> = T extends readonly [
  infer F extends string,
  ...infer R extends string[],
]
  ? R['length'] extends 0
    ? F
    : `${F}${D}${JoinArrayElements<R, D>}`
  : '';

const JOINED_EXTRA_REACT_HOOKS =
  `(${EXTRA_REACT_HOOKS.join('|')})` as `(${JoinArrayElements<typeof EXTRA_REACT_HOOKS, '|'>})`;

export type ReactConfigOptions = TypescriptConfigOptions & {
  useUnocss?: boolean;
};

export const getReactConfig = async (options?: ReactConfigOptions) => {
  const { useUnocss = true } = options ?? {};
  return combine(
    getTypescriptConfig(options),
    react({
      overrides: {
        'react/display-name': 'off',
        'react-hooks/exhaustive-deps': [
          'warn',
          {
            additionalHooks: JOINED_EXTRA_REACT_HOOKS,
          },
        ],
      },
    }),
    useUnocss ? unocss() : []
  );
};

export default getDefaultConfig;
