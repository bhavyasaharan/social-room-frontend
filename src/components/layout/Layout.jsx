import React from 'react';
import Header from './Header';

const Layout = ({ children, fullScreen = false }) => {
  return (
    <div className="flex min-h-screen bg-[#121212]">
      <Header />
      <main className={fullScreen
        ? 'h-screen min-w-0 flex-1 overflow-hidden'
        : 'mx-auto min-w-0 w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8'}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
