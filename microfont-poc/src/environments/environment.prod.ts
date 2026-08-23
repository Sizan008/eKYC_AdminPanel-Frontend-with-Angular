export const environment = {
  production: false,
  apiBaseUrl:'http://localhost:8092/centrino',
  // apiBaseUrl: 'http://localhost:8095/swiftFusionAPI/api/v1/',
  // coreBaseUrl: 'http://192.168.20.250:8090/api/user-login/signIn',
  // coreBaseUrl: 'http://192.168.20.93:8091/api/auth/userLogin',
  // coreBaseUrl: 'http://192.168.20.250:9090/oauth2/token',
  loginUrl: 'http://192.168.20.250:9090/oauth2/token',
  logoutUrl: 'http://192.168.20.250:9090/auth/logout',
  coreBaseUrl: 'http://192.168.20.93:8091/api/auth/userLogin',
  centrinoBaseUrl: 'http://192.168.20.93:8097/centrino',

  keycloak: {
    url: 'http://192.168.10.56:9080',
    realm: 'MicroCube_dev',
    clientId: 'BFF'
  },

};