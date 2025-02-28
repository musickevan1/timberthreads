import React from 'react';
import { Tab } from './types';

interface EmptyStateProps {
  activeTab: Tab;
}

const EmptyState: React.FC<EmptyStateProps> = ({ activeTab }) => {
  return (
    <div className="col-span-3 bg-stone-50 p-8 rounded-lg border border-stone-200 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-stone-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p className="text-stone-600 mb-4">
        {activeTab === 'deleted' 
          ? "No deleted images found. When you remove images, they'll appear here."
          : `No images found in the ${activeTab} section. Upload images to get started.`
        }
      </p>
    </div>
  );
};

export default EmptyState;
