import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'qa')
    .default('development'),
  SERVICE_PORT: Joi.number().default(3000),
  USER_SERVICE_URL: Joi.string().required(),
  PRODUCT_SERVICE_URL: Joi.string().required(),
  ORDER_SERVICE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
});
