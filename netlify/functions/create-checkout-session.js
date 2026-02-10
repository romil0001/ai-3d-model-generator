const Stripe = require('stripe');

const PRODUCT_CATALOG = {
  'organic-bananas': {
    name: 'Organic Bananas',
    priceCents: 299,
  },
  'free-range-eggs': {
    name: 'Free-Range Eggs',
    priceCents: 450,
  },
  'whole-milk': {
    name: 'Whole Milk',
    priceCents: 520,
  },
  'sourdough-bread': {
    name: 'Sourdough Bread',
    priceCents: 635,
  },
  'baby-spinach': {
    name: 'Baby Spinach',
    priceCents: 379,
  },
  avocados: {
    name: 'Hass Avocados',
    priceCents: 410,
  },
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Missing STRIPE_SECRET_KEY environment variable.' }),
      };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { items } = JSON.parse(event.body || '{}');

    if (!Array.isArray(items) || items.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'No checkout items were provided.' }),
      };
    }

    const lineItems = items.map((item) => {
      const product = PRODUCT_CATALOG[item.productId];
      const quantity = Number(item.quantity);

      if (!product || !Number.isInteger(quantity) || quantity < 1) {
        throw new Error('Invalid checkout payload.');
      }

      return {
        price_data: {
          currency: 'usd',
          unit_amount: product.priceCents,
          product_data: {
            name: product.name,
          },
        },
        quantity,
      };
    });

    const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || 'http://localhost:8888';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${siteUrl}?checkout=success`,
      cancel_url: `${siteUrl}?checkout=cancelled`,
      billing_address_collection: 'auto',
      payment_method_types: ['card'],
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error instanceof Error ? error.message : 'Unable to create checkout session.',
      }),
    };
  }
};
