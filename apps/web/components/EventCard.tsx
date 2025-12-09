'use client';

import { motion, useAnimation } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Calendar, MapPin, Clock, Users } from 'lucide-react';
import { AnimationConfig, DEFAULT_ANIMATION } from '@/lib/animations/animations';
import { Player } from '@lottiefiles/react-lottie-player';

export type EventItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  image: string;
  type: string;
  capacity: number;
  animationConfig?: AnimationConfig | string; // Can be config object or animation ID
};

type EventCardProps = {
  item: EventItem;
  showDetails?: boolean;
  onClick?: () => void;
  className?: string;
};

const EventCard = ({ item, showDetails = false, onClick, className }: EventCardProps) => {
  const router = useRouter();
  const { animationConfig } = item;

  // Animation is handled automatically by the Player component

  // Animation variants for hover effect
  const cardVariants = {
    initial: { y: 0 },
    hover: { y: -5 }
  };

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-all ${className} ${
        showDetails ? 'hover:shadow-lg' : ''
      }`}
      onClick={onClick || (() => router.push(`/events/${item.id}`))}
      whileHover="hover"
      variants={cardVariants}
    >
      <div className="relative h-48 overflow-hidden">
        {/* Lottie Animation Background */}
        {animationConfig && (
          <div className="absolute inset-0 z-0">
            <Player
              autoplay
              loop
              src={typeof animationConfig === 'string' ? animationConfig : animationConfig.source}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        )}
        
        {/* Image Overlay */}
        <div className="absolute inset-0 z-10 bg-black/30" />
        
        <div className="relative z-20 h-full flex flex-col justify-end p-4">
          <h3 className="text-xl font-bold text-white line-clamp-2">{item.title}</h3>
          <p className="text-sm text-gray-200 mt-1 line-clamp-2">{item.description}</p>
        </div>
      </div>

      {showDetails && (
        <div className="p-4 space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
            <span>{format(new Date(item.date), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2 text-gray-500" />
            <span>{item.time}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-gray-500" />
            <span className="line-clamp-1">{item.venue}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center text-sm text-gray-600">
              <Users className="w-4 h-4 mr-2 text-gray-500" />
              <span>{item.capacity} spots</span>
            </div>
            <span className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
              {item.type}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default EventCard;
