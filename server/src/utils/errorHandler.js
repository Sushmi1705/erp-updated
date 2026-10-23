exports.handleError = (res, error) => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    const value = error.keyValue ? error.keyValue[field] : '';
    return res.status(400).json({ 
      success: false, 
      message: `A record with this ${field} ('${value}') already exists.` 
    });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ 
      success: false, 
      message: `Invalid ID reference format ('${error.value}') for field '${error.path}'. Please select a valid record.` 
    });
  }
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(val => val.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }
  res.status(400).json({ success: false, message: error.message || 'An error occurred' });
};
