const { models } = require('../models');

const transparency = async (req, res, next) => {
  try {
    const publishedEvents = await models.Event.count({ where: { published: true } });
    const attendance = await models.Attendee.count({ where: { waitlisted: false } });
    const checkedIn = await models.Attendee.count({ where: { checkedIn: true, waitlisted: false } });
    const emergencyBroadcasts = await models.Notification.count({ where: { type: 'Emergency' } });

    const scholarshipApproved = await models.ScholarshipApplication.count({ where: { status: 'approved' } });

    const donationTotalRaw = await models.Payment.sum('donationAmount', {
      where: {
        status: { [models.Payment.sequelize.Op.in]: ['succeeded', 'partial_refund', 'refunded'] }
      }
    });
    const donationTotal = Number(donationTotalRaw || 0);

    const noShows = Math.max(0, attendance - checkedIn);
    const noShowRate = attendance > 0 ? Number(((noShows / attendance) * 100).toFixed(2)) : 0;

    res.json({
      data: {
        publishedEvents,
        attendance,
        checkedIn,
        noShows,
        noShowRate,
        scholarshipApproved,
        donationTotal,
        emergencyBroadcasts
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { transparency };
