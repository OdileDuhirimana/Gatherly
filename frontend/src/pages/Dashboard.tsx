import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Calendar, Users, MapPin, Plus, TrendingUp, Clock, Eye, Edit, Trash2, BarChart3, Bell, Settings } from 'lucide-react';
import type { RootState } from '../store';
import { fetchProfile } from '../store/slices/authSlice';
import { fetchEvents } from '../store/slices/eventsSlice';

const Dashboard = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { events, loading } = useSelector((state: RootState) => state.events);
  const dispatch = useDispatch<any>();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (token) {
      dispatch(fetchProfile());
      dispatch(fetchEvents());
    }
  }, [token, dispatch]);

  const upcomingEvents = events.filter(event => new Date(event.dateTime) > new Date());
  const pastEvents = events.filter(event => new Date(event.dateTime) <= new Date());
  const myEvents = events.filter(event => event.organizerId === user?.id);

  if (!token) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-6 py-4 rounded-lg mb-4">
            Please login to access your dashboard
          </div>
          <Link to="/login" className="btn-primary">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
          <p className="mt-6 text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'events', label: 'My Events', icon: <Calendar className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gradient">Gatherly</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-gray-700 font-medium">{user?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-xl text-gray-600">
            Here's what's happening with your events today.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span className="ml-2">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card p-6 group hover:scale-105 transition-transform">
                <div className="flex items-center">
                  <div className="p-3 bg-primary-100 rounded-xl">
                    <Calendar className="w-8 h-8 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Events</p>
                    <p className="text-3xl font-bold text-gray-900">{events.length}</p>
                  </div>
                </div>
              </div>

              <div className="card p-6 group hover:scale-105 transition-transform">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Upcoming</p>
                    <p className="text-3xl font-bold text-gray-900">{upcomingEvents.length}</p>
                  </div>
                </div>
              </div>

              <div className="card p-6 group hover:scale-105 transition-transform">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Past Events</p>
                    <p className="text-3xl font-bold text-gray-900">{pastEvents.length}</p>
                  </div>
                </div>
              </div>

              <div className="card p-6 group hover:scale-105 transition-transform">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Attendees</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {events.reduce((sum, event) => sum + (event.attendeeCount || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-6 mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/events/create"
                  className="btn-primary text-center py-4 flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Event
                </Link>
                <Link
                  to="/events"
                  className="btn-secondary text-center py-4 flex items-center justify-center"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Browse Events
                </Link>
                <Link
                  to="/analytics"
                  className="btn-secondary text-center py-4 flex items-center justify-center"
                >
                  <BarChart3 className="w-5 h-5 mr-2" />
                  View Analytics
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="card">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Upcoming Events</h2>
                </div>
                <div className="p-6">
                  {upcomingEvents.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No upcoming events</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingEvents.slice(0, 5).map((event) => (
                        <div key={event.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-primary-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {event.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(event.dateTime).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <Link
                              to={`/events/${event.id}`}
                              className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Recent Events</h2>
                </div>
                <div className="p-6">
                  {pastEvents.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No recent events</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pastEvents.slice(0, 5).map((event) => (
                        <div key={event.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-gray-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {event.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(event.dateTime).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <Link
                              to={`/events/${event.id}`}
                              className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* My Events Tab */}
        {activeTab === 'events' && (
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">My Events</h2>
                <Link to="/events/create" className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Link>
              </div>
            </div>
            <div className="p-6">
              {myEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
                  <p className="text-gray-500 mb-6">Create your first event to get started!</p>
                  <Link to="/events/create" className="btn-primary">
                    Create Your First Event
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myEvents.map((event) => (
                    <div key={event.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                      <div className="flex items-center text-gray-500 text-sm mb-4">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{new Date(event.dateTime).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-gray-500 text-sm mb-4">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                          <Link
                            to={`/events/${event.id}`}
                            className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="text-sm text-gray-500">
                          {event.attendeeCount || 0} attendees
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="card p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Event Analytics</h2>
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
              <p className="text-gray-500">Detailed analytics and insights will be available soon.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;