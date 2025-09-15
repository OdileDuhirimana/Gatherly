import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Tag, Upload, X, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { eventsAPI } from '../services/api';

interface FormData {
  title: string;
  description: string;
  dateTime: string;
  location: string;
  category?: string;
  maxAttendees?: number;
}

const CreateEvent = () => {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    dateTime: '',
    location: '',
    category: '',
    maxAttendees: undefined,
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxAttendees' ? (value ? parseInt(value) : undefined) : value
    }));
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    else if (formData.title.length < 3) newErrors.title = 'Title must be at least 3 characters';
    
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    else if (formData.description.length < 10) newErrors.description = 'Description must be at least 10 characters';
    
    if (!formData.dateTime) newErrors.dateTime = 'Date and time is required';
    
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    else if (formData.location.length < 3) newErrors.location = 'Location must be at least 3 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('dateTime', formData.dateTime);
      submitData.append('location', formData.location);
      if (formData.category) submitData.append('category', formData.category);
      if (formData.maxAttendees) submitData.append('maxAttendees', formData.maxAttendees.toString());

      const imageInput = document.getElementById('image') as HTMLInputElement;
      if (imageInput?.files?.[0]) {
        submitData.append('image', imageInput.files[0]);
      }

      await eventsAPI.createEvent(submitData);
      toast.success('Event created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gradient">Gatherly</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Event</h1>
            <p className="text-gray-600">Fill in the details below to create your event</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-8">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                type="text"
                className="input-field"
                placeholder="Enter event title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="input-field"
                placeholder="Describe your event"
              ></textarea>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Date and Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date & Time *
              </label>
              <div className="relative">
                <input
                  name="dateTime"
                  value={formData.dateTime}
                  onChange={handleChange}
                  type="datetime-local"
                  className="input-field"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
              {errors.dateTime && (
                <p className="mt-1 text-sm text-red-600">{errors.dateTime}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <div className="relative">
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  type="text"
                  className="input-field"
                  placeholder="e.g., Conference Hall A, Online"
                />
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            {/* Category and Max Attendees */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <div className="relative">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="input-field appearance-none"
                  >
                    <option value="">Select a category</option>
                    <option value="Technology">Technology</option>
                    <option value="Business">Business</option>
                    <option value="Arts">Arts</option>
                    <option value="Sports">Sports</option>
                    <option value="Music">Music</option>
                    <option value="Food">Food</option>
                    <option value="Education">Education</option>
                    <option value="Other">Other</option>
                  </select>
                  <Tag className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Attendees
                </label>
                <div className="relative">
                  <input
                    name="maxAttendees"
                    value={formData.maxAttendees === undefined ? '' : formData.maxAttendees}
                    onChange={handleChange}
                    type="number"
                    min="1"
                    className="input-field"
                    placeholder="e.g., 100"
                  />
                  <Users className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Image
              </label>
              <div className="flex items-center space-x-4">
                <label htmlFor="image" className="cursor-pointer btn-primary">
                  <Upload size={20} className="inline-block mr-2" /> Upload Image
                </label>
                <input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {imagePreview && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                    <img src={imagePreview} alt="Event Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-success"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
