import EmberRouter from '@ember/routing/router';
import { cardstackRoutes } from '@cardstack/routing';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(cardstackRoutes);

export default Router;
