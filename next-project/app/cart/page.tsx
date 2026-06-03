/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React from 'react';
import { BoutiqueCart } from '../../../src/components/pages/Cart';
import { Navbar } from '../../../src/components/Navbar';
import { Footer } from '../../../src/components/Footer';
import { AppProvider } from '../../../src/context/AppContext';

export default function NextCartPage() {
  return (
    <AppProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
          <BoutiqueCart />
        </main>
        <Footer />
      </div>
    </AppProvider>
  );
}
