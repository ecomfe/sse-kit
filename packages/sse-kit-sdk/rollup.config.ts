import {platform, outputDir, packageOutputDir} from './config/const';

export default () => [
    ...platform.flatMap(p => multiPlatformInputs.flatMap(i => generateMultiPlatformConfig(p, i))),
];