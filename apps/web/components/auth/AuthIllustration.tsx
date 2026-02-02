'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

interface AuthIllustrationProps {
  animationType?: 'login' | 'register' | 'loading' | 'success'
}

export function AuthIllustration({ animationType = 'login' }: AuthIllustrationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative w-full max-w-lg mx-auto"
    >
      <div className="relative w-full flex items-center justify-center">
        {/* Background decorative elements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* Blue bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "120px" }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="absolute top-16 left-8 h-2 bg-blue-500 rounded-full"
          />
          
          {/* Cyan phone icon */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.6, duration: 0.5, type: "spring" }}
            className="absolute top-8 right-20 w-12 h-12 bg-cyan-400 rounded-lg flex items-center justify-center shadow-lg"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </motion.div>

          {/* Yellow notification */}
          <motion.div
            initial={{ scale: 0, x: 20 }}
            animate={{ scale: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.5, type: "spring" }}
            className="absolute top-12 right-8 w-16 h-6 bg-yellow-400 rounded shadow-lg"
          />

          {/* Purple mail icon */}
          <motion.div
            initial={{ scale: 0, rotate: 10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 1.0, duration: 0.5, type: "spring" }}
            className="absolute bottom-20 right-12 w-12 h-12 bg-purple-400 rounded-lg flex items-center justify-center shadow-lg"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </motion.div>

          {/* Orange globe icon */}
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 1.2, duration: 0.5, type: "spring" }}
            className="absolute bottom-32 left-8 w-12 h-12 bg-orange-400 rounded-lg flex items-center justify-center shadow-lg"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
            </svg>
          </motion.div>

          {/* Purple bar bottom */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "80px" }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="absolute bottom-16 right-16 h-2 bg-purple-600 rounded-full"
          />

          {/* Small decorative dots */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.6, duration: 0.3 }}
            className="absolute bottom-12 left-16 w-2 h-2 bg-red-400 rounded-full"
          />
        </motion.div>

        {/* Main illustration container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative z-10 bg-white rounded-2xl shadow-xl p-6 w-72 mx-auto"
        >
          {/* Browser-like header */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>

          {/* Characters */}
          <div className="flex items-end justify-center gap-4">
            {/* Left character - Woman */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-gradient-to-b from-yellow-200 to-yellow-300 rounded-full mb-2 relative overflow-hidden">
                {/* Hair */}
                <div className="absolute top-0 left-0 right-0 h-10 bg-gray-800 rounded-t-full"></div>
                {/* Face */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-10 bg-yellow-200 rounded-full">
                  {/* Eyes */}
                  <div className="absolute top-3 left-2 w-1 h-1 bg-gray-800 rounded-full"></div>
                  <div className="absolute top-3 right-2 w-1 h-1 bg-gray-800 rounded-full"></div>
                  {/* Smile */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-1 border-b-2 border-gray-800 rounded-full"></div>
                </div>
              </div>
              {/* Body */}
              <div className="w-12 h-16 bg-yellow-300 rounded-t-full"></div>
              {/* Legs */}
              <div className="w-8 h-12 bg-gray-800 rounded-b-lg"></div>
              {/* Waving hand */}
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 1.5 }}
                className="absolute -right-2 top-8 w-4 h-4 bg-yellow-200 rounded-full"
              ></motion.div>
            </motion.div>

            {/* Center character - Man */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
              className="flex flex-col items-center"
            >
              <div className="w-18 h-18 bg-gradient-to-b from-orange-300 to-orange-400 rounded-full mb-2 relative overflow-hidden">
                {/* Hair */}
                <div className="absolute top-0 left-0 right-0 h-8 bg-gray-800 rounded-t-full"></div>
                {/* Face */}
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-14 h-12 bg-orange-300 rounded-full">
                  {/* Eyes */}
                  <div className="absolute top-3 left-3 w-1 h-1 bg-gray-800 rounded-full"></div>
                  <div className="absolute top-3 right-3 w-1 h-1 bg-gray-800 rounded-full"></div>
                  {/* Smile */}
                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-4 h-2 border-b-2 border-gray-800 rounded-full"></div>
                </div>
              </div>
              {/* Body */}
              <div className="w-14 h-18 bg-orange-400 rounded-t-full relative">
                {/* Pocket */}
                <div className="absolute bottom-4 right-2 w-3 h-3 border-2 border-orange-500 rounded"></div>
              </div>
              {/* Legs */}
              <div className="w-10 h-14 bg-blue-600 rounded-b-lg"></div>
            </motion.div>

            {/* Right character - Woman with phone */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="flex flex-col items-center relative"
            >
              <div className="w-16 h-16 bg-gradient-to-b from-cyan-200 to-cyan-300 rounded-full mb-2 relative overflow-hidden">
                {/* Hair bun */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gray-800 rounded-full"></div>
                {/* Face */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-10 bg-cyan-200 rounded-full">
                  {/* Eyes */}
                  <div className="absolute top-3 left-2 w-1 h-1 bg-gray-800 rounded-full"></div>
                  <div className="absolute top-3 right-2 w-1 h-1 bg-gray-800 rounded-full"></div>
                  {/* Smile */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-1 border-b-2 border-gray-800 rounded-full"></div>
                </div>
              </div>
              {/* Body */}
              <div className="w-12 h-16 bg-cyan-300 rounded-t-full"></div>
              {/* Legs */}
              <div className="w-8 h-12 bg-amber-700 rounded-b-lg"></div>
              {/* Phone */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.8, duration: 0.4, type: "spring" }}
                className="absolute right-0 top-6 w-3 h-5 bg-gray-800 rounded-sm"
              ></motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
