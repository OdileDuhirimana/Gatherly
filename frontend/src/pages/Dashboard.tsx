import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { RootState } from '../store';
import { fetchEvents } from '../store/slices/eventsSlice';
import { fetchProfile } from '../store/slices/authSlice';

const Dashboard = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { events } = useSelector((state: RootState) => state.events);
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    if (token) {
      dispatch(fetchProfile(token));
      dispatch(fetchEvents());
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (user && events.length > 0) {
      const filtered = events.filter(event => event.organizerId === user.id);
      setUserEvents(filtered);
      setLoading(false);
    }
  }, [user, events]);

  if (!token) {
    return (
      <div className="text-center py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Please login to access your dashboard
        </div>
        <Link to="/login" className="text-blue-600 hover:text-blue-500 mt-4 inline-block">
          Go to Login
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Welcome, {user?.name}!
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Your Events
          </h2>
          
          {userEvents.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600 mb-4">You haven't created any events yet.</p>
              <Link
                to="/events"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Create Your First Event
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {userEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{event.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {new Date(event.dateTime).toLocaleDateString()} at {event.location}
                    </div>
                    <Link
                      to={`/events/${event.id}`}
                      className="text-blue-600 hover:text-blue-500"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <Link
              to="/events"
              className="block w-full bg-blue-500 text-white text-center py-3 rounded hover:bg-blue-600 transition-colors"
            >
              Browse All Events
            </Link>
            
            {user?.role === 'organizer' || user?.role === 'admin' ? (
              <button className="block w-full bg-green-500 text-white text-center py-3 rounded hover:bg-green-600 transition-colors">
                Create New Event
              </button>
            ) : null}
            
            <Link
              to="/events"
              className="block w-full bg-purple-500 text-white text-center py-3 rounded hover:bg-purple-600 transition-colors"
            >
              My Registrations
            </Link>
          </div>
          
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Info</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {user?.name}</div>
              <div><span className="font-medium">Email:</span> {user?.email}</div>
              <div><span className="font-medium">Role:</span> {user?.role}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
