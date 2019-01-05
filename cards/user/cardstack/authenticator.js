const { comparePassword } = require('portfolio-crypto');

module.exports = class {
  static create(...args) {
    return new this(...args);
  }

  async authenticate({ email, password }, userSearcher) {
    if (!email || !password) { return; }

    let { data: potentialUsers } = await userSearcher.search({
      filter: {
        type: { exact: 'portfolio-users' },
        'email-address': { exact: email } // email is a case insensitive field which forgives case when doing an exact match
      },
      page: { size: 1 }
    });

    if (!potentialUsers.length) { return; }

    let [ potentialUser ] = potentialUsers;
    let { attributes: { 'password-hash': hash } } = potentialUser;

    if (!(await comparePassword(password, hash))) { return; }

    return {
      data: potentialUser,
      meta: { preloaded: true }
    };

  }
};
