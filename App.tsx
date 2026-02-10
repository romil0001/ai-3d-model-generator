import React, { useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

type Product = {
  id: string;
  name: string;
  description: string;
  unitLabel: string;
  price: number;
  image: string;
};

const products: Product[] = [
  {
    id: 'organic-bananas',
    name: 'Organic Bananas',
    description: 'Fresh bunch sourced from local farms.',
    unitLabel: '1 bunch',
    price: 2.99,
    image: '🍌',
  },
  {
    id: 'free-range-eggs',
    name: 'Free-Range Eggs',
    description: 'Dozen large free-range eggs.',
    unitLabel: '12 count',
    price: 4.5,
    image: '🥚',
  },
  {
    id: 'whole-milk',
    name: 'Whole Milk',
    description: 'Creamy whole milk from grass-fed cows.',
    unitLabel: '1 gallon',
    price: 5.2,
    image: '🥛',
  },
  {
    id: 'sourdough-bread',
    name: 'Sourdough Bread',
    description: 'Artisan sourdough loaf baked daily.',
    unitLabel: '1 loaf',
    price: 6.35,
    image: '🍞',
  },
  {
    id: 'baby-spinach',
    name: 'Baby Spinach',
    description: 'Washed and ready-to-eat organic spinach.',
    unitLabel: '8 oz bag',
    price: 3.79,
    image: '🥬',
  },
  {
    id: 'avocados',
    name: 'Hass Avocados',
    description: 'Ripe and ready avocados.',
    unitLabel: '2 pack',
    price: 4.1,
    image: '🥑',
  },
];

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');

const App: React.FC = () => {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkoutStatus = useMemo(() => new URLSearchParams(window.location.search).get('checkout'), []);

  const subtotal = useMemo(
    () =>
      products.reduce((total, product) => {
        const quantity = cart[product.id] ?? 0;
        return total + quantity * product.price;
      }, 0),
    [cart]
  );

  const cartItems = useMemo(
    () =>
      products
        .map((product) => ({ productId: product.id, quantity: cart[product.id] ?? 0, product }))
        .filter(({ quantity }) => quantity > 0),
    [cart]
  );

  const updateQuantity = (productId: string, change: number) => {
    setCart((currentCart) => {
      const next = Math.max(0, (currentCart[productId] ?? 0) + change);
      if (next === 0) {
        const { [productId]: _removed, ...rest } = currentCart;
        return rest;
      }
      return { ...currentCart, [productId]: next };
    });
  };

  const handleCheckout = async () => {
    if (!cartItems.length) {
      setErrorMessage('Please add at least one item before checkout.');
      return;
    }

    setErrorMessage(null);
    setIsCheckingOut(true);

    try {
      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map(({ productId, quantity }) => ({ productId, quantity })),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message ?? 'Unable to create checkout session.');
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe is not configured. Add VITE_STRIPE_PUBLISHABLE_KEY to your environment.');
      }

      const result = await stripe.redirectToCheckout({ sessionId: payload.sessionId });
      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Checkout failed. Please try again.');
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">GreenCart Grocery</p>
        <h1>Fresh groceries delivered fast.</h1>
        <p>Build your basket and pay securely with Stripe. Ready for Netlify deployment out of the box.</p>
      </header>


      {checkoutStatus === 'success' && (
        <p className="status success">Thanks! Your order was placed successfully.</p>
      )}
      {checkoutStatus === 'cancelled' && (
        <p className="status cancel">Checkout canceled. Your cart is still here.</p>
      )}

      <main className="layout">
        <section className="products">
          {products.map((product) => {
            const quantity = cart[product.id] ?? 0;
            return (
              <article key={product.id} className="card">
                <div className="emoji" aria-hidden="true">
                  {product.image}
                </div>
                <h2>{product.name}</h2>
                <p>{product.description}</p>
                <div className="price-row">
                  <strong>${product.price.toFixed(2)}</strong>
                  <span>{product.unitLabel}</span>
                </div>
                <div className="qty-controls">
                  <button onClick={() => updateQuantity(product.id, -1)} disabled={quantity === 0}>
                    −
                  </button>
                  <span>{quantity}</span>
                  <button onClick={() => updateQuantity(product.id, 1)}>+</button>
                </div>
              </article>
            );
          })}
        </section>

        <aside className="cart-panel">
          <h2>Your cart</h2>
          {cartItems.length === 0 ? (
            <p className="empty">Your cart is empty.</p>
          ) : (
            <ul>
              {cartItems.map(({ product, quantity }) => (
                <li key={product.id}>
                  <span>
                    {product.name} × {quantity}
                  </span>
                  <strong>${(product.price * quantity).toFixed(2)}</strong>
                </li>
              ))}
            </ul>
          )}

          <div className="summary">
            <span>Subtotal</span>
            <strong>${subtotal.toFixed(2)}</strong>
          </div>

          <button className="checkout-btn" onClick={handleCheckout} disabled={isCheckingOut}>
            {isCheckingOut ? 'Redirecting…' : 'Checkout with Stripe'}
          </button>

          {errorMessage && <p className="error">{errorMessage}</p>}
        </aside>
      </main>
    </div>
  );
};

export default App;
