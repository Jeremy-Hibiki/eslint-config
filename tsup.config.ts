import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/*.ts'],
  format: ['esm'],
  cjsInterop: false,
  dts: true,
  splitting: true,
  sourcemap: false,
  clean: true,
  minify: false,
  treeshake: false,
  noExternal: ['es-toolkit'],
});
