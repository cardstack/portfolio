/* eslint-env node */

let sha = process.env.TRAVIS_COMMIT && process.env.TRAVIS_COMMIT.substring(0,8);
let targetName = process.env.TARGET_NAME;
let webhookURL = process.env.WEBHOOK_URL;

module.exports = function(deployTarget) {

  // these get less aggressive caching because they exist at stable URLs
  let s3PagePattern = '**/*.{html,zip,pdf}';

  // these get more aggressive caching because they are sub-resources with fingerprinted URLs
  let s3AssetPattern = '**/*.{js,css,png,gif,ico,jpg,map,xml,txt,svg,swf,eot,ttf,woff,woff2,ttc,otf}';

  let ENV = {
    build: {},
    pipeline: {
      activateOnDeploy: true,
      disabled: {},
      alias: {
        s3: {
          as: ['s3Pages', 's3Assets']
        }
      }
    },
    'revision-data': {
      scm: null
    },
    s3Assets: {
      filePattern: s3AssetPattern,
      allowOverwrite: true
    },
    s3Pages: {
      filePattern: s3PagePattern,
      allowOverwrite: true,
      cacheControl: 'max-age=600, public'
    },
    cloudfront: {
      objectPaths: ['/', '/*', '/*/*', '/index.html', '/dashboard']
    }
  };

  process.env.DEPLOY_TARGET = deployTarget;

  if (deployTarget === 'staging') {
    ENV.build.environment = 'production';
    ENV.s3Assets.bucket = ENV.s3Pages.bucket = 'staging-portfolio-web';
    ENV.s3Assets.region = ENV.s3Pages.region = 'us-east-1';
    ENV.cloudfront.distribution = 'E1CIK0HN4J83GC';
  }

  if (deployTarget === 'staging_rinkeby') {
    ENV.build.environment = 'production';
    ENV.s3Assets.bucket = ENV.s3Pages.bucket = 'staging-rinkeby-cardfolio-web';
    ENV.s3Assets.region = ENV.s3Pages.region = 'us-east-1';
    ENV.cloudfront.distribution = 'EEW2IKOFKMVX4';
  }

  // TODO add production target once it's setup

  ENV.slack = {
    webhookURL,
    didDeploy: null,
    didActivate: function() {
      return function(slack) {
        return slack.notify({
          attachments: [{
            fallback: "Successfully deployed `portfolio` commit " + `${sha} to ${targetName} (${deployTarget})`,
            text: "Successfully deployed `portfolio` commit " + `${sha} to ${targetName} (${deployTarget})`,
            color: "good"
          }]
        });
      };
    },
    didFail: function() {
      return function(slack) {
        return slack.notify({
          attachments: [{
            fallback: "Failed `portfolio` commit " + `${sha} to ${targetName} (${deployTarget})`,
            text: "Failed `portfolio` commit " + `${sha} to ${targetName} (${deployTarget})`,
            color: "danger"
          }]
        });
      };
    }
  };

  // Note: if you need to build some configuration asynchronously, you can return
  // a promise that resolves with the ENV object instead of returning the
  // ENV object synchronously.
  return ENV;
};
