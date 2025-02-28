import React from 'react';

const GalleryHeader: React.FC = () => {
  return (
    <div className="p-6 border-b border-stone-200">
      <h2 className="text-2xl font-serif text-stone-800">Gallery Management</h2>
      <p className="text-stone-600 mt-1">
        Manage images displayed on your website
      </p>
    </div>
  );
};

export default GalleryHeader;
