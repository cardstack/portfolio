import Service from '@ember/service';
import Web3 from 'web3';
import injectOptional from 'ember-inject-optional';
import { get } from 'lodash';

export default Service.extend({
  fastboot: injectOptional.service(),
  isLoading: true,

  async init() {
    this._super(arguments);
    if (this.fastboot.isFastBoot) { return; }

    let provider = get(window, 'ethereum');
    if (provider && provider.isMetaMask) {
      let web3 = new Web3(provider);

      this.set('web3', web3);
      this.set('eth', web3.eth);
      this.set('provider', provider);

      // This is how we ask for access from our domain to use the metamask user accounts.
      // Also, currently Metamask only allows one address to be unlocked at a time.
      let [ enabledAddress ] = await provider.enable();

      this.set('address', enabledAddress);
      this.set('network', provider.networkVersion);

      provider.on('accountsChanged', ([ address ]) => this.set('address', address));

      // This handles login/logout, as sadly there is no event for that...
      this._listenForLoginLogout();
    }
    this.set('isLoading', false);
  },

  _listenForLoginLogout() {
    clearInterval(this.loginListener);

    this.set('loginListener', setInterval(() => {
      this.web3.eth.getAccounts((err, [address]) => {
        if (this.address !== address) {
          this.set('address', address);
        }
      });
    }, 1000));
  }
});