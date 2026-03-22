## Getting Started

1. Run `npm install`
2. Run `npm run dev`

## Demo Accounts

- Customer: `user@example.com` / `password`
- Admin: `admin@example.com` / `admin123`

## Admin Product Management

- Sign in with the admin account.
- Open `/admin/products` or use the Admin link in the navigation.
- Product create, update, and delete actions now call the backend product API.

## API Configuration

- Default API base URL: `http://localhost/api`
- Default product endpoint: `/products`
- Override with Vite env vars if your gateway uses different values:

```bash
VITE_API_BASE_URL=http://localhost/api
VITE_PRODUCTS_ENDPOINT=/products
```

- Expected product routes:
  - `GET /products`
  - `GET /products/:id`
  - `POST /products`
  - `PUT /products/:id`
  - `DELETE /products/:id`

## PayPal Payment Integration

- Checkout now uses PayPal JavaScript SDK buttons and backend create/capture endpoints.
- In `docker-compose.yml`, update these payment-service values with your PayPal sandbox credentials:
  - `PAYPAL_CLIENT_ID`
  - `PAYPAL_CLIENT_SECRET`
