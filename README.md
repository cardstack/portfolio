# portfolio

This repo is the Portfolio Cardstack application

## Installation

* `git clone <repository-url>` this repository
* `cd portfolio`
* `yarn install` (we use Yarn workspaces, so use Yarn and not NPM)

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

You create a new card by running the generator:
```
$ ember g card name_of_your_card
```

(you'll need to add a `tests/dummy/app/styles` folder to the newly added card--sorry)

## Upgrading Card Dependencies

Note that currently bad things can happen the `@cardstack/*` dependencies get out of sync between the various cards. When upgrading `@cardstack/*` dependencies make sure to use `yarn upgrade-interactive --latest --scope @cardstack` (or whatever patten is appropriate) in order to upgrade all the @cardstack modules in lock step.
