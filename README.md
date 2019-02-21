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
Note that it will take about a day for the geth node to sync on the Rinkeby network since it is a full-node. (Mainnet will take a few days to sync). Infura is also a perfectly valid option, although you may find that the performance is not quite as fast as a locally hosted geth.

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
$ node ./node_modules/@cardstack/ethereum/scripts/build-index.js --jsonRpcUrl=ws://localhost:8546
```
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

* _TODO add Rinkeby CSV files and their SHA256 checksums_
* _TODO add Mainnet CSV files and their SHA256 checksums_

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

## Configuring Users, Portfolios, Wallets, and Assets

_TODO Discuss how to use seed data_ 

## Using a Git Data Source

_TODO Discuss how to add a git data source_

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
