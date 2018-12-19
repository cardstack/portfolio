export function initialize(appInstance) {
  let mockLogin = appInstance.lookup('service:mock-login');
  mockLogin.set('mockUserId', 'mock-user')
}

export default {
  initialize
};
