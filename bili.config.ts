import { Config } from 'bili'

const config: Config = {
  input: './src/extension.ts',
  output: {
    target: 'node',
    dir: 'dist',
    minify: true,
    format: 'cjs',
    sourceMap: false,
  },
  bundleNodeModules: true,
  externals: ['vscode'],
  plugins: {
    babel: false,
    typescript2: {
      objectHashIgnoreUnknownHack: false,
      tsconfig: 'tsconfig.build.json',
      tsconfigOverride: {
        compilerOptions: {
          declaration: false,
        },
      },
    },
  },
}

export default config
