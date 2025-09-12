import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        Welcome to Gatherly
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        The ultimate event management platform. Create, manage, and attend amazing events.
      </p>
      
      <div className="flex justify-center space-x-4">
        <Link
          to="/events"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Browse Events
        </Link>
        <Link
          to="/register"
          className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
        >
          Get Started
        </Link>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎉</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Create Events</h3>
          <p className="text-gray-600">
            Organize and manage your events with our intuitive platform
          </p>
        </div>
        
        <div className="text-center">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👥</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Connect People</h3>
          <p className="text-gray-600">
            Bring communities together through meaningful events
          </p>
        </div>
        
        <div className="text-center">
          <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Track Analytics</h3>
          <p className="text-gray-600">
            Monitor attendance and engagement with detailed insights
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
