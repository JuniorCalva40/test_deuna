export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientServiceUrl: process.env.CLIENT_SERVICE_URL,
  userServiceUrl: process.env.USER_SERVICE_URL,
  productServiceUrl: process.env.PRODUCT_SERVICE_URL,
  NODE_ENV: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  services: {
    autServiceUrl:
      process.env.AUTH_SERVICE_URL || '',
    userServiceUrl:
      process.env.USER_SERVICE_URL || '',
    anonymousAuthServiceUrl:
      process.env.ANONYMOUS_AUTH_SERVICE_URL ||
      '',
  },
  externalServices: {
    MSA_CO_ONBOARDING_STATUS_URL:
      process.env.MSA_CO_ONBOARDING_STATUS_URL ||
      '',
    MSA_NB_CONFIGURATION_URL:
      process.env.MSA_NB_CONFIGURATION_URL ||
      '',
    MSA_CO_AUTH_URL: process.env.MSA_CO_AUTH_URL,
    MSA_CO_COMMERCE_SERVICE_URL: process.env.MSA_CO_COMMERCE_SERVICE_URL,
    MSA_NB_CNB_ORQ_SERVICE_URL:
      process.env.MSA_NB_CNB_ORQ_SERVICE_URL || 'http://localhost:8085/api/v1',
    MSA_NB_CNB_ACCOUNT_VALIDATION_URL:
      process.env.MSA_NB_CNB_ACCOUNT_VALIDATION_URL || 'http://localhost:3001/api/v1',
  },
  typeServices: {
    MSA_CO_ONBOARDING_STATUS_SERVICE_TYPE:
      process.env.MSA_CO_ONBOARDING_STATUS_SERVICE_TYPE || 'rest',
    MSA_NB_CONFIGURATION_SERVICE_TYPE:
      process.env.MSA_NB_CONFIGURATION_SERVICE_TYPE || 'rest',
    MSA_CO_AUTH_SERVICE_TYPE: process.env.MSA_CO_AUTH_SERVICE_TYPE || 'rest',
    MSA_CO_COMMERCE_SERVICE_TYPE:
      process.env.MSA_CO_COMMERCE_SERVICE_TYPE || 'rest',

    USER_SERVICE_TYPE: process.env.USER_SERVICE_TYPE || 'rest',
    PRODUCT_SERVICE_TYPE: process.env.PRODUCT_SERVICE_TYPE || 'rest',
    MSA_CO_INVOICE_SERVICE_TYPE:
      process.env.MSA_CO_INVOICE_SERVICE_TYPE || 'rest',
    MSA_NB_CLIENT_SERVICE_TYPE:
      process.env.MSA_NB_CLIENT_SERVICE_TYPE || 'rest',
    BUSSINES_RULE_SERVICE_TYPE:
      process.env.BUSSINES_RULE_SERVICE_TYPE || 'rest',
  },
  httpClient: {
    retry: process.env.HTTP_CLIENT_RETRY || 2,
    timeout: process.env.HTTP_CLIENT_TIMEOUT || 50000,
  },
});
