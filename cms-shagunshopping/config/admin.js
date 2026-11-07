export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'adminJwtSecretShagun2026'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', 'apiTokenSaltShagun2026'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT', 'transferTokenSaltShagun2026'),
    },
  },
});
