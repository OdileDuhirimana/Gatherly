import { Registration, Event, User } from '../models/index.js';
import { Op } from 'sequelize';

export async function registerForEvent(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if event is full
    if (event.maxAttendees) {
      const currentRegistrations = await Registration.count({
        where: { eventId: id, status: { [Op.ne]: 'cancelled' } }
      });
      
      if (currentRegistrations >= event.maxAttendees) {
        return res.status(400).json({ message: 'Event is full' });
      }
    }
    
    // Check if user is already registered
    const existingRegistration = await Registration.findOne({
      where: { userId, eventId: id }
    });
    
    if (existingRegistration) {
      if (existingRegistration.status === 'cancelled') {
        // Re-register if previously cancelled
        await existingRegistration.update({ status: 'registered' });
        return res.json({ 
          message: 'Successfully re-registered for event',
          registration: existingRegistration 
        });
      } else {
        return res.status(400).json({ message: 'You are already registered for this event' });
      }
    }
    
    // Create new registration
    const registration = await Registration.create({
      userId,
      eventId: id,
      status: 'registered'
    });
    
    const registrationWithDetails = await Registration.findByPk(registration.id, {
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        { model: Event, attributes: ['id', 'title', 'dateTime', 'location'] }
      ]
    });
    
    res.status(201).json({ 
      message: 'Successfully registered for event',
      registration: registrationWithDetails 
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
}

export async function cancelRegistration(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const registration = await Registration.findOne({
      where: { userId, eventId: id }
    });
    
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    if (registration.status === 'cancelled') {
      return res.status(400).json({ message: 'Registration is already cancelled' });
    }
    
    await registration.update({ status: 'cancelled' });
    
    res.json({ 
      message: 'Registration cancelled successfully',
      registration 
    });
  } catch (error) {
    console.error('Error cancelling registration:', error);
    res.status(500).json({ message: 'Failed to cancel registration', error: error.message });
  }
}

export async function checkIn(req, res) {
  try {
    const { id, regId } = req.params;
    
    const registration = await Registration.findByPk(regId, {
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        { model: Event, attributes: ['id', 'title', 'dateTime'] }
      ]
    });
    
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    if (registration.eventId !== parseInt(id)) {
      return res.status(400).json({ message: 'Registration does not belong to this event' });
    }
    
    if (registration.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot check in cancelled registration' });
    }
    
    if (registration.status === 'checked_in') {
      return res.status(400).json({ message: 'Already checked in' });
    }
    
    await registration.update({ status: 'checked_in' });
    
    res.json({ 
      message: 'Successfully checked in',
      registration 
    });
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({ message: 'Check-in failed', error: error.message });
  }
}

export async function listEventAttendees(req, res) {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, status } = req.query;
    const offset = (page - 1) * limit;
    
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check permissions
    if (req.user.role !== 'admin' && event.organizerId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    let whereClause = { eventId: id };
    if (status) {
      whereClause.status = status;
    }
    
    const { count, rows: registrations } = await Registration.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: User, 
          attributes: ['id', 'name', 'email'] 
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      attendees: registrations,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching attendees:', error);
    res.status(500).json({ message: 'Failed to fetch attendees', error: error.message });
  }
}

export async function getUserRegistrations(req, res) {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    
    let whereClause = { userId };
    if (status) {
      whereClause.status = status;
    }
    
    const registrations = await Registration.findAll({
      where: whereClause,
      include: [
        {
          model: Event,
          include: [{ model: User, as: 'organizer', attributes: ['id', 'name', 'email'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ registrations });
  } catch (error) {
    console.error('Error fetching user registrations:', error);
    res.status(500).json({ message: 'Failed to fetch registrations', error: error.message });
  }
}

export async function exportAttendeesCSV(req, res) {
  try {
    const { id } = req.params;
    
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check permissions
    if (req.user.role !== 'admin' && event.organizerId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const registrations = await Registration.findAll({
      where: { eventId: id, status: { [Op.ne]: 'cancelled' } },
      include: [
        { 
          model: User, 
          attributes: ['id', 'name', 'email'] 
        }
      ],
      order: [['createdAt', 'ASC']]
    });
    
    // Generate CSV content
    let csvContent = 'Name,Email,Registration Date,Status\n';
    registrations.forEach(reg => {
      csvContent += `"${reg.User.name}","${reg.User.email}","${reg.createdAt.toISOString()}","${reg.status}"\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${event.title}-attendees.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting attendees:', error);
    res.status(500).json({ message: 'Failed to export attendees', error: error.message });
  }
}
