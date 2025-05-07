
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Navigation: React.FC = () => {
  const location = useLocation();
  
  return (
    <nav className="bg-background border-b py-3">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold mr-8">Assignment System</h1>
          
          <div className="flex space-x-4">
            <Link to="/">
              <Button 
                variant={location.pathname === '/' ? 'default' : 'ghost'}
              >
                Text Corruptor
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button 
                variant={location.pathname === '/dashboard' ? 'default' : 'ghost'}
              >
                Assignments Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
