import dts from "rollup-plugin-dts";
import { babel } from '@rollup/plugin-babel';
import { terser } from "rollup-plugin-terser";
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

import {platform} from './config/const.js';
import {multiPlatformBuild} from './loaders/index.js';

function generateConfig(platformItem) {
  const jsConfig = {
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
        typescript({ declaration: false }), // 禁止在这个阶段生成 .d.ts 文件
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
        commonjs(),
    ]
  };

  // 生成 .d.ts 文件的配置
  const dtsConfig = {
    input: "src/entry.ts",
    output: [
      { file: `lib/bundle.${platformItem}.cjs.d.ts`, format: "es" },
      { file: `lib/bundle.${platformItem}.esm.d.ts`, format: "es" },
      {
        file: "lib/index.d.ts",
        format: "es",
      }
    ],
    plugins: [
      typescript({ emitDeclarationOnly: true }), // 只生成 .d.ts 文件
      dts(),
    ],
  };

  return [jsConfig, dtsConfig];
}

export default platform.flatMap(generateConfig);
