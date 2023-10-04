function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];

  if (typeof bearerHeader !== 'undefined') {
    const bearerToken = bearerHeader.split(' ')[1];
    req.token = bearerToken;

    // Verify the token and attach user information to req.user
    jwt.verify(req.token, 'secret123', (err, authData) => {
      if (err) {
        res.sendStatus(403); // Forbidden
      } else {
        req.user = authData.user;
        next();
      }
    });
  } else {
    // No token found in headers
    res.sendStatus(403); // Forbidden
  }
}
