import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, TruckIcon, SparklesIcon, RocketLaunchIcon, LifebuoyIcon } from '@heroicons/react/24/outline';

const vehicleOptions = {
  all: { label: 'All Vehicles', icon: TruckIcon, color: 'text-gray-400' },
  bicycle: { label: 'Bicycle', icon: SparklesIcon, color: 'text-green-400' },
  motorbike: { label: 'Motorbike', icon: BoltIcon, color: 'text-yellow-400' },
  tricycle: { label: 'Tricycle', icon: RocketLaunchIcon, color: 'text-orange-400' },
  car: { label: 'Car', icon: TruckIcon, color: 'text-blue-400' },
  car_standard: { label: 'Car Standard', icon: TruckIcon, color: 'text-indigo-400' },
  car_comfort: { label: 'Car Comfort', icon: SparklesIcon, color: 'text-purple-400' },
  car_premium: { label: 'Car Premium', icon: RocketLaunchIcon, color: 'text-amber-400' },
  van: { label: 'Van', icon: LifebuoyIcon, color: 'text-rose-400' },
};

// Standard Heroicons for BoltIcon if missing (using BoltIcon from other parts of the app)
const BoltIconFiller = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const VehicleTypeDropdown = ({ selectedVehicle, onVehicleChange }) => {
  const selectedOption = vehicleOptions[selectedVehicle] || vehicleOptions.all;

  return (
    <Menu as="div" className="relative inline-block text-left w-full">
      <div>
        <Menu.Button className="inline-flex justify-between w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent-blue">
          <div className="flex items-center">
            {selectedOption.label === 'Motorbike' ? <BoltIconFiller className={`mr-2 h-5 w-5 ${selectedOption.color}`} /> : <selectedOption.icon className={`mr-2 h-5 w-5 ${selectedOption.color}`} aria-hidden="true" />}
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
            {Object.entries(vehicleOptions).map(([slug, { label, icon: Icon, color }]) => (
              <Menu.Item key={slug}>
                {({ active }) => (
                  <button
                    onClick={() => onVehicleChange(slug === 'all' ? '' : slug)}
                    className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  >
                    {label === 'Motorbike' ? <BoltIconFiller className={`mr-2 h-5 w-5 ${color}`} /> : <Icon className={`mr-2 h-5 w-5 ${color}`} aria-hidden="true" />}
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

export default VehicleTypeDropdown;
