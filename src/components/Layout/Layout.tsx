import React, { ReactNode } from 'react';
import ResponsiveNavigation from './ResponsiveNavigation';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <ResponsiveNavigation>
      {children}
    </ResponsiveNavigation>
  );
};

export default Layout;