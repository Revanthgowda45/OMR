import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  BarChart3, 
  Upload, 
  FileText, 
  Settings, 
  BookOpen,
  Home
} from 'lucide-react';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Upload OMR', href: '/upload', icon: Upload },
  { name: 'Results', href: '/results', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Admin', href: '/admin', icon: Settings },
];

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col w-64 bg-white dark:bg-gray-800 shadow-lg">
      <div className="flex items-center justify-center h-16 px-4 bg-blue-600 dark:bg-blue-700">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold text-white">OMR System</h1>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={clsx(
                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200',
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Version 1.0.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar;