const { models } = require('../models');
const { Op } = require('sequelize');

const evaluatePurchaseRisk = async ({ userId, ticket, quantity, donationAmount = 0 }) => {
  let score = 0;
  const flags = [];

  const unitPrice = Number(ticket?.price || 0);
  const total = unitPrice * quantity + Number(donationAmount || 0);

  if (quantity >= 5) {
    score += 25;
    flags.push('high_quantity');
  }
  if (quantity >= 8) {
    score += 20;
    flags.push('very_high_quantity');
  }

  if (Number(donationAmount || 0) > 500) {
    score += 10;
    flags.push('large_donation_amount');
  }

  if (total >= 500) {
    score += 15;
    flags.push('high_value_order');
  }

  const lookback = new Date(Date.now() - 10 * 60 * 1000);
  const recentPayments = await models.Payment.count({
    where: {
      userId,
      createdAt: { [Op.gte]: lookback }
    }
  });

  if (recentPayments >= 3) {
    score += 25;
    flags.push('rapid_repeat_purchase');
  }

  if (ticket?.type === 'VIP') {
    score += 10;
    flags.push('premium_ticket');
  }

  let level = 'low';
  if (score >= 40) level = 'medium';
  if (score >= 70) level = 'high';

  return { score, level, flags };
};

module.exports = { evaluatePurchaseRisk };
