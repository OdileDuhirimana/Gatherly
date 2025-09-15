import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Tag, Clock, Eye, Edit, Trash2, Star } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  description: string;
  dateTime: string;
  location: string;
  category: string;
  maxAttendees: number;
  imageUrl?: string;
  attendeeCount?: number;
  organizer: {
    id: number;
    name: string;
  };
  isFull?: boolean;
  isRegistered?: boolean;
}

interface EventCardProps {
  event: Event;
  onRegister?: (eventId: number) => void;
  onCancelRegistration?: (eventId: number) => void;
  onEdit?: (eventId: number) => void;
  onDelete?: (eventId: number) => void;
  userRole?: string;
  isRegistered?: boolean;
  viewMode?: 'grid' | 'list';
}

const EventCard = ({ 
  event, 
  onRegister, 
  onCancelRegistration, 
  onEdit, 
  onDelete, 
  userRole, 
  isRegistered,
  viewMode = 'grid'
}: EventCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isUpcoming = new Date(event.dateTime) > new Date();
  const isOrganizerOrAdmin = userRole === 'organizer' || userRole === 'admin';

  if (viewMode === 'list') {
    return (
      <div className="card p-6 hover:shadow-xl transition-all duration-300">
        <div className="flex gap-6">
          {/* Event Image */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-lg overflow-hidden">
              <img
                src={event.imageUrl || 'https://via.placeholder.com/300x200?text=Event+Image'}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Event Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold text-gray-900 line-clamp-1">
                {event.title}
              </h3>
              <div className="flex items-center space-x-2">
                {isUpcoming && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Upcoming
                  </span>
                )}
                {event.isFull && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                    Full
                  </span>
                )}
                {isRegistered && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Registered
                  </span>
                )}
              </div>
            </div>

            <p className="text-gray-600 mb-4 line-clamp-2">
              {event.description}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{formatDate(event.dateTime)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-2" />
                <span>{formatTime(event.dateTime)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="truncate">{event.location}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Users className="w-4 h-4 mr-2" />
                <span>
                  {event.attendeeCount || 0} / {event.maxAttendees || '∞'}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Organized by <span className="font-medium text-gray-700">{event.organizer.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Link
                  to={`/events/${event.id}`}
                  className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </Link>
                {isOrganizerOrAdmin && (
                  <>
                    <button
                      onClick={() => onEdit?.(event.id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete?.(event.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                {userRole === 'attendee' && isUpcoming && (
                  isRegistered ? (
                    <button
                      onClick={() => onCancelRegistration?.(event.id)}
                      className="btn-danger text-sm"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={() => onRegister?.(event.id)}
                      disabled={event.isFull}
                      className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {event.isFull ? 'Full' : 'Register'}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="card overflow-hidden group hover:scale-105 transition-all duration-300">
      {/* Event Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.imageUrl || 'https://via.placeholder.com/400x200?text=Event+Image'}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 flex flex-col space-y-2">
          {isUpcoming && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Upcoming
            </span>
          )}
          {event.isFull && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
              Full
            </span>
          )}
          {isRegistered && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Registered
            </span>
          )}
        </div>
        {event.category && (
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 bg-white/90 text-gray-800 text-xs rounded-full flex items-center">
              <Tag className="w-3 h-3 mr-1" />
              {event.category}
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Event Title */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          <Link to={`/events/${event.id}`}>
            {event.title}
          </Link>
        </h3>

        {/* Event Description */}
        <p className="text-gray-600 mb-4 line-clamp-2">
          {event.description}
        </p>

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{formatDate(event.dateTime)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-2" />
            <span>{formatTime(event.dateTime)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Users className="w-4 h-4 mr-2" />
            <span>
              {event.attendeeCount || 0} / {event.maxAttendees || '∞'} attendees
            </span>
          </div>
        </div>

        {/* Organizer */}
        <div className="text-sm text-gray-500 mb-4">
          Organized by <span className="font-medium text-gray-700">{event.organizer.name}</span>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Link
            to={`/events/${event.id}`}
            className="text-primary-600 hover:text-primary-800 font-medium text-sm flex items-center"
          >
            <Eye className="w-4 h-4 mr-1" />
            View Details
          </Link>
          
          <div className="flex items-center space-x-2">
            {isOrganizerOrAdmin && (
              <>
                <button
                  onClick={() => onEdit?.(event.id)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete?.(event.id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            {userRole === 'attendee' && isUpcoming && (
              isRegistered ? (
                <button
                  onClick={() => onCancelRegistration?.(event.id)}
                  className="btn-danger text-sm"
                >
                  Cancel
                </button>
              ) : (
                <button
                  onClick={() => onRegister?.(event.id)}
                  disabled={event.isFull}
                  className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {event.isFull ? 'Full' : 'Register'}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;