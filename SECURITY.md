# Security and Deployment Configuration

This document outlines how sensitive information, deployment configurations, and server details are handled in the Gosei Play project.

## Files Excluded from Version Control

The following files and directories are excluded from version control for security and operational reasons:

### Environment Variables
- `.env`
- `.env.development`
- `.env.production`
- `.env.local`, `.env.development.local`, `.env.test.local`, `.env.production.local`
- `.env*.local`

These files contain environment-specific configuration, including API endpoints, server URLs, and potentially sensitive tokens.

### Deployment Documentation and Configuration
- `HEROKU_DEPLOYMENT.md` - Contains detailed server setup instructions
- `NETLIFY_SETUP.md` - Contains Netlify deployment details
- `heroku-server/` - Complete server code and configuration
- `netlify-build.sh` - Build script with potential sensitive flags
- `netlify.toml` - Netlify-specific configuration

### SSL/TLS Certificates and Keys
- `**/*.pem`
- `**/*.key`
- `**/*.crt`
- `**/*.cert`

These are cryptographic certificates and private keys that should never be committed to version control.

### Sensitive Configuration Files
- `**/config.prod.ts`
- `**/config.production.ts`
- `**/*.config.prod.js`
- `**/*-secrets.json`
- `**/*_secrets.json`
- `**/*.secret.*`

Files that might contain API keys, database credentials, or other sensitive configuration.

## How to Handle Excluded Files

### For New Team Members

If you're joining the project, you'll need to:

1. Get the necessary `.env` files from a team member securely (not via email)
2. Request access to the Heroku and Netlify accounts
3. Set up your local development environment using the README.md instructions

### For Deployment

Deployment-specific files should be provided separately and securely to team members who need to perform deployments.

## Server Information

The Gosei Play application uses:

- Frontend: Deployed on Netlify
- Backend: Socket.IO server deployed on Heroku
- Custom domain: svr-01.gosei.xyz

Detailed server configuration information should be shared only through secure channels.

## Security Best Practices

1. **Never commit sensitive information** to version control
2. **Use environment variables** for configuration
3. **Rotate secrets regularly** (API keys, credentials)
4. **Limit access** to deployment platforms
5. **Keep dependencies updated** to avoid security vulnerabilities
6. **Use HTTPS** for all communications
7. **Enable CORS properly** to restrict unauthorized domains

## Reporting Security Issues

If you discover a security vulnerability, please do NOT open an issue. Email [YOUR-EMAIL] with details about the vulnerability.

## Further Information

For further details about deployment, contact the project maintainers directly. 