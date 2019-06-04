import Service from '@ember/service';
import { erc20Tokens } from 'portfolio-utils';

export default Service.extend({
  tokens() {
    return erc20Tokens;
  }
});