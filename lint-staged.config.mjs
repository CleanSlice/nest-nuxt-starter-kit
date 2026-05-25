import path from 'node:path';

const relTo = (dir, files) =>
  files.map((f) => JSON.stringify(path.relative(dir, f))).join(' ');

export default {
  'api/**/*.ts': (files) =>
    `bash -c "cd api && ./node_modules/.bin/eslint --fix ${relTo('api', files)}"`,
  'app/**/*.{ts,vue}': (files) =>
    `bash -c "cd app && ./node_modules/.bin/eslint --fix ${relTo('app', files)}"`,
};
