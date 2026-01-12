const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

    // Create a user-friendly error message listing all issues
    const errorMessages = errorDetails.map(e => e.message).join('. ');

    return res.status(400).json({
      error: errorMessages || 'Validation failed',
      details: errorDetails
    });
  }

  next();
};

module.exports = validate;
