# portfolio

This repo is the Portfolio Cardstack application

![Portfolio Screenshot](https://user-images.githubusercontent.com/61075/53203693-dcda5080-35f7-11e9-9df7-aa2298b7e72a.png)

## Prerequisites

* Geth full-node
* Docker

The Portfolio project requires a full-node geth as it will build a crypto portfolio from arbitrary Ethereum addresses by retrieving transaction receipts from transactions that can live at any block height.

## Installation

* `git clone <repository-url>` this repository
* `cd portfolio`
* `yarn install` (we use Yarn workspaces, so use Yarn and not NPM)

## Preparing Ethereum Index

The Cardstack Hub maintains a secondary index of the Ethereum blockchain that is a representation of all the transactions in the blockchain using postgres. When the Cardstack hub starts it updates its Ethereum index by populating the index with any new Ethereum transactions since the last time it was running. In the case of the very first time the Cardstack hub starts, this process will take quite awhile. There are a few options for how you can speed this up:

### Using AWS to Construct an Ethereum Index

This is probably the fastest way to assemble the Ethereum Index. We have authored Terraform modules that can be used spin up a pool of EC2 instances that can assemble the Ethereum index by distributing the work amongst the instances in the pool. The approach requires that you have an RDS postgres DB available in AWS. Ideally this approach would be used if you are deploying the Portfolio app into AWS, but you could also just extract the assembled index from your RDS DB and import into your local DB.

_TODO add Terraform examples_

### Assembling an Ethereum Index Locally

We have authored a nodejs script that is available in the @cardstack/ethereum module that will assemble an Ethereum Index into your local DB. This script will split the work to assemble the Ethereum index into a configurable number of forked processes. Additionally, we have extracted an already built Ethereum Index into a CSV file, so that you don't have to build the Ethereum Index from the genesis block. Using your favorite postgres client, you can import this CSV into your Ethereum Index, and then use the script for adding the transactions from blocks that were mined after the CSV was generated.

_TODO add script instructions_

#### Ethereum Index CSV Files

_TODO add Rinkeby CSV files and their SHA256 checksums_
_TODO add Mainnet CSV files and their SHA256 checksums_

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

## Testing

Testing needs the same prereqs as running.

    yarn lint
    yarn test

You can run the tests interactively via

    yarn test -s

## Creating Cards

You create a new card by running the generator in the portfolio/ directory of the project:
```
$ ember g card name_of_your_card
```

(you'll need to add a `tests/dummy/app/styles` folder to the newly added card--sorry)

## Upgrading Card Dependencies

Note that currently bad things can happen the `@cardstack/*` dependencies get out of sync between the various cards. When upgrading `@cardstack/*` dependencies make sure to use `yarn upgrade-interactive --latest --scope @cardstack` (or whatever patten is appropriate) in order to upgrade all the @cardstack modules in lock step.
