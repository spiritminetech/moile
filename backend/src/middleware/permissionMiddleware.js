export default (...required) => {
  return (req, res, next) => {
    const userPerms = req.user.permissions || [];
    const allowed = required.some(p => userPerms.includes(p));

    if (!allowed) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    next();
  };
};