/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React from 'react';
import { Checkout } from '../../../src/components/pages/Checkout';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { AppProvider } from '../../../src/context/AppContext';

export default function NextCheckoutPage() {
  return (
    <AppProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
          <Checkout />
        </main>
        <Footer />
      </div>
    </AppProvider>
  );
}
