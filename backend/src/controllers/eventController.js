
import { Event, Registration, User } from '../models/index.js';
import { Op } from 'sequelize';

export async function listEvents(req, res) {
  try {
    const { page = 1, limit = 10, category, search, upcoming } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    
    // Filter by category
    if (category) {
      whereClause.category = category;
    }
    
    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Filter upcoming events
    if (upcoming === 'true') {
      whereClause.dateTime = { [Op.gte]: new Date() };
    }
    
    const { count, rows: events } = await Event.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: User, 
          as: 'organizer', 
          attributes: ['id', 'name', 'email'] 
        }
      ],
      order: [['dateTime', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // Add attendee count to each event
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const attendeeCount = await Registration.count({
          where: { eventId: event.id, status: { [Op.ne]: 'cancelled' } }
        });
        return {
          ...event.toJSON(),
          attendeeCount,
          isFull: event.maxAttendees ? attendeeCount >= event.maxAttendees : false
        };
      })
    );
    
    res.json({
      events: eventsWithStats,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events', error: error.message });
  }
}

export async function createEvent(req, res) {
  try {
    const eventData = {
      ...req.body,
      organizerId: req.user.id
    };
    
    // Handle image upload
    if (req.file) {
      eventData.imageUrl = `/uploads/${req.file.filename}`;
    }
    
    const event = await Event.create(eventData);
    const eventWithOrganizer = await Event.findByPk(event.id, {
      include: [{ model: User, as: 'organizer', attributes: ['id', 'name', 'email'] }]
    });
    
    res.status(201).json({ 
      message: 'Event created successfully',
      event: eventWithOrganizer 
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(400).json({ message: 'Failed to create event', error: error.message });
  }
}

export async function getEvent(req, res) {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        { 
          model: User, 
          as: 'organizer', 
          attributes: ['id', 'name', 'email'] 
        }
      ]
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Get attendee count and registrations
    const attendeeCount = await Registration.count({
      where: { eventId: event.id, status: { [Op.ne]: 'cancelled' } }
    });
    
    const isRegistered = req.user ? await Registration.findOne({
      where: { userId: req.user.id, eventId: event.id }
    }) : null;
    
    res.json({
      event: {
        ...event.toJSON(),
        attendeeCount,
        isRegistered: !!isRegistered,
        isFull: event.maxAttendees ? attendeeCount >= event.maxAttendees : false
      }
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Failed to fetch event', error: error.message });
  }
}

export async function updateEvent(req, res) {
  try {
    const event = await Event.findByPk(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check permissions
    if (req.user.role !== 'admin' && event.organizerId !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own events' });
    }
    
    const updateData = { ...req.body };
    
    // Handle image upload
    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }
    
    await event.update(updateData);
    
    const updatedEvent = await Event.findByPk(event.id, {
      include: [{ model: User, as: 'organizer', attributes: ['id', 'name', 'email'] }]
    });
    
    res.json({ 
      message: 'Event updated successfully',
      event: updatedEvent 
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(400).json({ message: 'Failed to update event', error: error.message });
  }
}

export async function deleteEvent(req, res) {
  try {
    const event = await Event.findByPk(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check permissions
    if (req.user.role !== 'admin' && event.organizerId !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own events' });
    }
    
    // Delete all registrations for this event
    await Registration.destroy({ where: { eventId: event.id } });
    
    // Delete the event
    await event.destroy();
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Failed to delete event', error: error.message });
  }
}

export async function getEventStats(req, res) {
  try {
    const eventId = req.params.id;
    
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check permissions
    if (req.user.role !== 'admin' && event.organizerId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const totalRegistrations = await Registration.count({
      where: { eventId }
    });
    
    const checkedInCount = await Registration.count({
      where: { eventId, status: 'checked_in' }
    });
    
    const cancelledCount = await Registration.count({
      where: { eventId, status: 'cancelled' }
    });
    
    const activeRegistrations = totalRegistrations - cancelledCount;
    
    res.json({
      eventId,
      totalRegistrations,
      activeRegistrations,
      checkedInCount,
      cancelledCount,
      attendanceRate: activeRegistrations > 0 ? (checkedInCount / activeRegistrations * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    res.status(500).json({ message: 'Failed to fetch event statistics', error: error.message });
  }
}

export async function getUserEvents(req, res) {
  try {
    const { role } = req.user;
    let events;
    
    if (role === 'organizer' || role === 'admin') {
      // Get events created by the user
      events = await Event.findAll({
        where: { organizerId: req.user.id },
        include: [{ model: User, as: 'organizer', attributes: ['id', 'name', 'email'] }],
        order: [['dateTime', 'DESC']]
      });
    } else {
      // Get events the user is registered for
      const registrations = await Registration.findAll({
        where: { userId: req.user.id },
        include: [{
          model: Event,
          include: [{ model: User, as: 'organizer', attributes: ['id', 'name', 'email'] }]
        }],
        order: [['createdAt', 'DESC']]
      });
      
      events = registrations.map(reg => ({
        ...reg.Event.toJSON(),
        registrationStatus: reg.status,
        registeredAt: reg.createdAt
      }));
    }
    
    res.json({ events });
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ message: 'Failed to fetch user events', error: error.message });
  }
}
