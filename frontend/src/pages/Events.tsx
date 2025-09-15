import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Search, Filter, Plus, Calendar, Grid, List, SlidersHorizontal, MapPin, Users, Clock, Star } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

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
        search: searchTerm,
        category: selectedCategory,
        upcoming: showUpcoming
      };
      
      const response = await eventsAPI.getEvents(params);
      setEvents(response.data.events);
      setTotalPages(response.data.pagination.pages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch events');
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentPage, searchTerm, selectedCategory, showUpcoming]);

  const handleRegister = async (eventId: number) => {
    if (!token) {
      toast.error('Please log in to register for an event.');
      return;
    }
    try {
      await registrationsAPI.registerForEvent(eventId.toString());
      toast.success('Successfully registered for the event!');
      fetchEvents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to register for event.');
    }
  };

  const handleCancelRegistration = async (eventId: number) => {
    if (!token) {
      toast.error('Please log in to cancel registration.');
      return;
    }
    try {
      await registrationsAPI.cancelRegistration(eventId.toString());
      toast.success('Registration cancelled successfully!');
      fetchEvents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel registration.');
    }
  };

  const handleEventCreated = () => {
    setShowCreateForm(false);
    fetchEvents();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  const isOrganizerOrAdmin = user?.role === 'organizer' || user?.role === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
          <p className="mt-6 text-gray-600 text-lg">Loading events...</p>
        </div>
      </div>
    );
  }

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
              {isOrganizerOrAdmin && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Discover Events</h1>
          <p className="text-xl text-gray-600">Find and join amazing events happening around you</p>
        </div>

        {/* Search and Filters */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search events..."
                  className="input-field pl-10"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-64">
              <div className="relative">
                <select
                  className="input-field appearance-none"
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="mt-4 flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showUpcoming}
                onChange={(e) => setShowUpcoming(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Upcoming only</span>
            </label>
          </div>
        </div>

        {/* Events Grid/List */}
        {error ? (
          <div className="text-center py-12">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              Error: {error}
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search criteria or create a new event.</p>
            {isOrganizerOrAdmin && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
              >
                Create Your First Event
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-4'
            }`}>
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRegister={handleRegister}
                  onCancelRegistration={handleCancelRegistration}
                  userRole={user?.role}
                  isRegistered={event.isRegistered}
                  viewMode={viewMode}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`px-3 py-2 rounded-lg ${
                        currentPage === index + 1
                          ? 'bg-primary-600 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Create Event Modal */}
        {showCreateForm && (
          <CreateEventForm
            onSuccess={handleEventCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Events;