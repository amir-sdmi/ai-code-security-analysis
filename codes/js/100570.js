// /pages/api/webhook.js
import { buffer } from 'micro';
import Stripe from 'stripe';

// ✅ Use environment variable for your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});

export const config = {
  api: {
    bodyParser: false, // Required by Stripe to validate signature
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      const buf = await buffer(req);
      event = stripe.webhooks.constructEvent(
        buf.toString(),
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ✅ Handle successful checkout session
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('✅ Payment received from:', session.customer_email);
    }

    // Acknowledge receipt of the event
    return res.status(200).json({ received: true });
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}

// Created by ChatGPT
