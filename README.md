# GreenCart Grocery (Netlify + Stripe)

A lightweight grocery ecommerce storefront built with React + Vite.

## Features

- Browse grocery products and build a cart
- Secure Stripe Checkout payment flow
- Netlify Function to create Stripe checkout sessions
- Ready-to-deploy Netlify configuration (`netlify.toml`)

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file and add:
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```
3. Run the app with Netlify functions:
   ```bash
   npx netlify dev
   ```

## Deploy to Netlify (GitHub)

1. Push this repo to GitHub.
2. In Netlify, choose **Add new site → Import an existing project**.
3. Select your GitHub repo.
4. Build settings are auto-detected from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
5. Add environment variables in Netlify:
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
6. Deploy.

## Stripe setup notes

- Use Stripe test keys while validating checkout.
- Enable card payments in your Stripe dashboard.
- After deployment, run a test payment using a Stripe test card (for example `4242 4242 4242 4242`).

