const Stripe = require('stripe');

let stripe;

const getStripe = () => {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET || '', { apiVersion: '2024-06-20' });
  }
  return stripe;
};

module.exports = { getStripe };
