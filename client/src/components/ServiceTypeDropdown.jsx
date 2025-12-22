import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, CubeIcon, BoltIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';

const serviceTypeOptions = {
  all: { label: 'All Services', icon: ArchiveBoxIcon, color: 'text-gray-400' },
  courier: { label: 'Courier', icon: CubeIcon, color: 'text-blue-400' },
  ride: { label: 'Ride', icon: BoltIcon, color: 'text-yellow-400' },
};

const ServiceTypeDropdown = ({ selectedService, onServiceChange }) => {
  const selectedOption = serviceTypeOptions[selectedService] || serviceTypeOptions.all;

  return (
    <Menu as="div" className="relative inline-block text-left w-full">
      <div>
        <Menu.Button className="inline-flex justify-between w-full rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
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
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {Object.entries(serviceTypeOptions).map(([service, { label, icon: Icon, color }]) => (
              <Menu.Item key={service}>
                {({ active }) => (
                  <button
                    onClick={() => onServiceChange(service === 'all' ? '' : service)}
                    className={`${active ? 'bg-gray-700 text-white' : 'text-gray-300'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
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

export default ServiceTypeDropdown;
