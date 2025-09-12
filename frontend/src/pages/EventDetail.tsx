import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { RootState } from '../store';

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);
  
  const { token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/api/events/${id}`);
        setEvent(response.data.event);
      } catch (err) {
        setError('Failed to fetch event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleRegister = async () => {
    if (!token) {
      setError('Please login to register for events');
      return;
    }

    try {
      await axios.post(
        `http://localhost:4000/api/events/${id}/register`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRegistered(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-gray-600">Loading event...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Event not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-64 object-cover"
          />
        )}
        
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {event.title}
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Event Details</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="mr-2">📅</span>
                  <span>{new Date(event.dateTime).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">🕒</span>
                  <span>{new Date(event.dateTime).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">📍</span>
                  <span>{event.location}</span>
                </div>
                {event.category && (
                  <div className="flex items-center">
                    <span className="mr-2">🏷️</span>
                    <span>{event.category}</span>
                  </div>
                )}
                {event.maxAttendees && (
                  <div className="flex items-center">
                    <span className="mr-2">👥</span>
                    <span>Max {event.maxAttendees} attendees</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{event.description}</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">
                Organized by <span className="font-medium">{event.organizer?.name}</span>
              </p>
            </div>
            
            {token && (
              <button
                onClick={handleRegister}
                disabled={registered}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  registered
                    ? 'bg-green-500 text-white cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {registered ? 'Registered!' : 'Register for Event'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
