export const notFound = (req, res) => {
  res.status(404).json({ message: `Not found: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(404).json({ message: 'Resource not found' });
  }
  // Mongoose validation
  if (err.name === 'ValidationError') {
    const first = Object.values(err.errors)[0]?.message || 'Invalid data';
    return res.status(400).json({ message: first });
  }
  // Duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    return res.status(409).json({ message: 'That email is already registered' });
  }

  const status = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Something went wrong, please try again'
      : err.message;
  res.status(status).json({ message });
};
