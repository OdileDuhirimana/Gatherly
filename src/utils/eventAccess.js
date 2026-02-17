const { models } = require('../models');

const getEventAndRoleContext = async ({ eventId, user }) => {
  const event = await models.Event.findByPk(eventId);
  if (!event) return { error: 'Event not found', status: 404 };

  if (user.role === 'Admin') return { event, canManage: true, role: 'Admin' };
  if (event.organizerId === user.id) return { event, canManage: true, role: 'Organizer' };

  const team = await models.EventTeamMember.findOne({ where: { eventId, userId: user.id } });
  if (!team) return { event, canManage: false, role: null };

  return { event, canManage: true, role: team.role, approvalRequired: !!team.approvalRequired, teamMember: team };
};

module.exports = { getEventAndRoleContext };
