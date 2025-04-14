import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import dts from "rollup-plugin-dts";
import { babel } from '@rollup/plugin-babel';
import { terser } from "rollup-plugin-terser";
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

import {platform} from './config/const.js';
import {multiPlatformBuild} from './loaders/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const declarationCopiesPlugin = {
  name: 'declaration-copies',
  writeBundle() {
    const declarationFiles = [];
    platform.forEach(platform => {
      declarationFiles.push(`bundle.${platform}.cjs.d.ts`);
      declarationFiles.push(`bundle.${platform}.esm.d.ts`);
    })
    // 每个额外声明文件的内容，注意相对路径与 index.d.ts 在同一目录下
    const content = "export * from './index';\n";
    const distDir = path.resolve(__dirname, 'lib');
    declarationFiles.forEach(file => {
      const filePath = path.join(distDir, file);
      fs.writeFileSync(filePath, content, 'utf8');
      console.info(`生成声明文件: ${filePath}`);
    });
  }
};

function generateJsConfig(platformItem) {
  return {
    input: 'src/entry.ts',
    output: [
      {
        file: `lib/bundle.${platformItem}.cjs.js`,
        format: 'cjs',
        exports: 'auto',
        plugins: [terser()]
      },
      {
        file: `lib/bundle.${platformItem}.esm.js`,
        format: 'es',
        plugins: [terser()]
      }
    ],
    plugins: [
      resolve(),
      typescript({ declaration: false }), // 这里不生成 .d.ts 文件
      babel({
        include: 'src/**',
        exclude: 'node_modules/**',
        babelHelpers: 'bundled',
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        plugins: [
          multiPlatformBuild({
            platformSignal: platformItem
          })
        ],
      }),
      commonjs({
        transformMixedEsModules: true,
        requireReturnsDefault: 'auto',
        context: 'this'
      }),
    ]
  };
}
const jsConfigs = platform.map(p => generateJsConfig(p));

// 生成 .d.ts 文件的配置
const dtsConfig = {
  input: "src/entry.ts",
  output: [
    {
      file: "lib/index.d.ts",
      format: "es",
    }
  ],
  plugins: [
    dts(),
    declarationCopiesPlugin
  ],
};

export default [
  ...jsConfigs,
  dtsConfig 
]
