import Service from '@ember/service';

const MockWeb3Service = Service.extend({
  isLoading: false,

  init() {
    this._super(arguments);

    this.provider = {
      isMetaMask: true
    };
  }
});

export default MockWeb3Service;