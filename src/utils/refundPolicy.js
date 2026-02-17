const DEFAULT_WINDOWS = [
  { hoursBefore: 168, percent: 100 },
  { hoursBefore: 72, percent: 50 },
  { hoursBefore: 24, percent: 25 }
];

const getPolicyWindows = (ticket) => {
  const windows = ticket?.refundPolicy?.windows;
  if (!Array.isArray(windows) || windows.length === 0) return DEFAULT_WINDOWS;
  return [...windows].sort((a, b) => Number(b.hoursBefore || 0) - Number(a.hoursBefore || 0));
};

const computeRefund = ({ ticket, event, payment, now = new Date() }) => {
  if (!event?.startDate) {
    return { eligible: false, percent: 0, refundAmount: 0, reason: 'Event start date missing' };
  }

  const windows = getPolicyWindows(ticket);
  const diffMs = new Date(event.startDate).getTime() - new Date(now).getTime();
  const hoursUntil = diffMs / (1000 * 60 * 60);

  let percent = 0;
  for (const window of windows) {
    if (hoursUntil >= Number(window.hoursBefore || 0)) {
      percent = Number(window.percent || 0);
      break;
    }
  }

  const amount = Number(payment?.amount || 0);
  const alreadyRefunded = Number(payment?.refundedAmount || 0);
  const refundableBase = Math.max(0, amount - alreadyRefunded);
  const refundAmount = Math.round(refundableBase * (percent / 100) * 100) / 100;

  return {
    eligible: refundAmount > 0,
    percent,
    refundAmount,
    hoursUntil,
    policy: windows,
    reason: refundAmount > 0 ? null : 'Refund window elapsed'
  };
};

module.exports = { computeRefund, DEFAULT_WINDOWS };
