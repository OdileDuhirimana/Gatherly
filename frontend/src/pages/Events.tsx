import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Search, Filter, Plus, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import type { RootState } from '../store';
import { eventsAPI, registrationsAPI } from '../services/api';
import EventCard from '../components/EventCard';
import CreateEventForm from '../components/CreateEventForm';

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

const Events = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categories = [
    'Technology', 'Business', 'Education', 'Health', 
    'Entertainment', 'Sports', 'Food', 'Other'
  ];

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 12,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(showUpcoming && { upcoming: true }),
      };

      const response = await eventsAPI.getEvents(params);
      setEvents(response.data.events);
      setTotalPages(response.data.pagination.pages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch events');
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentPage, searchTerm, selectedCategory, showUpcoming]);

  const handleRegister = async (eventId: number) => {
    try {
      await registrationsAPI.registerForEvent(eventId.toString());
      toast.success('Successfully registered for event!');
      fetchEvents(); // Refresh events to update registration status
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleCancelRegistration = async (eventId: number) => {
    try {
      await registrationsAPI.cancelRegistration(eventId.toString());
      toast.success('Registration cancelled');
      fetchEvents(); // Refresh events to update registration status
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel registration');
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchEvents();
  };

  if (loading && events.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Events</h1>
              <p className="mt-2 text-gray-600">Discover and join amazing events</p>
            </div>
            {token && (user?.role === 'organizer' || user?.role === 'admin') && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Event
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showUpcoming}
                  onChange={(e) => setShowUpcoming(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Upcoming only</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="text-center py-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedCategory || showUpcoming
                ? 'Try adjusting your search criteria'
                : 'Be the first to create an event!'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRegister={handleRegister}
                  onCancel={handleCancelRegistration}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateForm && (
        <CreateEventForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
};

export default Events;