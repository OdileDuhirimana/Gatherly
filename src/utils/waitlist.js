const crypto = require('crypto');
const { models } = require('../models');
const { Op } = require('sequelize');

const offerMinutes = () => parseInt(process.env.WAITLIST_OFFER_EXPIRES_MIN || '60', 10);

const expireOffers = async ({ eventId, ticketId }) => {
  const where = {
    status: 'pending',
    expiresAt: { [Op.lt]: new Date() }
  };
  if (eventId) where.eventId = eventId;
  if (ticketId) where.ticketId = ticketId;

  const expired = await models.WaitlistOffer.findAll({ where });
  for (const offer of expired) {
    offer.status = 'expired';
    await offer.save();
  }

  return expired.length;
};

const createOffer = async ({ eventId, ticketId, attendeeId }) => {
  const expiresAt = new Date(Date.now() + offerMinutes() * 60 * 1000);
  const offer = await models.WaitlistOffer.create({
    eventId,
    ticketId,
    attendeeId,
    token: crypto.randomUUID(),
    status: 'pending',
    expiresAt
  });
  return offer;
};

const promoteNextFromWaitlist = async ({ eventId, ticketId }) => {
  await expireOffers({ eventId, ticketId });

  const candidates = await models.Attendee.findAll({
    where: { eventId, ticketId, waitlisted: true },
    order: [['id', 'ASC']]
  });

  for (const attendee of candidates) {
    const existing = await models.WaitlistOffer.findOne({
      where: { attendeeId: attendee.id, ticketId, status: 'pending' }
    });
    if (!existing) {
      return createOffer({ eventId, ticketId, attendeeId: attendee.id });
    }
  }

  return null;
};

const claimWaitlistOffer = async ({ token, userId }) => {
  await expireOffers({});

  const offer = await models.WaitlistOffer.findOne({
    where: { token, status: 'pending' },
    include: [{ model: models.Attendee, as: 'attendee' }, { model: models.Ticket, as: 'ticket' }]
  });

  if (!offer) return { error: 'Offer not found or expired', status: 404 };

  const attendee = offer.attendee;
  if (!attendee || attendee.userId !== userId) {
    return { error: 'Offer does not belong to this user', status: 403 };
  }

  if (new Date(offer.expiresAt).getTime() < Date.now()) {
    offer.status = 'expired';
    await offer.save();
    return { error: 'Offer expired', status: 409 };
  }

  attendee.waitlisted = false;
  await attendee.save();

  const ticket = offer.ticket || await models.Ticket.findByPk(offer.ticketId);
  if (ticket) {
    ticket.sold = Math.min(ticket.quantity, (ticket.sold || 0) + 1);
    await ticket.save();
  }

  offer.status = 'claimed';
  offer.claimedAt = new Date();
  await offer.save();

  return { offer, attendee };
};

module.exports = { expireOffers, createOffer, promoteNextFromWaitlist, claimWaitlistOffer };
