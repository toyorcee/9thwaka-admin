import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, ClockIcon, CheckCircleIcon, XCircleIcon, TruckIcon, ShieldCheckIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';

const statusOptions = {
  all: { label: 'All Statuses', icon: ArchiveBoxIcon, color: 'text-gray-400' },
  pending: { label: 'Pending', icon: ClockIcon, color: 'text-yellow-400' },
  assigned: { label: 'Assigned', icon: ShieldCheckIcon, color: 'text-blue-400' },
  picked_up: { label: 'Picked Up', icon: TruckIcon, color: 'text-indigo-400' },
  delivering: { label: 'Delivering', icon: TruckIcon, color: 'text-purple-400' },
  delivered: { label: 'Delivered', icon: CheckCircleIcon, color: 'text-green-400' },
  cancelled: { label: 'Cancelled', icon: XCircleIcon, color: 'text-red-400' },
};

const StatusDropdown = ({ selectedStatus, onStatusChange }) => {
  const selectedOption = statusOptions[selectedStatus] || statusOptions.all;

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
            {Object.entries(statusOptions).map(([status, { label, icon: Icon, color }]) => (
              <Menu.Item key={status}>
                {({ active }) => (
                  <button
                    onClick={() => onStatusChange(status === 'all' ? '' : status)}
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

export default StatusDropdown;
