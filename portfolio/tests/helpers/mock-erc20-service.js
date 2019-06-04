import Service from '@ember/service';

const MockErc20Service = Service.extend({
  tokens() {
    return [
      {
        name: 'Sample Token',
        symbol: 'SAMPLE',
        contractAddress: '0x031Dda7900C5D1B480EB84a374E6cb5b3466A15F'
      }
    ];
  }
});

export default MockErc20Service;