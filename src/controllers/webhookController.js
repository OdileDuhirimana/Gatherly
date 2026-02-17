const { models } = require('../models');
const { getStripe } = require('../utils/stripe');
const qrcode = require('qrcode');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { sendEmail } = require('../utils/email');
const { signCheckInToken } = require('../utils/checkinToken');
const { enqueueOutboxEvent } = require('../utils/outbox');

const parseWebhookBody = (body) => {
  if (Buffer.isBuffer(body)) {
    const text = body.toString('utf8');
    if (!text) return {};
    return JSON.parse(text);
  }
  return body;
};

const stripeWebhook = async (req, res) => {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    if (!webhookSecret) {
      event = parseWebhookBody(req.body); // fallback mode when secret is not configured
    } else {
      const payload = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const payment = await models.Payment.findOne({ where: { stripePaymentId: intent.id } });
    if (payment && payment.status !== 'succeeded') {
      payment.status = 'succeeded';
      await payment.save();
      // Issue tickets
      const quantity = parseInt(intent.metadata?.quantity || '1', 10);
      const ticketId = parseInt(intent.metadata?.ticketId || '0', 10);
      const eventId = parseInt(intent.metadata?.eventId || '0', 10);
      const userId = parseInt(intent.metadata?.userId || '0', 10);
      const ticket = await models.Ticket.findByPk(ticketId);
      if (ticket) {
        ticket.sold = Math.min(ticket.quantity, (ticket.sold || 0) + quantity);
        await ticket.save();
        // Create attendees and generate PDFs
        for (let i = 0; i < quantity; i++) {
          const attendee = await models.Attendee.create({ userId, eventId, ticketId, checkedIn: false, waitlisted: false, vip: ticket.type === 'VIP' });
          await generateAndEmailTicket({ attendee, ticket });
        }
      }

      await enqueueOutboxEvent('payment.succeeded', {
        paymentId: payment.id,
        stripePaymentIntent: intent.id,
        quantity
      });
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    const payment = await models.Payment.findOne({ where: { stripePaymentId: intent.id } });
    if (payment && payment.status !== 'failed') {
      payment.status = 'failed';
      await payment.save();
    }
  }

  res.json({ received: true });
};

async function generateAndEmailTicket({ attendee, ticket }) {
  try {
    const qrData = signCheckInToken({ attendeeId: attendee.id, eventId: attendee.eventId, ticketId: attendee.ticketId });
    const qrPng = await qrcode.toDataURL(qrData);
    const pdfDir = path.join(process.cwd(), process.env.TICKET_PDF_DIR || 'storage/tickets');
    const pdfPath = path.join(pdfDir, `ticket-${attendee.id}.pdf`);

    await new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);
      doc.fontSize(20).text('Gatherly E-Ticket', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Attendee ID: ${attendee.id}`);
      doc.text(`Event ID: ${attendee.eventId}`);
      doc.text(`Ticket Type: ${ticket.type}`);
      doc.moveDown();
      doc.text('Scan QR to check-in:');
      const base64Data = qrPng.replace(/^data:image\/png;base64,/, '');
      const imgPath = path.join(pdfDir, `qr-${attendee.id}.png`);
      fs.writeFileSync(imgPath, base64Data, 'base64');
      doc.image(imgPath, { fit: [200, 200] });
      doc.end();
      writeStream.on('finish', () => {
        try { fs.unlinkSync(imgPath); } catch (e) {}
        resolve();
      });
      writeStream.on('error', reject);
    });

    const user = await models.User.findByPk(attendee.userId);
    if (user && user.email) {
      await sendEmail({ to: user.email, subject: 'Your Gatherly E-Ticket', text: `Your ticket is ready. Download: ${process.env.BASE_URL || 'http://localhost:5000'}/tickets/ticket-${attendee.id}.pdf` });
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    if (process.env.NODE_ENV !== 'test') console.error('Ticket generation/email error:', e.message);
  }
}

module.exports = { stripeWebhook };
