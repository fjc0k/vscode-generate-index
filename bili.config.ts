import { Config } from 'bili'

const config: Config = {
  input: 'src/extension.ts',
  output: {
    dir: 'dist',
    format: 'cjs-min',
    sourceMap: false,
  },
  bundleNodeModules: true,
  externals: ['vscode'],
  plugins: {
    typescript2: false,
  },
}

export default config
