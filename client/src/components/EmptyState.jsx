import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

const presets = {
  referrals: {
    title: 'No referral rewards yet',
    description:
      'Once users start referring friends and those trips complete, referral rewards will appear here.',
  },
  customers: {
    title: 'No customers found',
    description:
      'Customers will appear here once people start using your platform to place orders.',
  },
  riders: {
    title: 'No riders found',
    description:
      'Riders will appear here once they complete registration and are approved on the platform.',
  },
  generic: {
    title: 'Nothing to show here yet',
    description:
      'This section will update automatically as new data becomes available.',
  },
};

const emptyStateAnimations = {
  referrals: ['https://assets.lottiefiles.com/packages/lf20_xlmz9xwm.json'],
customers: [
  "https://assets.lottiefiles.com/packages/lf20_ysrn2iwp.json" 
],
  riders: ['https://assets.lottiefiles.com/packages/lf20_1cazwtnc.json'],
  orders: ['https://assets.lottiefiles.com/packages/lf20_touohxv0.json'],
  generic: ['https://assets.lottiefiles.com/packages/lf20_qh5z2fdq.json'],
};

const animationCache = {};
const animationPromises = {};

const getAnimationUrl = (type) => {
  const urls = emptyStateAnimations[type] || emptyStateAnimations.generic;
  if (!urls || urls.length === 0) {
    return null;
  }
  if (urls.length === 1) {
    return urls[0];
  }
  const index = Math.floor(Math.random() * urls.length);
  return urls[index];
};

const loadAnimation = async (url) => {
  if (!url) {
    return null;
  }

  if (animationCache[url]) {
    return animationCache[url];
  }

  if (!animationPromises[url]) {
    animationPromises[url] = fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load empty state animation');
        }
        return response.json();
      })
      .then((data) => {
        animationCache[url] = data;
        return data;
      })
      .catch((error) => {
        console.error(error);
        animationCache[url] = null;
        return null;
      });
  }

  return animationPromises[url];
};

const EmptyState = ({
  type = 'generic',
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const resolvedType = presets[type] ? type : 'generic';
  const animationUrl = getAnimationUrl(resolvedType);

  const [animationData, setAnimationData] = useState(
    animationCache[animationUrl] || null
  );

  useEffect(() => {
    let isMounted = true;

    if (!animationData && animationUrl) {
      loadAnimation(animationUrl).then((data) => {
        if (isMounted) {
          setAnimationData(data);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [animationData, animationUrl]);

  const preset = presets[resolvedType] || presets.generic;
  const displayTitle = title || preset.title;
  const displayDescription = description || preset.description;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-700">
      <div className="w-72 h-72 mb-6 flex items-center justify-center bg-gray-50 rounded-2xl shadow-inner">
        {animationData ? (
          <Lottie
            animationData={animationData}
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-gray-300" />
        )}
      </div>
      <h2 className="text-xl font-semibold mb-2 text-gray-800">
        {displayTitle}
      </h2>
      <p className="text-gray-500 max-w-md mb-4">{displayDescription}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 px-4 py-2 rounded-lg bg-gray-800 text-white font-medium hover:bg-gray-900 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;


