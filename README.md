# Card Folio

Demo here: https://youtu.be/aFVkEZIRvKw

![Portfolio Screenshot](https://user-images.githubusercontent.com/61075/53203693-dcda5080-35f7-11e9-9df7-aa2298b7e72a.png)
![Portfolio Screenshot](https://user-images.githubusercontent.com/61075/53207852-e1f0cd00-3602-11e9-86c6-cf3a297ac16c.png)

## Prerequisites

* geth full-node
* docker
* node.js (version 8 or greater)

The Portfolio project requires a full-node geth as it will build a crypto portfolio from arbitrary Ethereum addresses by retrieving transaction receipts from transactions that can live at any block height. When running geth make sure to enable the web socket protocol, as the Cardstack Hub leverages web3.js event subscription. 

The simplest way to use geth is via Docker. Instructions are available here: https://hub.docker.com/r/ethereum/client-go/. Make sure to use a mounted volume with the `-v` option so that you don't lose your chain data when you stop your geth's docker container. You can also use homebrew to install geth if you are using a Mac. Instructions are available here: https://github.com/ethereum/go-ethereum/wiki/Installation-Instructions-for-Mac.

The following is an example of the command line options to use for running geth locally for the Rinkeby test network in a manner that is compatible with the Portfolio project:
```
$ geth --rinkeby --syncmode "full" \
     --rpc --rpcapi eth,net,web3 --rpcaddr 0.0.0.0 \
     --ws --wsaddr 0.0.0.0 --wsorigins '*' --wsapi eth,net,web3 \
     --cache 4096
```
Note that it will take about a day for the geth node to sync on the Rinkeby network since it is a full-node. (Mainnet will take a few days to sync). **Infura is also a perfectly valid option, although you may find that the performance is not quite as fast as a locally hosted geth.**

Additionally, if you do not wish to run geth, you can also use mocked Ethereum data instead. Instructions around how to manipulate the mocked Ethereum data are described in the sections below.

## Installation

* `git clone <repository-url>` this repository
* `cd portfolio`
* `yarn install` (we use Yarn workspaces, so use Yarn and not NPM)

## Preparing the Ethereum Index

The Cardstack Hub maintains a secondary index of the Ethereum blockchain that is a representation of all the transactions in the blockchain using postgres. When the Cardstack hub starts it updates its Ethereum index by populating the index with any new Ethereum transactions since the last time it was running. In the case of the very first time the Cardstack hub starts, this process will take quite awhile. There are a few options for how you can speed this up:

### Using AWS to Construct an Ethereum Index

This is probably the fastest way to assemble the Ethereum Index. We have authored Terraform modules that can be used spin up a pool of EC2 instances that can assemble the Ethereum index by distributing the work amongst the instances in the pool. The approach requires that you have an RDS postgres DB available in AWS. Ideally this approach would be used if you are deploying the Portfolio app into AWS, but you could also just extract the assembled index from your RDS DB and import into your local DB.

_TODO add Terraform examples_

### Assembling an Ethereum Index Locally

We have authored a nodejs script that is available in the @cardstack/ethereum module that will assemble an Ethereum Index into your local DB. This script will split the work to assemble the Ethereum index into a configurable number of forked processes. Additionally, we have extracted an already built Ethereum Index into a CSV file, so that you don't have to build the Ethereum Index from the genesis block. Using your favorite postgres client, you can import this CSV into your Ethereum Index, and then use the script for adding the transactions from blocks that were mined after the CSV was generated.

From your portfolio project folder you can execute the following script, where the `--jsonRpcUrl` is the URL of your geth node's web socket interface:
```
$ HUB_ENVIRONMENT=development node ./node_modules/@cardstack/ethereum/scripts/build-index.js --jsonRpcUrl=ws://localhost:8546
```
(Note that this script just uses the `PGHOST`, `PGPORT`, `PGUSER`, and `PGPASSWORD` environment variables to connect to your postgres database.)

Additionally, if you only want to index specific blocks you can add:
```
--start=<block number> --end=<block number>
```
When `--start` is not specified, the script assumes you want to start at block #0. If `--end` is not specified the script assumes you want to end at the current block.

You may also configure the amount of worker child processes to fork. The default amount of workers is 10. 
```
--workerCount=20
```

For a list of options use the `--help` option.

#### Ethereum Index CSV Files

In order to speed up the the process of building your Ethereum Index, we have extracted an already built Ethereum Index into a CSV file. You can use your favorite Postgres client to upload the CSV into your database. 

First make sure your DB is running. From the instructions in the "Running" section below, run:
```
yarn start-prereqs
```

Then you can create the database by executing the script:
```
$ HUB_ENVIRONMENT=development node ./node_modules/@cardstack/ethereum/scripts/build-index.js --createDb
```
(Note that this script just uses the `PGHOST`, `PGPORT`, `PGUSER`, and `PGPASSWORD` environment variables to connect to your postgres database.)

Then using your Postgres DB client (I like using Postico), you can upload the CSV into the newly created `ethereum_index` database. The CSV files are very large. You may need to use the `split` UNIX command to split up the CSV into smaller chunks based on the what your Postgres client can handle.

We have made the following CSV files available: 

* Rinkeby up to block #3915387 https://cardstack.com/csv/rinkeby_transactions_3915387.csv (8.5GB) SHA-256 Checksum `47a561b12ecc58f8708248b86db6c392c02faf0652fa20d8e5dde4ed74020e62`
* _TODO add Mainnet CSV files and their SHA256 checksums_

(feel free to open an issue if you need a CSV file that is not listed above)

## Running

There are docker container(s) that are prerequisites for running the portfolio app. You can start and stop them with:

    yarn start-prereqs
    yarn stop-prereqs

**`yarn start-prereqs` will bind the PostgreSQL running in the Docker container to port 5432 which is the standard Postgres port. That might conflict with a local PostgreSQL you might have running, which would actually be used by the Cardstack hub in that case as opposed to the one running in the Docker container.**

Once the prerequisites are running, you can run both the Hub and the Ember CLI development server like this:

    yarn start

Alternatively, you can run the Hub and Ember CLI separately with:

    yarn start-hub
    yarn start-ember

### Environment Variables:

#### `HUB_ENVIRONMENT`
The `HUB_ENVIRONMENT` environment variable is used to tell the Cardstack hub which environment it is running within. The possible values are `development`, `test`, and `production`. Generally the `development` environment is used for doing development on your local machine. The `test` environment is used for running the automated tests. The `production` environment is used for running a hosted application. If this environment variable is not specified, then the `HUB_ENVIRONMENT=development` is assumed.

#### `JSON_RPC_URLS`
Use the environment variable `JSON_RPC_URLS` to specify a comma separated list of geth web socket URL's to use for the Portfolio application. If this environment variable is not used, then the mock Ethereum data will be used instead.

#### `CRYPTO_COMPARE_API_KEY`
Use the environment variable `CRYPTO_COMPARE_API_KEY` to specify your crypto compare API key in order to get live and historical crypto conversion dates. If this environment variable is not used, then a randomish number is substituted instead that hovers around $100 USD for 1 unit of crypto currency. (When `HUB_ENVIRONMENT=test` then exactly $100 USD is used, as random numbers dont make for good tests.)

#### `GIT_REPO`
Use the environment variable `GIT_REPO` to specify the git data source SSH URL. Note that this is only used when `HUB_ENVIRONMENT=production` is also specified. If this variable is not used, then the ephemeral data source will be used instead.

#### `GIT_PRIVATE_KEY`
Use the environment variable `GIT_PRIVATE_KEY` to specify the private key for the SSH user used in the `GIT_REPO` environment variable. Note that this value will have newlines within it. Please see https://github.com/cardstack/cardstack/blob/master/packages/git/README.md for more details around specying this environment variable.

#### `GIT_BRANCH_PREFIX`
Use the environment variable `GIT_BRANCH_PREFIX` when you wish to use a branch other than `master` for your git data source. The value of `GIT_BRANCH_PREFIX` will be prepended to the string `master` when deriving the name of the branch to use for reading and writing documents to the git data source.

#### `LOG_LEVELS`
Use the environment variable `LOG_LEVELS` to adjust the logging on the Cardstack hub process. More information around how to use this can be found here: https://github.com/cardstack/logger

#### Postgres
The standard Postgres environment variables `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, etc are supported. You can control the postgres instance that the Cardstack hub uses by setting these environment variables.

## Configuring Users, Portfolios, Wallets, and Assets

The Cardstack Hub can connected to many different types of data sources. Some data sources are read-only (like the Ethereum data source, Crypto Compare data source, and the asset history data sources) and others are writable for holding content types that are controlled by the hub, including users, portfolios, wallets, and asset content types. The way we have arranged our writable data sources for the Portfolio project is to use an "ephemeral" data source when the Portfolio application is running with `HUB_ENVIRONMENT=development` environment variable and to use a git data source when the Portfolio application is running with the `HUB_ENVIRONMENT=production` environment variable. By default, cardstack applications run with the `HUB_ENVIRONMENT=development` environment variable.

### Ephemeral Data Source
The ephemeral data source is a hub data source that is most often used for testing or for running in a local development environment. This data source persists documents only for as long as the cardstack hub backend is running. When the cardstack hub backend is restarted, the documents contained in the ephemeral datastore is erased--hence the term "ephemeral". By default this is the data source that the Portfolio application uses when run in your local development environment, as it requires no special setup to use, and it resets to its initial state when you restart the hub (which makes it wonderful for testing). The ephemeral data source uses what we call "seeds" to initialize its initial state. It is these seeds that we use for setting up users, portfolios, wallets, and assets in the local development environment.

#### Seeds
The `portfolio/cardstack/seeds/` folder holds modules whose evaluated `module.exports` are arrays of resources that are created as "seed" models when the Cardstack hub starts up for the ephemeral data source (when `HUB_ENVIRONMENT=development` environment variable is set). The `portfolio/cardstack/sample-data.js` contains the users, portfolios, wallets, and assets that are used in the development environment. We construct the models using a `@cardstack/test-support/jsonapi-factory` factory. The factory ensures that the underlying JSON:API structures are valid, do not contain cycles, and are emitted in a manner where the resource relationships are created in the correct order (as a Directed Acyclic Graph) so that resources that are dependencies for other resources are created first. The JSONAPIFactory adheres precisely to the JSON:API specification https://jsonapi.org/. The factory allows us to create resources that have attributes and relationships as defined in the specification.

Additionally, in the `portfolio/mock-asset-data.js` you will find imports for mocked crypto currencies that the hub has not have indexers for yet (which live in `shared-data/`). For convenience, these leverage the same schema as the Ethereum addresses and transactions. When we get around to actually implementing the indexers for these other crypto currencies we'll need to adjust the schemas for each currency accordingly to account for the nuances of each currency.

### Git Data Source
The git data source is used when the `HUB_ENVIRONMENT=production` environment variable is set. In this scenario, the hub will write and read users, portfolios, wallets, and assets content types from the configured git repository. This repository can be a git repository that is hosted by GitHub or another git hosting provider, or a git repository that is hosted privately in the VPC that the Cardstack Hub is running from. 

To use a git data source, in addition to specifying the `HUB_ENVIRONMENT=production` environment variable, you will also need to specify the SSH URL of the git repo in the `GIT_REPO` environment var (e.g. `GIT_REPO=git@github.com:cardstack/portfolio-data.git`), and you will need to specify the private key for the user in the SSH URL of the git repo in the `GIT_PRIVATE_KEY` environment variable. (Due to the need to preserve line breaks in the private key, this may be a little tricky, see https://github.com/cardstack/cardstack/blob/master/packages/git/README.md for more details). The hub will use the `master` branch of the specified repo to read and write content. If you want to have the hub use a different branch, you can specify `GIT_BRANCH_PREFIX` environment variable for a prefix to apply to the `master` branch, e.g. `GIT_BRANCH_PREFIX=staging-` will cause the hub to read and write content to the `staging-master` branch instead.

Documents that reside in a git data source leverage the JSON:API specification (https://jsonapi.org), live in the `master` branch of the repository (which can be changed using the `GIT_BRANCH_PREFIX` environment variable), underneath within the `contents/` folder. Within the `contents/` folder is a folder for each content type that originates from the git data source. Within the content type folder each document's file name is the ID of the document (with a `.json` file extension). Each document's file contents is a JSON:API document without the `type` and `id` properties, as we derive the type and ID of the document from the folder and file name of the document.

![Git data source screenshot](https://user-images.githubusercontent.com/61075/53369044-44561000-3918-11e9-836c-466bff85b4f0.png)

### User Interface Updates Coming...
The current state of the Portfolio app allows users to the registered (albeit we haven't yet implemented email verification https://github.com/cardstack/portfolio/issues/112) and a portfolio to be created to newly registered users. However, users cannot yet add wallets nor assets from the user interface. This is TBD functionality https://github.com/cardstack/portfolio/issues/114 and https://github.com/cardstack/portfolio/issues/24. When using the ephemeral data source, this means that you need to configure users, wallets, portfolios, and assets from the seeds. When using the git data source, you must configure portfolios, wallets, and assets by adding those content types to your git repo (users can just be registered via the UI).

## Mocking Ethereum

When developing Portfolio in your local development environment, it is oftentimes preferable to be able to mock Ethereum data so that you can replicate a precise situation, or create an automated test, or make it easy for people to contribute that don't have the ability to run a geth node.

Within the `shared-data/mock-ethereum-data.js` is an `ethereum-addresses` document and a series of `ethereum-transactions` that would normally be generated from the Cardstack Ethereum data source as it indexes blocks and tracked addresses. You can tailor the `ethereum-addresses` and `ethereum-transactions` documents at will in order to replicate various scenarios for testing and development.

## Testing

Testing needs the same prereqs as running.

    yarn lint
    yarn test

You can run the tests interactively via

    yarn test -s

## Creating Cards

You create a new card by running the generator in the `portfolio/` directory of the project:
```
$ ember g card name_of_your_card
```

(you'll need to add a `tests/dummy/app/styles` folder to the newly added card--sorry)

## Upgrading Card Dependencies

Note that currently bad things can happen the `@cardstack/*` dependencies get out of sync between the various cards. When upgrading `@cardstack/*` dependencies make sure to use `yarn upgrade-interactive --latest --scope @cardstack` (or whatever patten is appropriate) in order to upgrade all the @cardstack modules in lock step.
