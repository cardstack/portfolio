const glob = require('glob');
const { join, resolve } = require('path');
const { emptyDirSync, copySync } = require('fs-extra');
const { execSync } = require('child_process');

const root = resolve(join(__dirname, '..'));
const context = join(root, 'deploy/context');
const specialBranches = [ 'master', 'staging', 'production' ];
const moduleRootFolders = [ 'cards', 'packages' ];
const depLayerFiles = [ 'package.json' ];
const codeLayerFiles = [ 'cardstack', 'index.js', 'commands', 'node-tests' ];

emptyDirSync(context);
copySync(join(root, 'deploy/Dockerfile'), join(context, 'Dockerfile'));

// dep-layer contains things that will trigger a new yarn install (expensive)
moduleRootFolders.forEach(moduleRoot => {
  depLayerFiles.forEach(serverFile => {
    glob.sync(join(root, `${moduleRoot}/*/${serverFile}`)).forEach(filename => {
      copySync(filename, join(context, 'dep-layer', filename.replace(root, '')));
    });
  });
});

copySync(join(root, 'portfolio/package.json'), join(context, 'dep-layer/portfolio/package.json'));
copySync(join(root, 'package.json'), join(context, 'dep-layer/package.json'));
copySync(join(root, 'yarn.lock'), join(context, 'dep-layer/yarn.lock'));

// code-layer contains everything else, which is much cheaper to rebuild (no yarn install)
copySync(join(root, 'node-test-runner.js'), join(context, 'code-layer/node-test-runner.js'));
copySync(join(root, 'shared-data'), join(context, 'code-layer/shared-data'));
copySync(join(root, 'portfolio/cardstack'), join(context, 'code-layer/portfolio/cardstack'));
moduleRootFolders.forEach(moduleRoot => {
  codeLayerFiles.forEach(serverFile => {
    glob.sync(join(root, `${moduleRoot}/*/${serverFile}`)).forEach(filename => {
      copySync(filename, join(context, 'code-layer', filename.replace(root, '')));
    });
  });
});

let dockerImageLabel = specialBranches.includes(process.env.TRAVIS_BRANCH) ? process.env.TRAVIS_BRANCH : process.env.TRAVIS_BUILD_ID || 'latest';
try {
  process.stdout.write(`Retrieving docker build from 680542703984.dkr.ecr.us-east-1.amazonaws.com/portfolio:${dockerImageLabel} ...`);
  execSync(`docker pull 680542703984.dkr.ecr.us-east-1.amazonaws.com/portfolio:${dockerImageLabel}`);
} catch (err) {
  if (!/manifest.*not found/.test(err.message)) {
    throw err;
  }
  process.stdout.write(`No build cache found for portfolio:${dockerImageLabel}, building from scratch.`);
}
execSync(`docker build -f ${join(context, 'Dockerfile')} --cache-from 680542703984.dkr.ecr.us-east-1.amazonaws.com/portfolio:${dockerImageLabel} -t portfolio ${context}`, { stdio: 'inherit' });
