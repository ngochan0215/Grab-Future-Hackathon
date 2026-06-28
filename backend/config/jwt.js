const jwt_config =  {
  JWT_SECRET: process.env.JWT_SECRET || "your-super-secret-key-change-in-production",
  JWT_EXPIRES_IN: "7d",
  BCRYPT_SALT_ROUNDS: 10,
};

export default jwt_config;
