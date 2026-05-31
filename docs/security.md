# BlueSocket Security

## Authentication
- **JWT:** Access tokens are issued upon login and must be sent in the `Authorization: Bearer <token>` header.
- **Sessions:** Server-side session tracking in the `sessions` table allows for global logout and session invalidation.

## Data Protection
- **HTTPS/TLS:** Mandatory for all communication to prevent man-in-the-middle attacks.
- **Stateless Requests:** Minimizes the risk of session hijacking via persistent socket pinning.

## Security Considerations (Prototype)
- **Plaintext Passwords:** Currently stored in plaintext for demonstration. **Production use requires hashing (e.g., Argon2 or BCrypt).**
- **Token Expiry:** JWT tokens should have a short lifespan (1 hour in prototype).
- **Rate Limiting:** Should be implemented at the Vercel/WAF level to prevent polling abuse.
- **SQL Injection:** Handled by using parameterized queries with `@libsql/client`.
