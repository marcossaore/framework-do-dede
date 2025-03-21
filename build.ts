import dts from 'bun-plugin-dtsx'
import type { BuildConfig } from 'bun'

const defaultBuildConfig: BuildConfig = {
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  minify: false,
}

await Promise.all([
  Bun.build({
    ...defaultBuildConfig,
    format: 'esm',
    naming: "[dir]/[name].js",
    plugins: [
      dts({
        cwd: './',
        root: './src', 
        outdir: './dist',
        keepComments: true,
        tsconfigPath: './tsconfig.json',
      }),
    ],
  }),
  Bun.build({
    ...defaultBuildConfig,
    format: 'cjs',
    naming: "[dir]/[name].cjs",
    plugins: [
      dts({
        cwd: './',
        root: './src',
        outdir: './dist',
        keepComments: true,
        tsconfigPath: './tsconfig.json'
      }),
    ],
  })
])