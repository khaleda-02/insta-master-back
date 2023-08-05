const joi = require('joi');

const validator = (schema) => (payload) => {
  return schema.validate(payload, { abortEarly: false });
}

const signupSchema = joi.object({
  username: joi.string().required(),
  email: joi.string().email().required(),
  password: joi.string().min(6).max(12).required(),
})

exports.signupValidator = validator(signupSchema);
