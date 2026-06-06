/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { Instagram, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveView } = useApp();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="morvex-footer" className="mt-auto flex flex-col font-sans">
      {/* SECTION 1: Back to Top */}
      <button
        onClick={scrollToTop}
        className="w-full bg-[#37475A] py-[15px] text-center text-[13px] font-medium text-white hover:bg-[#485769] transition-colors focus:outline-none"
      >
        Back to top
      </button>

      {/* SECTION 2: 4 Columns */}
      <div className="bg-[#232F3E] pb-10 pt-10 text-white w-full">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            
            {/* Column 1: About MORVEX */}
            <div>
              <h4 className="mb-3 text-[16px] font-bold">About MORVEX</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-[14px] text-gray-300 hover:text-white hover:underline">About Us</a></li>
                <li><a href="#" className="text-[14px] text-gray-300 hover:text-white hover:underline">Our Mission</a></li>
                <li><a href="#" className="text-[14px] text-gray-300 hover:text-white hover:underline">Contact Us</a></li>
                <li><a href="#" className="text-[14px] text-gray-300 hover:text-white hover:underline">Careers</a></li>
              </ul>
            </div>

            {/* Column 2: Shop With Us */}
            <div>
              <h4 className="mb-3 text-[16px] font-bold">Shop With Us</h4>
              <ul className="space-y-2.5">
                <li><button onClick={() => setActiveView('user-dashboard')} className="text-[14px] text-gray-300 hover:text-white hover:underline">My Account</button></li>
                <li><button onClick={() => setActiveView('user-dashboard')} className="text-[14px] text-gray-300 hover:text-white hover:underline">Orders</button></li>
                <li><button onClick={() => setActiveView('wishlist')} className="text-[14px] text-gray-300 hover:text-white hover:underline">Wishlist</button></li>
                <li><button onClick={() => setActiveView('cart')} className="text-[14px] text-gray-300 hover:text-white hover:underline">Cart</button></li>
              </ul>
            </div>

            {/* Column 3: Customer Support */}
            <div>
              <h4 className="mb-3 text-[16px] font-bold">Customer Support</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-[14px] text-gray-300 hover:text-white hover:underline">Shipping & Delivery</a></li>
                <li><a href="#" className="text-[14px] text-gray-300 hover:text-white hover:underline">Returns & Refunds</a></li>
                <li><a href="#" className="text-[14px] text-gray-300 hover:text-white hover:underline">Privacy Policy</a></li>
                <li><a href="#" className="text-[14px] text-gray-300 hover:text-white hover:underline">Terms of Service</a></li>
              </ul>
            </div>

            {/* Column 4: Connect With Us */}
            <div>
              <h4 className="mb-3 text-[16px] font-bold">Connect With Us</h4>
              <ul className="space-y-2.5">
                <li>
                  <a 
                    href="https://www.instagram.com/morvex_10/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center space-x-1.5 text-[14px] text-gray-300 hover:text-white hover:underline"
                  >
                    <Instagram className="h-4 w-4" />
                    <span>Instagram</span>
                  </a>
                </li>
                <li><a href="#" className="text-[14px] text-gray-300 hover:text-white hover:underline">Email Support</a></li>
                <li><a href="#" className="text-[14px] text-gray-300 hover:text-white hover:underline">Help Center</a></li>
                <li><a href="#" className="text-[14px] text-gray-300 hover:text-white hover:underline">FAQ</a></li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* SECTION 3 & 4 (integrated): Center Logo, Language, Currency */}
      <div className="bg-[#232F3E] border-t border-[#3a4553] py-8 w-full flex flex-col items-center justify-center">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
          
          {/* Logo */}
          <div className="flex items-center space-x-2 text-2xl font-black tracking-tighter text-white uppercase">
            <div className="flex h-8 w-8 items-center justify-center">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                <path d="M10 12V8C10 4.686 12.686 2 16 2C19.314 2 22 4.686 22 8V12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
                <rect x="4" y="10" width="24" height="20" rx="3" fill="#fff" />
                <path d="M9 23V15L16 21L23 15V23" stroke="#232F3E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span>MORVEX</span>
          </div>

          <div className="flex flex-row space-x-2 items-center">
            {/* Language Selector */}
            <div className="flex items-center space-x-1.5 border border-[#848688] rounded py-1 px-2 hover:border-white cursor-pointer transition-colors">
              <Globe className="h-3.5 w-3.5 text-gray-300" />
              <span className="text-[13px] text-gray-300">English</span>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center space-x-1.5 border border-[#848688] rounded py-1 px-2 hover:border-white cursor-pointer transition-colors">
              <span className="text-[13px] text-gray-300">$ USD - U.S. Dollar</span>
            </div>

            {/* Country Selector */}
            <div className="flex items-center space-x-1.5 border border-[#848688] rounded py-1 px-2 hover:border-white cursor-pointer transition-colors">
              <span className="text-[13px] text-gray-300">United States</span>
            </div>
          </div>
          
        </div>
      </div>

      {/* SECTION 5: Bottom Legal Section */}
      <div className="bg-[#131A22] w-full py-8 text-center flex flex-col items-center">
        <div className="flex flex-wrap justify-center items-center space-x-4 md:space-x-6 text-[12px] text-gray-300 font-medium mb-1.5 px-4 gap-y-2">
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="hover:underline">Terms of Service</a>
          <a href="#" className="hover:underline">Cookies Policy</a>
        </div>
        <div className="text-[12px] text-gray-300 mt-1">
          © 2026 MORVEX. All Rights Reserved.
        </div>
      </div>

    </footer>
  );
};

