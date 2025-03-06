import React from 'react';
import { Tab } from './types';

interface GalleryTabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  deletedItemsCount: number;
  actionInProgress: boolean;
}

const GalleryTabs: React.FC<GalleryTabsProps> = ({
  activeTab,
  setActiveTab,
  deletedItemsCount,
  actionInProgress
}) => {
  const tabClasses = (tab: Tab) => 
    `px-6 py-3 text-sm font-medium ${
      activeTab === tab
        ? 'bg-teal-600 text-white shadow-sm'
        : 'bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900'
    } rounded-t-lg transition-colors`;

  return (
    <div className="flex border-b border-stone-200">
      <button 
        onClick={() => setActiveTab('Facility')} 
        className={tabClasses('Facility')}
        disabled={actionInProgress}
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Facility
        </div>
      </button>
      <button 
        onClick={() => setActiveTab('Quilting')} 
        className={tabClasses('Quilting')}
        disabled={actionInProgress}
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Quilting Gallery
        </div>
      </button>
      <button 
        onClick={() => setActiveTab('deleted')} 
        className={tabClasses('deleted')}
        disabled={actionInProgress}
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Deleted Items
          {deletedItemsCount > 0 && (
            <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
              {deletedItemsCount}
            </span>
          )}
        </div>
      </button>
    </div>
  );
};

export default GalleryTabs;
