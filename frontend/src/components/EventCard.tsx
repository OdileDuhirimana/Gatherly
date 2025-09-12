import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Tag, Clock } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  description: string;
  dateTime: string;
  location: string;
  category: string;
  maxAttendees: number;
  imageUrl: string;
  organizer: {
    id: number;
    name: string;
  };
  attendeeCount: number;
  isFull: boolean;
  isRegistered?: boolean;
}

interface EventCardProps {
  event: Event;
  showActions?: boolean;
  onRegister?: (eventId: number) => void;
  onCancel?: (eventId: number) => void;
}

const EventCard = ({ event, showActions = true, onRegister, onCancel }: EventCardProps) => {
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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Event Image */}
      {event.imageUrl && (
        <div className="h-48 overflow-hidden">
          <img
            src={`http://localhost:4000${event.imageUrl}`}
            alt={event.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <div className="p-6">
        {/* Event Title */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          {event.title}
        </h3>

        {/* Event Description */}
        <p className="text-gray-600 mb-4 line-clamp-3">
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
          {event.category && (
            <div className="flex items-center text-sm text-gray-500">
              <Tag className="w-4 h-4 mr-2" />
              <span>{event.category}</span>
            </div>
          )}
          <div className="flex items-center text-sm text-gray-500">
            <Users className="w-4 h-4 mr-2" />
            <span>
              {event.attendeeCount} attendees
              {event.maxAttendees && ` / ${event.maxAttendees} max`}
            </span>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {!isUpcoming && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
              Past Event
            </span>
          )}
          {event.isFull && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
              Full
            </span>
          )}
          {event.isRegistered && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Registered
            </span>
          )}
        </div>

        {/* Organizer */}
        <div className="text-sm text-gray-500 mb-4">
          Organized by <span className="font-medium text-gray-700">{event.organizer.name}</span>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex justify-between items-center">
            <Link
              to={`/events/${event.id}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View Details
            </Link>
            
            {isUpcoming && (
              <div className="flex space-x-2">
                {event.isRegistered ? (
                  <button
                    onClick={() => onCancel?.(event.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={() => onRegister?.(event.id)}
                    disabled={event.isFull}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {event.isFull ? 'Full' : 'Register'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;
