import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import { Icons } from '../components/icons/Icons';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="text-9xl font-bold text-primary-600">404</div>
      <h1 className="text-4xl font-bold text-gray-900">Page Not Found</h1>
      <p className="text-xl text-gray-600 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/">
        <Button size="lg" icon={<Icons.Folder />}>
          Go Home
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
