import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, CubeIcon, BookmarkIcon, ComputerDesktopIcon, SparklesIcon, ShoppingCartIcon, BeakerIcon, ExclamationTriangleIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';

const categoryOptions = {
  all: { label: 'All Categories', icon: CubeIcon, color: 'text-gray-400' },
  food: { label: 'Food', icon: SparklesIcon, color: 'text-orange-400' },
  documents: { label: 'Documents', icon: BookmarkIcon, color: 'text-blue-400' },
  electronics: { label: 'Electronics', icon: ComputerDesktopIcon, color: 'text-indigo-400' },
  clothing: { label: 'Clothing', icon: BookmarkIcon, color: 'text-pink-400' },
  groceries: { label: 'Groceries', icon: ShoppingCartIcon, color: 'text-green-400' },
  medicine: { label: 'Medicine', icon: BeakerIcon, color: 'text-red-400' },
  fragile: { label: 'Fragile', icon: ExclamationTriangleIcon, color: 'text-amber-500' },
  other: { label: 'Other', icon: EllipsisHorizontalIcon, color: 'text-gray-500' },
};

const PackageCategoryDropdown = ({ selectedCategory, onCategoryChange }) => {
  const selectedOption = categoryOptions[selectedCategory] || categoryOptions.all;

  return (
    <Menu as="div" className="relative inline-block text-left w-full">
      <div>
        <Menu.Button className="inline-flex justify-between w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent-blue">
          <div className="flex items-center">
            <selectedOption.icon className={`mr-2 h-5 w-5 ${selectedOption.color}`} aria-hidden="true" />
            {selectedOption.label}
          </div>
          <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-200">
          <div className="py-1">
            {Object.entries(categoryOptions).map(([slug, { label, icon: Icon, color }]) => (
              <Menu.Item key={slug}>
                {({ active }) => (
                  <button
                    onClick={() => onCategoryChange(slug === 'all' ? '' : slug)}
                    className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  >
                    <Icon className={`mr-2 h-5 w-5 ${color}`} aria-hidden="true" />
                    {label}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default PackageCategoryDropdown;
