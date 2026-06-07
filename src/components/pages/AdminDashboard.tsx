/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminDataProvider } from '../admin/AdminDataContext';
import { AdminLayout } from '../admin/AdminLayout';
import { DashboardOverview } from '../admin/DashboardOverview';
import { SalesAnalytics } from '../admin/SalesAnalytics';
import { CategoryPerformance, ProfitCenter, ShippingAnalytics } from '../admin/AnalyticsSections';
import { CustomerAnalytics } from '../admin/AnalyticsSections2';
import { OrderDirectory } from '../admin/OrderDirectory';

import { 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Plus, 
  RefreshCw,
  ShoppingBag,
  Check,
  Globe,
  Search,
  Database,
  Package,
  Link,
  Cpu,
  Trash2,
  Eye,
  X,
  Edit2,
  Archive,
  RotateCcw,
  Activity,
  Lock
} from 'lucide-react';

interface StatsData {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
  totalInventoryCount: number;
  totalCategories: number;
  recentOrders: any[];
  recentUsers: any[];
  lowStockProducts: any[];
  revenueHistoryWeek: Array<{ label: string; value: number; scale: number }>;
}

export const AdminDashboard: React.FC = () => {
  const { token, refreshCatalog, products } = useApp();

  // Stats endpoints data
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
     if (isDarkMode) document.documentElement.classList.add('dark');
     else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);


  // New product form states
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Furniture');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdImg, setNewProdImg] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdStock, setNewProdStock] = useState('45');
  const [replenishSuccess, setReplenishSuccess] = useState(false);
  const [replenishError, setReplenishError] = useState<string | null>(null);

  // CJ Dropshipping tool states
  const [cjKeyword, setCjKeyword] = useState('');
  const [cjResults, setCjResults] = useState<any[]>([]);
  const [cjSearching, setCjSearching] = useState(false);
  const [cjImporting, setCjImporting] = useState<string | null>(null);

  // CJ Dropshipping state tracking
  const [cjUrl, setCjUrl] = useState('');
  const [cjSyncing, setCjSyncing] = useState<string | null>(null);
  const [cjSyncSuccess, setCjSyncSuccess] = useState<string | null>(null);
  
  // Manual Shipping Cache Sync States
  const [shippingSyncState, setShippingSyncState] = useState<'idle' | 'syncing' | 'finished'>('idle');
  const [shippingSyncProgress, setShippingSyncProgress] = useState({ processed: 0, total: 0, success: 0, failed: 0, totalCost: 0, avgCost: 0 });
  const [lastShippingUpdate, setLastShippingUpdate] = useState<string | null>(null);

  // Pricing Audit States
  const [pricingAuditLoading, setPricingAuditLoading] = useState(false);
  const [pricingAuditResult, setPricingAuditResult] = useState<any>(null);

  const [cjAutoImporting, setCjAutoImporting] = useState(false);
  const [cjImportError, setCjImportError] = useState<string | null>(null);
  const [cjImportSuccess, setCjImportSuccess] = useState<string | null>(null);

  // Filter state
  const [filterTab, setFilterTab] = useState<'active' | 'archived' | 'cj' | 'manual'>('active');
  const [productSearch, setProductSearch] = useState('');

  // Bulk Selection and Action state configuration
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [isConfirmingBulkDelete, setIsConfirmingBulkDelete] = useState(false);
  const [isConfirmingBulkAction, setIsConfirmingBulkAction] = useState<string>('');
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);

  useEffect(() => {
    setSelectedProductIds([]);
    setBulkAction('');
  }, [filterTab, productSearch]);

  // Derive visible products for bulk selection
  const visibleProducts = (products || []).filter((p: any) => {
    const source = p.source || 'manual';
    
    if (filterTab === 'active') {
      if (p.isArchived === true) return false;
    } else if (filterTab === 'archived') {
      if (p.isArchived !== true) return false;
    } else if (filterTab === 'cj') {
      if (source !== 'cj') return false;
    } else if (filterTab === 'manual') {
      if (source !== 'manual') return false;
    }

    if (productSearch.trim()) {
      const term = productSearch.toLowerCase();
      return p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term);
    }
    return true;
  });

  // Product management action and modal states
  const [selectedAdminProduct, setSelectedAdminProduct] = useState<any | null>(null);
  const [adminProdShipping, setAdminProdShipping] = useState<any | null>(null);
  const [isAdminViewing, setIsAdminViewing] = useState(false);
  const [isAdminEditing, setIsAdminEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<any | null>(null);

  // Edit fields states
  const [editProdName, setEditProdName] = useState('');
  const [editProdCategory, setEditProdCategory] = useState('Furniture');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdImg, setEditProdImg] = useState('');
  const [editProdDesc, setEditProdDesc] = useState('');
  const [editProdStock, setEditProdStock] = useState('');
  const [editProdIsPublished, setEditProdIsPublished] = useState(true);
  const [editProdIsArchived, setEditProdIsArchived] = useState(false);
  const [editProdCjRemovedFromSync, setEditProdCjRemovedFromSync] = useState(false);

  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Fetch statistics from backend
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/dashboard-stats', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Not authorized or error fetching dashboard metrics.');
      }
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        throw new Error(data.message || 'Error parsing backend operational statistics.');
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
    } else {
      setError("Authorization token missing.");
      setLoading(false);
    }
  }, [token]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      setReplenishError('Product Name is required.');
      return;
    }
    const parsedPrice = Number(newProdPrice);
    if (!newProdPrice.trim() || isNaN(parsedPrice) || parsedPrice < 0) {
      setReplenishError('Product Price is required and must be a positive number.');
      return;
    }
    if (!newProdImg.trim()) {
      setReplenishError('Product Image URL field is required.');
      return;
    }

    try {
      setReplenishError(null);
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newProdName.trim(),
          category: newProdCategory,
          price: parsedPrice,
          image: newProdImg.trim(),
          description: newProdDesc.trim() || 'Store premium curated operational stock.',
          stock: Number(newProdStock) || 0
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Database rejected product registration logs.');
      }

      setReplenishSuccess(true);
      
      // Dynamic refresh stats immediately representation
      fetchStats();
      if (refreshCatalog) {
        await refreshCatalog();
      }

      setTimeout(() => {
        setReplenishSuccess(false);
        setNewProdName('');
        setNewProdPrice('');
        setNewProdImg('');
        setNewProdDesc('');
        setNewProdStock('45');
      }, 3000);
    } catch (err: any) {
      setReplenishError(err.message || String(err));
    }
  };

  const handlePricingAudit = async () => {
    try {
      setPricingAuditLoading(true);
      const res = await fetch('/api/products/pricing-audit', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPricingAuditResult(data.summary);
      } else {
        alert(data.message || 'Error running pricing audit');
      }
    } catch (err) {
      console.error(err);
      alert('Error running pricing audit');
    } finally {
      setPricingAuditLoading(false);
    }
  };

  const handleShippingSync = async () => {
    const cjProducts = visibleProducts.filter((p: any) => p.source === 'cj' && p.vid).slice(0, 100);
    if (cjProducts.length === 0) {
      alert("No CJ products with VIDs currently visible. Try importing some or syncing catalog.");
      return;
    }

    setShippingSyncState('syncing');
    setShippingSyncProgress({ processed: 0, total: cjProducts.length, success: 0, failed: 0, totalCost: 0, avgCost: 0 });

    let successCount = 0;
    let failedCount = 0;
    let totalCostAccum = 0;

    for (let i = 0; i < cjProducts.length; i++) {
        const prod = cjProducts[i];
        try {
            const res = await fetch('/api/shipping/sync-variant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ vid: prod.vid, countryCode: 'US' })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                successCount++;
                totalCostAccum += data.cost || 0;
            } else {
                failedCount++;
            }
        } catch(e) {
            failedCount++;
        }
        setShippingSyncProgress({ 
            processed: i + 1, 
            total: cjProducts.length, 
            success: successCount, 
            failed: failedCount, 
            totalCost: totalCostAccum,
            avgCost: successCount > 0 ? (totalCostAccum / successCount) : 0
        });
    }

    setLastShippingUpdate(new Date().toLocaleString());
    setShippingSyncState('finished');
    setTimeout(() => {
        setShippingSyncState('idle');
    }, 10000); // Back to idle after 10 seconds to allow review of stats
  };

  const handleCjSync = async (action: 'sync-inventory' | 'sync-prices' | 'sync-fulfillment') => {
    try {
      setCjSyncing(action);
      setCjSyncSuccess(null);
      
      const res = await fetch(`/api/admin/aliexpress/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error(`CJ Dropshipping sync command rejected for ${action}`);
      }
      
      const data = await res.json();
      setCjSyncSuccess(data.message || 'Sync successful.');
      fetchStats();
      if (refreshCatalog) {
        await refreshCatalog();
      }
      
      setTimeout(() => {
        setCjSyncSuccess(null);
      }, 5000);
    } catch (err: any) {
      setReplenishError(err.message || String(err));
    } finally {
      setCjSyncing(null);
    }
  };

  const handleCJSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cjKeyword.trim()) return;
    setCjSearching(true);
    try {
      const res = await fetch(`/api/admin/cj/search?keyword=${encodeURIComponent(cjKeyword)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCjResults(data.list);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setCjSearching(false);
    }
  };

  const handleCJImport = async (productId: string) => {
    setCjImporting(productId);
    try {
      const res = await fetch(`/api/admin/aliexpress/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });
      const data = await res.json();
      if (data.success) {
        fetchStats();
        if (refreshCatalog) await refreshCatalog();
      }
    } catch(err) {
      console.error(err);
    } finally {
      setCjImporting(null);
    }
  };

  const handleCjImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cjUrl.trim()) return;

    try {
      setCjAutoImporting(true);
      setCjImportError(null);
      setCjImportSuccess(null);

      // Heuristic auto-extraction of details from paste CJ URLs
      const lowerUrl = cjUrl.toLowerCase();
      let name = 'Design Concept Lounger';
      let category = 'Furniture';
      let price = 145.00;
      let image = 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=800&q=80';
      let description = 'Elite architectural styling imported directly via automated CJ channels from verified CJ suppliers.';

      if (lowerUrl.includes('sofa') || lowerUrl.includes('couch') || lowerUrl.includes('lounge')) {
        category = 'Furniture';
        name = 'Velvet Architecture Modular Sofa';
        image = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';
        description = 'Plush velvet modules combined with durable structured inner balancing springs. Elegant contemporary lines.';
      } else if (lowerUrl.includes('ear') || lowerUrl.includes('headphone') || lowerUrl.includes('sound') || lowerUrl.includes('speaker') || lowerUrl.includes('audio')) {
        category = 'Electronics';
        name = 'Immersive Spatial Sound Decks v2';
        image = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80';
        description = 'Premium acoustic isolation with hybrid ambient modes, spatial mapping drivers, and genuine boucle storage shells.';
      } else if (lowerUrl.includes('watch') || lowerUrl.includes('dial') || lowerUrl.includes('chrono') || lowerUrl.includes('accessory') || lowerUrl.includes('accessory')) {
        category = 'Accessories';
        name = 'Titanium Brushed Smart Chrono Case';
        image = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
        description = 'Premium lightweight space grade micro-brushed titanium body. Interlinked custom leather wrap bands.';
      } else if (lowerUrl.includes('bag') || lowerUrl.includes('clutch') || lowerUrl.includes('wallet') || lowerUrl.includes('leather') || lowerUrl.includes('tote')) {
        category = 'Fashion';
        name = 'Full-Grain Architectural Leather Tote';
        image = 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80';
        description = 'Selected premium thick cowhide structured with internal organizers and minimal brass rivets.';
      } else if (lowerUrl.includes('serum') || lowerUrl.includes('cream') || lowerUrl.includes('skin') || lowerUrl.includes('hydration') || lowerUrl.includes('beauty')) {
        category = 'Beauty';
        name = 'Clinical Botanical Hydration Serum Extreme';
        image = 'https://images.unsplash.com/photo-1608248597481-496100c8c836?auto=format&fit=crop&w=800&q=80';
        description = 'Clinical hydration formulation loaded with natural bio-actives. Pure, organic nourishment base.';
      }

      // Dynamic price from digits
      const digits = cjUrl.match(/\d+/);
      if (digits && digits[0]) {
        price = Number(((Number(digits[0]) % 240) + 19.99).toFixed(2));
      }

      // Try title from slug
      try {
        const pathSegments = cjUrl.split('/');
        const lastSegment = pathSegments.pop() || '';
        const cleanSlug = lastSegment.replace(/\.html$/, '').replace(/[^a-zA-Z0-9-]/g, '');
        if (cleanSlug.length > 8 && !cleanSlug.match(/^\d+$/)) {
          const capitalized = cleanSlug.split('-')
            .filter(v => v.length > 0)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          name = capitalized;
        }
      } catch (pathErr) {}

      const res = await fetch('/api/admin/aliexpress/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          category,
          price,
          image,
          description,
          stock: Math.floor(Math.random() * 60) + 20
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Supplier import request failed.');
      }

      setCjImportSuccess(`Successfully imported dropship product "${name}" to store catalog!`);
      setCjUrl('');
      fetchStats();
      
      if (refreshCatalog) {
        await refreshCatalog();
      }

      setTimeout(() => {
        setCjImportSuccess(null);
      }, 5000);
    } catch (err: any) {
      setCjImportError(err.message || String(err));
    } finally {
      setCjAutoImporting(false);
    }
  };

  // 1. OPEN VIEW MODAL
  const handleOpenView = async (prod: any) => {
    setSelectedAdminProduct(prod);
    setIsAdminViewing(true);
    setAdminProdShipping('loading');
    try {
      if (prod.source === 'cj' && prod.vid) {
         const res = await fetch(`/api/shipping/admin-cache?vid=${prod.vid}`);
         if (res.ok) {
            const data = await res.json();
            setAdminProdShipping(data.cache || 'none');
         } else {
            setAdminProdShipping('none');
         }
      } else {
         setAdminProdShipping('none');
      }
    } catch(e) {
      setAdminProdShipping('none');
    }
  };

  // 2. OPEN EDIT MODAL - hydrate state from selected product
  const handleOpenEdit = (prod: any) => {
    setSelectedAdminProduct(prod);
    setEditProdName(prod.name || '');
    setEditProdCategory(prod.category || 'Furniture');
    setEditProdPrice(String(prod.price || ''));
    setEditProdImg(prod.image || '');
    setEditProdDesc(prod.description || '');
    setEditProdStock(String(prod.stock || ''));
    setEditProdIsPublished(prod.isPublished !== false);
    setEditProdIsArchived(prod.isArchived === true);
    setEditProdCjRemovedFromSync(prod.cjRemovedFromSync === true);
    setEditError(null);
    setEditSuccess(null);
    setIsAdminEditing(true);
  };

  // 3. TOGGLE ARCHIVE STATE DIRECTLY (with active DB call and visual confirmation)
  const handleToggleArchive = async (prod: any) => {
    try {
      const isCurrentlyArchived = prod.isArchived === true;
      const updatedArchived = !isCurrentlyArchived;
      
      const prodId = prod.id || prod._id;
      if (/^[0-9a-fA-F]{24}$/.test(prodId)) {
        const res = await fetch(`/api/products/${prodId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            isArchived: updatedArchived,
            // If we archive, set published to false, else set published to true
            isPublished: !updatedArchived
          })
        });

        if (!res.ok) {
          throw new Error('Server rejected the archive action.');
        }
      }

      fetchStats();
      if (refreshCatalog) {
        await refreshCatalog();
      }
    } catch (err: any) {
      alert(err.message || String(err));
    }
  };

  // 4. SUBMIT EDIT ACTION (PUT /api/products/:id)
  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminProduct) return;

    try {
      setEditError(null);
      setEditSuccess(null);

      const isManual = selectedAdminProduct.source !== 'cj';
      const parsedPrice = Number(editProdPrice);
      const parsedStock = Number(editProdStock);

      if (isManual) {
        if (!editProdName.trim()) {
          setEditError('Product Name is required.');
          return;
        }
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          setEditError('Product Price must be a positive number.');
          return;
        }
        if (!editProdImg.trim()) {
          setEditError('Product Image URL reference is required.');
          return;
        }
        if (isNaN(parsedStock) || parsedStock < 0) {
          setEditError('Stock Level must be a positive integer.');
          return;
        }
      }

      // Payload depending on source
      const payload: any = {};
      if (isManual) {
        payload.name = editProdName.trim();
        payload.category = editProdCategory;
        payload.price = parsedPrice;
        payload.image = editProdImg.trim();
        payload.description = editProdDesc.trim();
        payload.stock = parsedStock;
        payload.isArchived = editProdIsArchived;
        payload.isPublished = editProdIsPublished;
      } else {
        // CJ Product: Allow category override, Unpublish, Archive, Remove from CJ Dropshipping sync list
        payload.category = editProdCategory;
        payload.isPublished = editProdIsPublished;
        payload.isArchived = editProdIsArchived;
        payload.cjRemovedFromSync = editProdCjRemovedFromSync;
        
        // Also allow configuration of stock/price for sync-overrides optionally, but keep details
        if (editProdPrice && !isNaN(Number(editProdPrice))) {
          payload.price = Number(editProdPrice);
        }
        if (editProdStock && !isNaN(Number(editProdStock))) {
          payload.stock = Number(editProdStock);
        }
      }

      const prodId = selectedAdminProduct.id || selectedAdminProduct._id;
      if (/^[0-9a-fA-F]{24}$/.test(prodId)) {
        const res = await fetch(`/api/products/${prodId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errJson = await res.json();
          throw new Error(errJson.message || 'Database rejected product modification logs.');
        }
      }

      setEditSuccess('Product parameters updated successfully!');
      fetchStats();
      if (refreshCatalog) {
        await refreshCatalog();
      }

      setTimeout(() => {
        setIsAdminEditing(false);
        setSelectedAdminProduct(null);
      }, 1500);
    } catch (err: any) {
      setEditError(err.message || String(err));
    }
  };

  // 5. DELETE PERMANENT ACTION (DELETE /api/products/:id)
  const handleDeleteProductPermanent = async () => {
    if (!isConfirmingDelete) return;

    try {
      const prodId = isConfirmingDelete.id || isConfirmingDelete._id;
      if (/^[0-9a-fA-F]{24}$/.test(prodId)) {
        const res = await fetch(`/api/products/${prodId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error('Server rejected manual product deletion.');
        }
      }

      fetchStats();
      if (refreshCatalog) {
        await refreshCatalog();
      }
      setIsConfirmingDelete(null);
    } catch (err: any) {
      alert(err.message || String(err));
    }
  };

  // --- BULK PRODUCT SELECTION & ACTION HANDLERS ---
  const handleToggleSelectAll = () => {
    const visibleIds = visibleProducts.map((p: any) => p.id || p._id);
    const allSelectedOnView = visibleIds.length > 0 && visibleIds.every(id => selectedProductIds.includes(id));
    
    if (allSelectedOnView) {
      // Unselect visible ones
      setSelectedProductIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Select visible ones
      setSelectedProductIds(prev => {
        const next = [...prev];
        visibleIds.forEach(id => {
          if (!next.includes(id)) {
            next.push(id);
          }
        });
        return next;
      });
    }
  };

  const handleToggleSelectIndividual = (id: string) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const verifyBulkActionChoice = () => {
    if (!bulkAction || selectedProductIds.length === 0) return;
    if (bulkAction === 'delete') {
      setIsConfirmingBulkDelete(true);
    } else {
      setIsConfirmingBulkAction(bulkAction);
    }
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selectedProductIds.length === 0) return;

    try {
      setBulkError(null);
      setBulkSuccess(null);
      setLoading(true);

      if (bulkAction === 'update-shipping-costs') {
        let successCount = 0;
        let failedCount = 0;
        
        for (const id of selectedProductIds) {
          const originalProduct = (products || []).find((p: any) => (p.id || p._id) === id);
          if (!originalProduct || !originalProduct.vid) {
            failedCount++;
            continue;
          }
          
          try {
             // Rate limit 1 request per second
             await new Promise(resolve => setTimeout(resolve, 1100));
             
             const res = await fetch('/api/shipping/sync-variant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ vid: originalProduct.vid, countryCode: 'US' })
             });
             if (res.ok) {
                 successCount++;
             } else {
                 failedCount++;
             }
          } catch(e) {
             failedCount++;
          }
        }
        
        setBulkSuccess(`Finished shipping sync for ${selectedProductIds.length} listings. Success: ${successCount}, Failed: ${failedCount}`);
        setSelectedProductIds([]);
        setBulkAction('');
        setIsConfirmingBulkAction('');
        setLoading(false);
        return;
      }

      const promises = selectedProductIds.map(async (id) => {
        const originalProduct = (products || []).find((p: any) => (p.id || p._id) === id);
        if (!originalProduct) return;
        
        // Skip API execution for statically injected fallback frontend products (they lack valid 24-character hex MongoDB ObjectIDs)
        if (!/^[0-9a-fA-F]{24}$/.test(id)) return;

        if (bulkAction === 'delete') {
          const res = await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (!res.ok) throw new Error(`Could not delete item ${originalProduct.name}`);
        } else if (bulkAction === 'archive') {
          const res = await fetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              isArchived: true,
              isPublished: false
            })
          });
          if (!res.ok) throw new Error(`Could not archive ${originalProduct.name}`);
        } else if (bulkAction === 'restore') {
          const res = await fetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              isArchived: false,
              isPublished: true
            })
          });
          if (!res.ok) throw new Error(`Could not restore ${originalProduct.name}`);
        } else if (bulkAction === 'publish') {
          const res = await fetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              isPublished: true
            })
          });
          if (!res.ok) throw new Error(`Could not publish ${originalProduct.name}`);
        } else if (bulkAction === 'unpublish') {
          const res = await fetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              isPublished: false
            })
          });
          if (!res.ok) throw new Error(`Could not unpublish ${originalProduct.name}`);
        } else if (bulkAction === 'sync') {
          const res = await fetch(`/api/products/${id}/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          if (!res.ok) throw new Error(`Could not sync ${originalProduct.name} - ${await res.text()}`);
        } else if (bulkAction === 'enable-automatic-pricing') {
          const res = await fetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ isManualPrice: false })
          });
          if (!res.ok) throw new Error(`Could not enable automatic pricing for ${originalProduct.name}`);
        } else if (bulkAction === 'lock-manual-pricing') {
          const res = await fetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ isManualPrice: true })
          });
          if (!res.ok) throw new Error(`Could not lock manual pricing for ${originalProduct.name}`);
        } else if (bulkAction === 'reset-pricing') {
          const res = await fetch(`/api/products/${id}/reset-pricing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error(`Could not reset pricing for ${originalProduct.name} - ${await res.text()}`);
        } else if (bulkAction === 'recalculate-prices') {
          const res = await fetch(`/api/products/${id}/recalculate-prices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error(`Could not recalculate pricing for ${originalProduct.name} - ${await res.text()}`);
        }
      });

      await Promise.all(promises);

      setBulkSuccess(`Successfully processed bulk '${bulkAction}' command for ${selectedProductIds.length} listings!`);
      setSelectedProductIds([]);
      setBulkAction('');
      setIsConfirmingBulkDelete(false);
      setIsConfirmingBulkAction('');
      
      fetchStats();
      if (refreshCatalog) {
        await refreshCatalog();
      }

      setTimeout(() => {
        setBulkSuccess(null);
      }, 4000);

    } catch (err: any) {
      setBulkError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div id="admin-dashboard-loading" className="min-h-[500px] flex flex-col justify-center items-center space-y-4">
        <RefreshCw className="h-6 w-6 text-zinc-950 animate-spin dark:text-white" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-550">Compiling Data Sets...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div id="admin-dashboard-error" className="min-h-[450px] flex flex-col justify-center items-center space-y-4 text-center max-w-sm mx-auto">
        <AlertTriangle className="h-10 w-10 text-rose-600" />
        <h3 className="font-serif text-lg text-gray-950 dark:text-white">Admin Dashboard Locked</h3>
        <p className="font-sans text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
          {error || "An unexpected error blocked secure data retrieval protocols."}
        </p>
        <button 
          onClick={fetchStats}
          className="cursor-pointer font-mono text-[10px] uppercase tracking-wider px-4 py-2 bg-zinc-950 text-white rounded-xl hover:bg-zinc-800 transition-all dark:bg-white dark:text-zinc-950"
        >
          Re-establish Connection
        </button>
      </div>
    );
  }

  // Quota goal representations
  const revenueGoalProgress = Math.min(Math.round((stats.totalRevenue / 50000) * 100), 100);
  const activeUsersGoalPct = Math.min(Math.round((stats.totalUsers / 100) * 100), 100);

  // Daily avg sales computation from actual week history
  const averageDailySales = stats.revenueHistoryWeek.reduce((acc, day) => acc + day.value, 0) / 7;

  return (
    <AdminDataProvider>
      <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)}>
        {activeTab === 'dashboard' && <DashboardOverview />}
        {activeTab === 'analytics' && <SalesAnalytics />}
        {activeTab === 'profit' && <ProfitCenter />}
        {activeTab === 'categories' && <CategoryPerformance />}
        {activeTab === 'shipping' && <ShippingAnalytics />}
        {activeTab === 'customers' && <CustomerAnalytics />}
        {activeTab === 'products' && (
    <div id="admin-dashboard-page" className="space-y-8">
      
      {/* Visual Header HIDDEN */}
      {/* Overview Stat Widgets bento grid HIDDEN */}
      

      {/* Split layout: Charts Performance vs Stock replenishment */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        {/* Sales Performance charts visualization HIDDEN */}
        
        {/* Stock Replenishment entry forms */}
        <div className="lg:col-span-12 rounded-3xl border border-gray-150 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] dark:border-zinc-900 dark:bg-zinc-950/20">
          <div className="border-b border-gray-100 pb-3 mb-6 dark:border-zinc-900">
            <h3 className="font-serif text-sm font-semibold text-gray-950 dark:text-white">Inventory Management</h3>
          </div>

          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-gray-400">Spec / Product Naming</label>
              <input
                type="text"
                required
                placeholder="e.g. Minimalist Lounger (Replenishment)"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-gray-400">Category</label>
              <select
                value={newProdCategory}
                onChange={(e) => setNewProdCategory(e.target.value)}
                className="w-full rounded-xl border border-gray-205 bg-white px-3 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white"
              >
                <option value="Electronics">Electronics</option>
                <option value="Phone Accessories">Phone Accessories</option>
                <option value="Smart Gadgets">Smart Gadgets</option>
                <option value="Apparel & Fashion">Apparel & Fashion</option>
                <option value="Beauty & Skincare">Beauty & Skincare</option>
                <option value="Home & Kitchen">Home & Kitchen</option>
                <option value="Fitness & Health">Fitness & Health</option>
                <option value="Pet Supplies">Pet Supplies</option>
                <option value="Office & Desk">Office & Desk</option>
                <option value="Travel Accessories">Travel Accessories</option>
                <option value="Baby & Kids">Baby & Kids</option>
                <option value="Jewelry & Watches">Jewelry & Watches</option>
                <option value="Furniture">Furniture</option>
                <option value="Accessories">Accessories</option>
                <option value="Fashion">Fashion</option>
                <option value="Beauty">Beauty</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-gray-400">Pricing ($)</label>
                <input
                  type="number"
                  required
                  placeholder="899.00"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  className="w-full rounded-xl border border-gray-205 bg-white px-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-gray-400">Inventory Stock Level</label>
                <input
                  type="number"
                  required
                  placeholder="50"
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                  className="w-full rounded-xl border border-gray-205 bg-white px-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-gray-400">Material Image URL Reference</label>
              <input
                type="text"
                required
                placeholder="Copy image link here..."
                value={newProdImg}
                onChange={(e) => setNewProdImg(e.target.value)}
                className="w-full rounded-xl border border-gray-205 bg-white px-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-gray-400">Spec Descriptions</label>
              <textarea
                placeholder="Write item characteristics detail logs here..."
                value={newProdDesc}
                onChange={(e) => setNewProdDesc(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-gray-205 bg-white px-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full cursor-pointer flex items-center justify-center space-x-2 rounded-xl bg-zinc-900 py-3 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors dark:bg-white dark:text-zinc-950"
            >
              <Plus className="h-4 w-4" />
              <span>Publish Stock Expansion Refill</span>
            </button>

            {replenishSuccess && (
              <p className="font-mono text-[10px] text-emerald-600 dark:text-emerald-450 text-center">
                ✓ Verified item registered inside core catalog.
              </p>
            )}

            {replenishError && (
              <p className="font-mono text-[10px] text-rose-600 dark:text-rose-450 text-center">
                ❌ {replenishError}
              </p>
            )}
          </form>
        </div>

      </div>

      {/* SECTION: CJ Dropshipping Dropship & Supplier Automation Portal */}
      {/* Moved to CJ tab for cleanliness, or kept here if needed. But let's keep everything inside the original products wrapper for safety */}
      <div className="rounded-3xl border border-gray-150 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] dark:border-zinc-900 dark:bg-zinc-950/20 space-y-6">
        <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between dark:border-zinc-900 gap-2">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">Dropship Automation Hub</span>
            <h3 className="font-serif text-base font-semibold text-gray-950 dark:text-white flex items-center gap-2">
              <Cpu className="h-4.5 w-4.5 text-zinc-650" />
              <span>CJ Dropshipping Integration</span>
            </h3>
          </div>
          <span className="self-start inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-955/20 dark:text-blue-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
            </span>
            <span>CJ Gateway Active</span>
          </span>
        </div>

        {/* 3 action synchronization triggers */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Action 1: Stock Sync */}
          <button
            onClick={() => handleCjSync('sync-inventory')}
            disabled={!!cjSyncing}
            className="cursor-pointer group text-left rounded-2xl border border-gray-100 bg-zinc-50/50 p-4 hover:bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/10 w-full transition-all focus:outline-none"
          >
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] uppercase text-zinc-400">Automatic Sync</span>
              <RefreshCw className={`h-4 w-4 text-zinc-500 group-hover:rotate-180 transition-transform duration-500 ${cjSyncing === 'sync-inventory' ? 'animate-spin' : ''}`} />
            </div>
            <h4 className="mt-2 text-xs font-serif font-semibold text-gray-950 dark:text-white">Sync CJ Inventory</h4>
            <p className="mt-1 text-[10px] text-zinc-400 leading-relaxed font-sans">Compare real-time wholesale supplier quantities and update active stock limits automatically.</p>
          </button>

          {/* Action 2: Price Sync */}
          <button
            onClick={() => handleCjSync('sync-prices')}
            disabled={!!cjSyncing}
            className="cursor-pointer group text-left rounded-2xl border border-gray-100 bg-zinc-50/50 p-4 hover:bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/10 w-full transition-all focus:outline-none"
          >
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] uppercase text-zinc-400">Supplier Sourcing</span>
              <TrendingUp className={`h-4 w-4 text-zinc-500 group-hover:scale-110 transition-transform ${cjSyncing === 'sync-prices' ? 'animate-spin' : ''}`} />
            </div>
            <h4 className="mt-2 text-xs font-serif font-semibold text-gray-950 dark:text-white">Sync CJ Pricing</h4>
            <p className="mt-1 text-[10px] text-zinc-400 leading-relaxed font-sans">Fluctuate pricing sheets automatically based on active margins and supplier wholesale updates.</p>
          </button>

          {/* Action 3: Order Sync */}
          <button
            onClick={() => handleCjSync('sync-fulfillment')}
            disabled={!!cjSyncing}
            className="cursor-pointer group text-left rounded-2xl border border-gray-100 bg-zinc-50/50 p-4 hover:bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/10 w-full transition-all focus:outline-none"
          >
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] uppercase text-zinc-400">Fulfillment Engine</span>
              <Check className={`h-4 w-4 text-zinc-500 ${cjSyncing === 'sync-fulfillment' ? 'animate-bounce' : ''}`} />
            </div>
            <h4 className="mt-2 text-xs font-serif font-semibold text-gray-950 dark:text-white">Sync Order Fulfillment</h4>
            <p className="mt-1 text-[10px] text-zinc-400 leading-relaxed font-sans">Dispatch and track CJ orders. Auto-provision shipping codes for customer checkouts.</p>
          </button>

          {/* Action 4: Shipping Sync */}
          <button
            onClick={handleShippingSync}
            disabled={shippingSyncState !== 'idle'}
            className="cursor-pointer group text-left rounded-2xl border border-gray-100 bg-zinc-50/50 p-4 hover:bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/10 w-full transition-all focus:outline-none"
          >
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] uppercase text-zinc-400">Logistics & Rates</span>
              <Activity className={`h-4 w-4 text-zinc-500 ${shippingSyncState === 'syncing' ? 'animate-pulse' : 'group-hover:text-amber-600'}`} />
            </div>
            <h4 className="mt-2 text-xs font-serif font-semibold text-gray-950 dark:text-white">Update Shipping Costs</h4>
            <div className="mt-1 flex flex-col space-y-1">
              {shippingSyncState === 'idle' ? (
                <>
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-sans block">Fetch up-to-date shipping cost rates cache directly from CJ. Limited 1 req/sec.</p>
                  {lastShippingUpdate && (
                    <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400">Last Updated: {lastShippingUpdate}</span>
                  )}
                </>
              ) : shippingSyncState === 'syncing' ? (
                <div className="py-1">
                  <span className="text-[10px] font-mono text-amber-600 block animate-pulse mb-1">Updating Shipping Data...</span>
                  <div className="flex items-center space-x-2 text-[9px] font-mono text-zinc-500">
                    <span>Processed: {shippingSyncProgress.processed} / {shippingSyncProgress.total}</span>
                    <span className="text-emerald-600">S: {shippingSyncProgress.success}</span>
                    <span className="text-rose-600">F: {shippingSyncProgress.failed}</span>
                  </div>
                </div>
              ) : (
                <div className="py-1">
                  <span className="text-[10px] font-mono text-emerald-600 block mb-1">Update Complete.</span>
                  <div className="flex items-center space-x-2 text-[9px] font-mono text-zinc-500 flex-wrap gap-1">
                    <span>Processed: {shippingSyncProgress.processed}</span>
                    <span className="text-emerald-600">Updated: {shippingSyncProgress.success}</span>
                    <span className="text-rose-600">Failed: {shippingSyncProgress.failed}</span>
                    <span className="text-blue-600">Avg Cost: ${shippingSyncProgress.avgCost.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </button>

          {/* Action 5: Pricing Audit */}
          <button
            onClick={handlePricingAudit}
            disabled={pricingAuditLoading}
            className="cursor-pointer group text-left rounded-2xl border border-gray-100 bg-zinc-50/50 p-4 hover:bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900/10 w-full transition-all focus:outline-none"
          >
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] uppercase text-zinc-400">Validation Engine</span>
              <AlertTriangle className={`h-4 w-4 text-zinc-500 ${pricingAuditLoading ? 'animate-pulse text-amber-500' : 'group-hover:text-amber-600'}`} />
            </div>
            <h4 className="mt-2 text-xs font-serif font-semibold text-gray-950 dark:text-white">Run Pricing Audit</h4>
            <div className="mt-1 flex flex-col space-y-1">
              <p className="text-[10px] text-zinc-400 leading-relaxed font-sans block">Simulate safe bulk recalculation and identify anomalous or heavy products.</p>
            </div>
          </button>
        </div>

        {pricingAuditResult && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-950/10 shadow-sm">
            <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-500 font-serif mb-3 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Pricing Audit Results (Safe Recalculation System)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col border-l-2 border-emerald-500 pl-3">
                <span className="text-xl font-mono text-gray-900 dark:text-white font-semibold">{pricingAuditResult.validProducts}</span>
                <span className="text-[10px] uppercase tracking-wide text-zinc-500 mt-1">Valid Products</span>
              </div>
              <div className="flex flex-col border-l-2 border-rose-500 pl-3">
                <span className="text-xl font-mono text-gray-900 dark:text-white font-semibold">{pricingAuditResult.skippedProducts}</span>
                <span className="text-[10px] uppercase tracking-wide text-zinc-500 mt-1">Skipped Products</span>
              </div>
              <div className="flex flex-col border-l-2 border-orange-500 pl-3">
                <span className="text-xl font-mono text-gray-900 dark:text-white font-semibold">{pricingAuditResult.dataErrors}</span>
                <span className="text-[10px] uppercase tracking-wide text-zinc-500 mt-1">Data Errors</span>
              </div>
              <div className="flex flex-col border-l-2 border-amber-500 pl-3">
                <span className="text-xl font-mono text-gray-900 dark:text-white font-semibold">{pricingAuditResult.heavyShippingItems}</span>
                <span className="text-[10px] uppercase tracking-wide text-zinc-500 mt-1">Heavy Shipping Items</span>
              </div>
            </div>
            <p className="mt-4 text-[10px] font-mono text-amber-800 dark:text-amber-400">
              Only Valid Products will be processed during a Bulk Recalculation. Anomalous products are skipped automatically to protect profit margins.
            </p>
          </div>
        )}

        {cjSyncSuccess && (
          <div className="bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40 rounded-xl p-3 text-center">
            <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">✓ {cjSyncSuccess}</span>
          </div>
        )}

        {/* CJ Dropshipping importer tool */}
        <div className="p-5 border border-gray-100 dark:border-zinc-900 rounded-2xl bg-zinc-50/20">
          <h4 className="text-xs font-serif font-semibold text-gray-950 dark:text-white mb-2 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-blue-600" />
            <span>CJ Dropshipping Search & Import</span>
          </h4>
          <p className="text-[10px] text-zinc-400 mb-4 font-sans leading-relaxed">
            Search CJ Dropshipping for products and import them into the catalog automatically. 3x markup applied.
          </p>
          
          <form onSubmit={handleCJSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Package className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-zinc-400" />
              <input
                type="text"
                required
                placeholder="Search products by keyword (e.g. 'shoes')"
                value={cjKeyword}
                onChange={(e) => setCjKeyword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3.5 py-2.5 text-xs outline-none focus:border-zinc-500 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={cjSearching}
              className="px-6 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-850 dark:bg-white dark:text-zinc-950 flex items-center justify-center space-x-2 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm"
            >
              <Search className="h-4 w-4" />
              <span>{cjSearching ? 'Searching...' : 'Search CJ Market'}</span>
            </button>
          </form>

          {cjResults.length > 0 && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {cjResults.map((item) => (
                <div key={item.pid} className="border border-gray-150 rounded-xl p-3 bg-white dark:bg-zinc-900 dark:border-zinc-800 flex flex-col justify-between">
                  <div>
                    <div className="aspect-square w-full rounded bg-zinc-100 overflow-hidden mb-3">
                      <img src={item.productImageSet?.[0] || item.productImage} alt={item.productNameEn || ''} className="w-full h-full object-cover" />
                    </div>
                    <h5 className="text-[11px] font-sans font-bold leading-tight line-clamp-2 text-zinc-800 dark:text-zinc-200">{item.productNameEn}</h5>
                    <div className="flex justify-between items-center mt-2">
                       <span className="text-[10px] font-mono text-zinc-400">CJ: ${item.sellPrice}</span>
                       <span className="text-[10px] font-mono font-bold text-[#2563eb]">Store: ${(((Number(item.sellPrice) || 10) * 3 < 4.99 ? 4.99 : (Number(item.sellPrice) || 10) * 3) + 0.99).toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCJImport(item.pid)}
                    disabled={cjImporting === item.pid}
                    className="mt-3 w-full rounded p-2 text-[10px] font-bold text-white bg-zinc-900 hover:bg-zinc-800 uppercase tracking-widest disabled:opacity-50 transition-colors"
                  >
                    {cjImporting === item.pid ? 'Importing...' : 'Quick Import'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Live MongoDB Activity Registers (Recent Orders vs Recent Users) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        
        {/* Recent Orders dynamic list */}
        <div className="rounded-3xl border border-gray-150 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] dark:border-zinc-900 dark:bg-zinc-950/20">
          <div className="border-b border-gray-100 pb-3 mb-4 dark:border-zinc-900 flex justify-between items-center">
            <h3 className="font-serif text-sm font-semibold text-gray-950 dark:text-white">Recent Orders Ledger</h3>
            <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400">Dynamic database tracking</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-900 pb-2">
                  <th className="pb-2.5 font-mono text-[9px] uppercase text-gray-400 tracking-wider">Order Reference</th>
                  <th className="pb-2.5 font-mono text-[9px] uppercase text-gray-400 tracking-wider font-sans">Purchased Items</th>
                  <th className="pb-2.5 font-mono text-[9px] uppercase text-gray-400 tracking-wider text-right">Value</th>
                  <th className="pb-2.5 font-mono text-[9px] uppercase text-gray-400 tracking-wider text-right">CJ Order</th>
                  <th className="pb-2.5 font-mono text-[9px] uppercase text-gray-400 tracking-wider text-right">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-zinc-900/60 font-sans text-xs">
                {stats.recentOrders && stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map((order: any) => (
                    <tr key={order._id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/20">
                      <td className="py-3">
                        <span className="font-mono font-medium text-gray-900 dark:text-white block">
                          #{order._id.substring(order._id.length - 6).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-gray-400 block max-w-[120px] truncate">
                          {order.user?.name || order.shippingAddress?.fullName || 'Guest Account'}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="text-gray-700 dark:text-zinc-300 block max-w-[200px] truncate">
                          {order.itemsSummary || 'Ordered Items'}
                        </span>
                        <span className="text-[9px] text-gray-400 block font-mono">
                          {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-gray-900 dark:text-white font-medium pr-1">
                        ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-right">
                        <span className="font-mono text-[9px] text-zinc-500">
                          {order.cjOrderId ? order.cjOrderId : '—'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={`inline-block text-[9px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                            order.status === 'Delivered' 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                              : order.status === 'Shipped'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                              : order.status === 'Processing'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                              : 'bg-zinc-150 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'
                          }`}>
                            {order.status}
                          </span>
                          {order.trackingNumber && (
                            <span className="text-[9px] font-mono text-blue-500 dark:text-blue-400">
                              {order.trackingNumber}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400 font-mono text-[10px]">
                      No orders have been recorded in the database ledger.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Registered Users dynamic list */}
        <div className="rounded-3xl border border-gray-150 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] dark:border-zinc-900 dark:bg-zinc-950/20">
          <div className="border-b border-gray-100 pb-3 mb-4 dark:border-zinc-900 flex justify-between items-center">
            <h3 className="font-serif text-sm font-semibold text-gray-950 dark:text-white">Registered Customer Ledger</h3>
            <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400">User directory registrations</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-900 pb-2">
                  <th className="pb-2.5 font-mono text-[9px] uppercase text-gray-400 tracking-wider">Customer Contact</th>
                  <th className="pb-2.5 font-mono text-[9px] uppercase text-gray-400 tracking-wider">Joined Date</th>
                  <th className="pb-2.5 font-mono text-[9px] uppercase text-gray-400 tracking-wider text-right">Privilege</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-zinc-900/60 font-sans text-xs">
                {stats.recentUsers && stats.recentUsers.length > 0 ? (
                  stats.recentUsers.map((usr: any) => (
                    <tr key={usr._id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/20">
                      <td className="py-3">
                        <span className="font-medium text-gray-900 dark:text-white block font-sans">
                          {usr.name} {usr.username ? `(@${usr.username})` : ''}
                        </span>
                        <span className="text-[10px] text-gray-450 font-mono block">
                          {usr.email}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-gray-500 dark:text-zinc-400 text-[10px]">
                        {new Date(usr.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`inline-block text-[9px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                          usr.role === 'admin' 
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-450' 
                            : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                        }`}>
                          {usr.role.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-gray-400 font-mono text-[10px]">
                      No customers have been registered in the database ledger.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* SECTION: Catalog & Selective Filters */}
      <div className="rounded-3xl border border-gray-150 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] dark:border-zinc-900 dark:bg-zinc-950/20 space-y-6">
        <div className="border-b border-gray-100 pb-3 dark:border-zinc-900 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400">Inventory Status Matrix</span>
            <h3 className="font-serif text-sm font-semibold text-gray-950 dark:text-white">Storefront Catalogue Inventory</h3>
          </div>
          
          {/* Action Row: Searching & Filtering */}
          <div className="flex flex-col xl:flex-row gap-3 items-start xl:items-center">
            {/* Searchbar */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search catalog items..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white dark:border-zinc-805 dark:bg-zinc-900 dark:text-white pl-8 pr-3 py-1.5 text-xs outline-none focus:border-zinc-500"
              />
            </div>

            {/* Selection badges */}
            <div className="inline-flex bg-zinc-105 dark:bg-zinc-900 p-0.5 rounded-xl border border-gray-100 dark:border-zinc-850 flex-wrap">
              <button
                type="button"
                onClick={() => setFilterTab('active')}
                className={`px-3 py-1 cursor-pointer text-[10px] font-mono rounded-lg transition-all ${filterTab === 'active' ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white font-bold shadow-[0_1px_2px_rgba(0,0,0,0.05)]' : 'text-zinc-400 hover:text-zinc-650'}`}
              >
                Active Products
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('archived')}
                className={`px-3 py-1 cursor-pointer text-[10px] font-mono rounded-lg transition-all ${filterTab === 'archived' ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white font-bold shadow-[0_1px_2px_rgba(0,0,0,0.05)]' : 'text-zinc-400 hover:text-zinc-650'}`}
              >
                Archived Products
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('cj')}
                className={`px-3 py-1 cursor-pointer text-[10px] font-mono rounded-lg transition-all ${filterTab === 'cj' ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white font-bold shadow-[0_1px_2px_rgba(0,0,0,0.05)]' : 'text-zinc-400 hover:text-zinc-650'}`}
              >
                CJ Products
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('manual')}
                className={`px-3 py-1 cursor-pointer text-[10px] font-mono rounded-lg transition-all ${filterTab === 'manual' ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white font-bold shadow-[0_1px_2px_rgba(0,0,0,0.05)]' : 'text-zinc-400 hover:text-zinc-650'}`}
              >
                Manual Products
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Operational Feedback Messages */}
        {bulkError && (
          <div className="bg-rose-50 dark:bg-rose-955/10 border border-rose-100/55 rounded-2xl p-4 text-rose-700 dark:text-rose-400 text-xs font-mono">
            ⚠️ Bulk Action Error: {bulkError}
          </div>
        )}

        {bulkSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-955/10 border border-emerald-100/55 rounded-2xl p-4 text-emerald-700 dark:text-emerald-400 text-xs font-mono animate-pulse">
            ✓ Bulk Action Status: {bulkSuccess}
          </div>
        )}

        {/* BULK ACTIONS ORCHESTRATOR BAR */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-850/65">
          <div className="flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${selectedProductIds.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
            <div>
              <span className="text-xs font-mono font-bold text-gray-950 dark:text-white block">
                Bulk Selection Metrics: <span className="underline font-bold text-amber-600 dark:text-amber-400">{selectedProductIds.length}</span> items marked
              </span>
              <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">
                Currently showing {visibleProducts.length} filtered catalogue items
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="rounded-xl border border-gray-205 bg-white dark:border-zinc-805 dark:bg-zinc-900 dark:text-white px-3.5 py-1.5 text-xs outline-none focus:border-zinc-500 font-mono cursor-pointer"
            >
              <option value="">-- Apply Bulk Directive --</option>
              <option value="enable-automatic-pricing">📈 Enable Automatic Pricing</option>
              <option value="lock-manual-pricing">🔒 Lock Manual Pricing</option>
              <option value="recalculate-prices">🔄 Recalculate Prices</option>
              <option value="reset-pricing">💸 Reset Pricing</option>
              <option value="update-shipping-costs">🚚 Update Shipping Costs</option>
              <option disabled>──────────</option>
              <option value="delete">🗑 Delete Selected</option>
              <option value="archive">📦 Archive Selected</option>
              <option value="restore">🔄 Restore Selected</option>
              <option value="publish">✅ Publish Selected</option>
              <option value="unpublish">🚫 Unpublish Selected</option>
              <option value="sync">⚡ Sync Selected</option>
            </select>
            
            <button
              type="button"
              onClick={verifyBulkActionChoice}
              disabled={!bulkAction || selectedProductIds.length === 0}
              className={`px-4 py-1.5 cursor-pointer text-[10px] font-bold rounded-xl transition-all font-mono uppercase tracking-wider ${
                bulkAction && selectedProductIds.length > 0
                  ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 shadow-[0_1px_3px_rgba(0,0,0,0.1)]'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed border border-gray-200/40 dark:border-zinc-850/40'
              }`}
            >
              Apply directive
            </button>
          </div>
        </div>

        {/* Dynamic List Render */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-zinc-900 pb-2">
                <th className="pb-2.5 pl-3 w-10 text-center">
                  <input
                    type="checkbox"
                    title="Toggle Select All for filtered catalog listings"
                    checked={visibleProducts.length > 0 && visibleProducts.every(p => selectedProductIds.includes(p.id || p._id || ''))}
                    onChange={handleToggleSelectAll}
                    className="h-3.5 w-3.5 rounded text-zinc-950 border-gray-300 dark:border-zinc-800 focus:ring-zinc-500 cursor-pointer"
                  />
                </th>
                <th className="pb-2.5 font-mono text-[9px] uppercase text-gray-400 tracking-wider">Item Spec Details</th>
                <th className="pb-2.5 font-mono text-[9px] uppercase text-gray-400 tracking-wider">Category</th>
                <th className="pb-2.5 font-mono text-[9px] uppercase text-gray-400 tracking-wider text-right">Pricing</th>
                <th className="pb-2.5 font-mono text-[9px] uppercase text-gray-400 tracking-wider text-center">Fulfillment source / Status</th>
                <th className="pb-2.5 font-mono text-[9px] uppercase text-gray-400 tracking-wider text-right">Stock</th>
                <th className="pb-2.5 font-mono text-[9px] uppercase text-gray-400 tracking-wider text-right pr-2">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-900/60 font-sans text-xs">
              {(() => {
                const filtered = visibleProducts;

                if (filtered.length === 0) {
                  return (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400 font-mono text-[10px]">
                        No catalogue matching current select directives were identified.
                      </td>
                    </tr>
                  );
                }

                return filtered.map((prod: any) => {
                  const source = prod.source || 'manual';
                  return (
                    <tr key={prod.id || prod._id || Math.random()} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/20">
                      <td className="py-3 pl-3 text-center">
                        <input
                          type="checkbox"
                          title="Mark catalog listing"
                          checked={selectedProductIds.includes(prod.id || prod._id)}
                          onChange={() => handleToggleSelectIndividual(prod.id || prod._id)}
                          className="h-3.5 w-3.5 rounded text-zinc-950 border-gray-300 dark:border-zinc-800 focus:ring-zinc-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 flex items-center space-x-3.5">
                        <img 
                          src={prod.image} 
                          alt={prod.name} 
                          className="h-9 w-9 bg-zinc-100 rounded-lg object-cover border border-gray-100 dark:border-zinc-850"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif text-xs font-semibold text-gray-950 dark:text-white block line-clamp-1 max-w-[200px]">
                              {prod.name}
                            </span>
                            {prod.isManualPrice ? (
                              <span className="bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                                <Lock className="h-2.5 w-2.5" />
                                MANUAL (locked)
                              </span>
                            ) : (
                              <span className="bg-emerald-100/50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-400 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0">
                                AUTO
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-gray-450 font-mono block mt-0.5">
                            ID: {(prod.id || prod._id || '').toUpperCase().substring(Math.max(0, (prod.id || prod._id || '').length - 8))}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-zinc-500 dark:text-zinc-400 text-[10px]">
                        {prod.category}
                      </td>
                      <td className="py-3 text-right font-mono text-gray-900 dark:text-white font-medium pl-1">
                        ${Number(prod.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {source === 'cj' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100/30">
                              <Database className="h-3 w-3" />
                              <span>CJ Product</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-100/30">
                              <Package className="h-3 w-3" />
                              <span>Manual Product</span>
                            </span>
                          )}

                          {prod.isPublished === false && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-mono font-bold bg-amber-50 text-amber-700 dark:bg-amber-955/30 dark:text-amber-400 border border-amber-100/30">
                              Unpublished Draft
                            </span>
                          )}

                          {prod.isArchived === true && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-mono font-bold bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 border border-gray-200">
                              Archived
                            </span>
                          )}

                          {source === 'cj' && prod.cjRemovedFromSync === true && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-mono font-bold bg-rose-50 text-rose-600 dark:bg-rose-955/20 dark:text-rose-450 border border-rose-100/30">
                              Sync Off
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <div>
                          <span className={`font-mono text-xs font-medium ${prod.stock < 25 ? 'text-rose-600 dark:text-rose-450' : 'text-gray-800 dark:text-zinc-300'}`}>
                            {prod.stock} Units
                          </span>
                          <span className="text-[8px] text-gray-400 block font-mono uppercase">
                            {source === 'cj' ? 'Auto synced' : 'Local inventory'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 pr-1">
                          {/* VIEW ACTION */}
                          <button
                            type="button"
                            onClick={() => handleOpenView(prod)}
                            title="View Product Characteristics"
                            className="cursor-pointer p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-all focus:outline-none"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* EDIT ACTION */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            title="Edit Product Properties"
                            className="cursor-pointer p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-all focus:outline-none"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          {/* ARCHIVE / RESTORE ACTION */}
                          {prod.isArchived === true ? (
                            <button
                              type="button"
                              onClick={() => handleToggleArchive(prod)}
                              title="Restore Archived Product"
                              className="cursor-pointer p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/25 rounded-lg text-emerald-600 dark:text-emerald-400 transition-all focus:outline-none animate-pulse"
                            >
                              <RotateCcw className="h-4 w-4 animate-spin-once" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleArchive(prod)}
                              title="Archive Product"
                              className="cursor-pointer p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-500 dark:text-zinc-450 transition-all focus:outline-none"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                          )}

                          {/* DELETE ACTION - ONLY Manual Products */}
                          {source === 'manual' && (
                            <button
                              type="button"
                              onClick={() => setIsConfirmingDelete(prod)}
                              title="Permanently Delete manual product"
                              className="cursor-pointer p-1.5 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-lg text-rose-600 dark:text-rose-400 transition-all focus:outline-none"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* -------------------- VIEW PRODUCT MODAL -------------------- */}
      {isAdminViewing && selectedAdminProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 dark:bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl border border-gray-150 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 font-sans animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => {
                setIsAdminViewing(false);
                setSelectedAdminProduct(null);
              }}
              className="absolute right-4 top-4 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <img
                  src={selectedAdminProduct.image}
                  alt={selectedAdminProduct.name}
                  className="h-20 w-20 rounded-2xl bg-zinc-50 border border-gray-100 dark:border-zinc-850 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-1">
                  <span className="inline-flex px-2 py-0.5 text-[8px] uppercase tracking-wider font-mono font-bold rounded-full bg-zinc-100 text-zinc-805 dark:bg-zinc-900 dark:text-zinc-300">
                    {selectedAdminProduct.category}
                  </span>
                  <h4 className="font-serif text-base font-bold text-gray-950 dark:text-white leading-tight mt-1">
                    {selectedAdminProduct.name}
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-mono uppercase">
                    ID: {selectedAdminProduct.id || selectedAdminProduct._id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-100 py-4 dark:border-zinc-900">
                <div>
                  <span className="text-[9px] font-mono text-zinc-400 block uppercase">Retail Price</span>
                  <p className="text-sm font-semibold font-mono text-gray-950 dark:text-white">
                    ${Number(selectedAdminProduct.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-zinc-400 block uppercase">Stock Volume</span>
                  <p className="text-sm font-semibold font-mono text-gray-950 dark:text-white">
                    {selectedAdminProduct.stock} Units
                  </p>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-zinc-400 block uppercase">Supply Category / Source</span>
                  <p className="text-xs font-semibold capitalize font-mono text-gray-950 dark:text-white">
                    {selectedAdminProduct.source || 'manual'} Sourced
                  </p>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-zinc-400 block uppercase">Storefront Status</span>
                  <p className="text-xs font-semibold font-mono">
                    {selectedAdminProduct.isArchived ? (
                      <span className="text-zinc-400">Archived</span>
                    ) : selectedAdminProduct.isPublished === false ? (
                      <span className="text-amber-500">Unpublished Draft</span>
                    ) : (
                      <span className="text-emerald-600">Active Published</span>
                    )}
                  </p>
                </div>
              </div>

              {selectedAdminProduct.source === 'cj' && (
                <div className="space-y-1.5 border-b border-gray-100 pb-4 dark:border-zinc-900">
                  <span className="text-[9px] font-mono text-zinc-400 block uppercase">Logistics & Shipping Context</span>
                  {adminProdShipping === 'loading' ? (
                    <p className="text-xs text-zinc-500 font-mono">Loading cache...</p>
                  ) : adminProdShipping === 'none' ? (
                    <p className="text-xs text-zinc-500 font-mono">No shipping cache available yet.</p>
                  ) : adminProdShipping ? (
                    <div className="text-xs text-zinc-650 dark:text-zinc-350 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl p-3 border border-gray-100 dark:border-zinc-850/60 flex flex-col space-y-1 font-mono">
                       <div><span className="text-zinc-400">Cached Cost:</span> ${adminProdShipping.shippingCost?.toFixed(2)}</div>
                       <div><span className="text-zinc-400">Carrier:</span> {adminProdShipping.logisticsName}</div>
                       <div><span className="text-zinc-400">Est. Delivery:</span> {adminProdShipping.estimatedDays} Days</div>
                       <div><span className="text-zinc-400">Country:</span> {adminProdShipping.countryCode}</div>
                       <div><span className="text-zinc-400">Last Synced:</span> {new Date(adminProdShipping.updatedAt).toLocaleDateString()}</div>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="space-y-1.5">
                <span className="text-[9px] font-mono text-zinc-400 block uppercase">Specification Description Logs</span>
                <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed bg-zinc-50 dark:bg-zinc-900/45 rounded-xl p-3 border border-gray-100 dark:border-zinc-850/60 font-medium">
                  {selectedAdminProduct.description || 'No detailed specifications entered.'}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    setIsAdminViewing(false);
                    setSelectedAdminProduct(null);
                  }}
                  className="cursor-pointer px-4 py-2 text-xs font-semibold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl hover:opacity-90 transition-all font-mono"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- EDIT PRODUCT MODAL -------------------- */}
      {isAdminEditing && selectedAdminProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 dark:bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl border border-gray-150 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 font-sans max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => {
                setIsAdminEditing(false);
                setSelectedAdminProduct(null);
              }}
              className="absolute right-4 top-4 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-4">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400 font-bold">Store Catalog Editing</span>
                <h3 className="font-serif text-sm font-semibold text-gray-950 dark:text-white mt-0.5">
                  Modify Product Specifications
                </h3>
                <p className="text-[9px] font-mono text-zinc-400 uppercase mt-0.5">
                  Sourced via: {selectedAdminProduct.source || 'manual'}
                </p>
              </div>

              {editError && (
                <div className="bg-rose-50 dark:bg-rose-955/10 border border-rose-100/50 rounded-xl p-3 text-rose-700 dark:text-rose-400 text-xs font-mono">
                  ⚠️ Error: {editError}
                </div>
              )}

              {editSuccess && (
                <div className="bg-emerald-50 dark:bg-emerald-955/10 border border-emerald-100/50 rounded-xl p-3 text-emerald-700 dark:text-emerald-400 text-xs font-mono">
                  ✓ Success: {editSuccess}
                </div>
              )}

              <form onSubmit={handleSaveProductEdit} className="space-y-4">
                {selectedAdminProduct.source !== 'cj' ? (
                  /* MANUAL PRODUCTS FIELDS */
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-gray-400">Spec / Product Naming</label>
                      <input
                        type="text"
                        required
                        value={editProdName}
                        onChange={(e) => setEditProdName(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-gray-400">Category</label>
                        <select
                          value={editProdCategory}
                          onChange={(e) => setEditProdCategory(e.target.value)}
                          className="w-full rounded-xl border border-gray-205 bg-white px-3 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white"
                        >
                          <option value="Electronics">Electronics</option>
                          <option value="Phone Accessories">Phone Accessories</option>
                          <option value="Smart Gadgets">Smart Gadgets</option>
                          <option value="Apparel & Fashion">Apparel & Fashion</option>
                          <option value="Beauty & Skincare">Beauty & Skincare</option>
                          <option value="Home & Kitchen">Home & Kitchen</option>
                          <option value="Fitness & Health">Fitness & Health</option>
                          <option value="Pet Supplies">Pet Supplies</option>
                          <option value="Office & Desk">Office & Desk</option>
                          <option value="Travel Accessories">Travel Accessories</option>
                          <option value="Baby & Kids">Baby & Kids</option>
                          <option value="Jewelry & Watches">Jewelry & Watches</option>
                          <option value="Furniture">Furniture</option>
                          <option value="Accessories">Accessories</option>
                          <option value="Fashion">Fashion</option>
                          <option value="Beauty">Beauty</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-gray-400">Pricing ($)</label>
                        <input
                          type="number"
                          required
                          value={editProdPrice}
                          onChange={(e) => setEditProdPrice(e.target.value)}
                          className="w-full rounded-xl border border-gray-205 bg-white px-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-gray-400">Image Asset URL Reference</label>
                      <input
                        type="text"
                        required
                        value={editProdImg}
                        onChange={(e) => setEditProdImg(e.target.value)}
                        className="w-full rounded-xl border border-gray-250 bg-white px-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-gray-400">Stock Reservoir Volume</label>
                      <input
                        type="number"
                        required
                        value={editProdStock}
                        onChange={(e) => setEditProdStock(e.target.value)}
                        className="w-full rounded-xl border border-gray-205 bg-white px-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-gray-400">Item Specification Detail Logs</label>
                      <textarea
                        rows={3}
                        value={editProdDesc}
                        onChange={(e) => setEditProdDesc(e.target.value)}
                        className="w-full rounded-xl border border-gray-205 bg-white px-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white"
                      />
                    </div>

                    {/* Manual Status Switches */}
                    <div className="bg-zinc-51 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-850 p-4 rounded-2xl space-y-3">
                      <label className="text-[9px] font-mono uppercase text-gray-400 block tracking-wider font-bold">Storefront State Switches</label>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-gray-901 dark:text-white block">Published Status</span>
                          <span className="text-[9px] text-gray-450 block">Show and browse inside the buyer boutique</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={editProdIsPublished}
                          onChange={(e) => setEditProdIsPublished(e.target.checked)}
                          className="h-4 w-4 rounded text-zinc-930 border-gray-300 dark:border-zinc-800 focus:ring-zinc-510 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-100/60 dark:border-zinc-850/60 pt-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-gray-901 dark:text-white block">Archive Catalog Item</span>
                          <span className="text-[9px] text-gray-450 block">Moves listing into archive</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={editProdIsArchived}
                          onChange={(e) => setEditProdIsArchived(e.target.checked)}
                          className="h-4 w-4 rounded text-zinc-930 border-gray-300 dark:border-zinc-800 focus:ring-zinc-510 cursor-pointer"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  /* DSERS PRODUCTS CONTROL SUITE */
                  <>
                    <div className="bg-blue-50/50 dark:bg-blue-955/10 border border-blue-100/30 p-3 rounded-2xl flex items-start gap-3">
                      <Database className="h-5 w-5 text-blue-605 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-serif text-xs font-semibold text-blue-950 dark:text-blue-400 block">CJ Dropshipping Synced SKU</span>
                        <p className="text-[10px] text-blue-800 dark:text-blue-400 leading-relaxed font-sans mt-0.5 font-medium">
                          CJ dropshipped catalogue properties remain pristine. You can override category, storefront visibility, archive parameters, or remove from CJ active automatic sync list.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-gray-400">CJ Original Sync Category</label>
                        <input
                          type="text"
                          disabled
                          value={selectedAdminProduct.cjCategory || selectedAdminProduct.category || ''}
                          className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-500 outline-none dark:border-zinc-800 dark:bg-zinc-900/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-blue-600 dark:text-blue-400 font-bold">Storefront Category Override</label>
                        <select
                          value={editProdCategory}
                          onChange={(e) => setEditProdCategory(e.target.value)}
                          className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 dark:border-blue-900 dark:bg-zinc-900 dark:text-white"
                        >
                          <option value="Electronics">Electronics</option>
                          <option value="Phone Accessories">Phone Accessories</option>
                          <option value="Smart Gadgets">Smart Gadgets</option>
                          <option value="Apparel & Fashion">Apparel & Fashion</option>
                          <option value="Beauty & Skincare">Beauty & Skincare</option>
                          <option value="Home & Kitchen">Home & Kitchen</option>
                          <option value="Fitness & Health">Fitness & Health</option>
                          <option value="Pet Supplies">Pet Supplies</option>
                          <option value="Office & Desk">Office & Desk</option>
                          <option value="Travel Accessories">Travel Accessories</option>
                          <option value="Baby & Kids">Baby & Kids</option>
                          <option value="Jewelry & Watches">Jewelry & Watches</option>
                          <option value="Furniture">Furniture</option>
                          <option value="Accessories">Accessories</option>
                          <option value="Fashion">Fashion</option>
                          <option value="Beauty">Beauty</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-gray-400 font-medium">Override Sync Pricing ($)</label>
                        <input
                          type="number"
                          value={editProdPrice}
                          onChange={(e) => setEditProdPrice(e.target.value)}
                          className="w-full rounded-xl border border-gray-205 bg-white px-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-gray-400 font-medium">Override Sync Stock</label>
                        <input
                          type="number"
                          value={editProdStock}
                          onChange={(e) => setEditProdStock(e.target.value)}
                          className="w-full rounded-xl border border-gray-205 bg-white px-3.5 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-805 dark:bg-zinc-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-850 p-4 rounded-2xl space-y-4">
                      <label className="text-[9px] font-mono uppercase text-gray-450 block tracking-wider font-bold">Supplier SKU Rules & Status overrides</label>
                      
                      {/* 1. Unpublish from store */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-gray-901 dark:text-white block">Unpublish From Storefront</span>
                          <span className="text-[9px] text-gray-450 block">Converts live item into unpublished storefront draft</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={!editProdIsPublished}
                          onChange={(e) => setEditProdIsPublished(!e.target.checked)}
                          className="h-4 w-4 rounded text-zinc-930 border-gray-300 dark:border-zinc-800 focus:ring-zinc-510 cursor-pointer"
                        />
                      </div>

                      {/* 2. Archive */}
                      <div className="flex items-center justify-between border-t border-gray-100/60 dark:border-zinc-850/60 pt-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-gray-901 dark:text-white block">Archive Product</span>
                          <span className="text-[9px] text-gray-450 block font-medium">Moves dropship SKU into internal logistics log</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={editProdIsArchived}
                          onChange={(e) => setEditProdIsArchived(e.target.checked)}
                          className="h-4 w-4 rounded text-zinc-930 border-gray-300 dark:border-zinc-800 focus:ring-zinc-510 cursor-pointer"
                        />
                      </div>

                      {/* 3. Remove from CJ Dropshipping sync list */}
                      <div className="flex items-center justify-between border-t border-gray-100/60 dark:border-zinc-850/60 pt-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-gray-901 dark:text-white block">De-Authorize CJ Automation</span>
                          <span className="text-[9px] text-gray-450 block font-medium">Remove from automated markup & warehouse sync queue</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={editProdCjRemovedFromSync}
                          onChange={(e) => setEditProdCjRemovedFromSync(e.target.checked)}
                          className="h-4 w-4 rounded text-zinc-930 border-gray-300 dark:border-zinc-800 focus:ring-zinc-510 cursor-pointer"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-900">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdminEditing(false);
                      setSelectedAdminProduct(null);
                    }}
                    className="cursor-pointer px-4 py-2 text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 text-zinc-700 rounded-xl hover:bg-zinc-200"
                  >
                    Cancel Action
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer px-4 py-2 text-xs font-semibold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl hover:opacity-90 transition-all font-mono"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- CONFIRM DELETE DIALOG -------------------- */}
      {isConfirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 dark:bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-rose-105 bg-white p-6 shadow-2xl dark:border-rose-950/40 dark:bg-zinc-950 font-sans">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-955/20 text-rose-600 rounded-2xl">
                <AlertTriangle className="h-6 w-6 animate-bounce" />
              </div>
              <div className="space-y-1.5 flex-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-rose-500 block font-bold">Critical Operation Confirm</span>
                <h4 className="font-serif text-sm font-bold text-gray-950 dark:text-white">
                  Permanently Delete Product?
                </h4>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed font-sans">
                  Are you absolutely certain you wish to delete <span className="font-semibold text-gray-950 dark:text-white">"{isConfirmingDelete.name}"</span>? 
                  This will remove the item from local logs completely. This action operation is irreversible.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-gray-100 dark:border-zinc-900">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(null)}
                className="cursor-pointer px-4 py-2 text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-200"
              >
                No, Safeguard Stock
              </button>
              <button
                type="button"
                onClick={handleDeleteProductPermanent}
                className="cursor-pointer px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-750 font-mono"
              >
                Yes, Destroy Records
              </button>
            </div>
          </div>
        </div>
      )}
      {/* -------------------- CONFIRM BULK DELETE DIALOG -------------------- */}
      {isConfirmingBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 dark:bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-rose-105 bg-white p-6 shadow-2xl dark:border-rose-950/40 dark:bg-zinc-950 font-sans">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-955/20 text-rose-600 rounded-2xl">
                <AlertTriangle className="h-6 w-6 animate-bounce" />
              </div>
              <div className="space-y-1.5 flex-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-rose-500 block font-bold">Bulk Critical Operation</span>
                <h4 className="font-serif text-sm font-bold text-gray-950 dark:text-white">
                  Permanently Delete Selected Products?
                </h4>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed font-sans">
                  Are you absolutely certain you wish to delete <span className="font-semibold text-rose-600 dark:text-rose-400">{selectedProductIds.length} select catalog products</span>? 
                  This will wipe all designated records from your local database permanently. This operation is irreversible.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-gray-100 dark:border-zinc-900">
              <button
                type="button"
                onClick={() => setIsConfirmingBulkDelete(false)}
                className="cursor-pointer px-4 py-2 text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-305 rounded-xl hover:bg-zinc-200"
              >
                No, Safeguard Selected
              </button>
              <button
                type="button"
                onClick={executeBulkAction}
                className="cursor-pointer px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-750 font-mono"
              >
                Yes, Destroy {selectedProductIds.length} Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- CONFIRM OTHER BULK ACTIONS -------------------- */}
      {isConfirmingBulkAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 dark:bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-zinc-205 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 font-sans">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-300 rounded-2xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-450 block font-bold">Bulk Action Confirmation</span>
                <h4 className="font-serif text-sm font-bold text-gray-950 dark:text-white capitalize">
                  Execute Bulk '{isConfirmingBulkAction}' Action?
                </h4>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed font-sans">
                  You are about to execute the <span className="font-semibold text-gray-950 dark:text-white capitalize">"{isConfirmingBulkAction}"</span> action on <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedProductIds.length} items</span> in the current directory.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-gray-100 dark:border-zinc-900">
              <button
                type="button"
                onClick={() => setIsConfirmingBulkAction('')}
                className="cursor-pointer px-4 py-2 text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeBulkAction}
                className="cursor-pointer px-4 py-2 text-xs font-semibold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl hover:opacity-90 font-mono"
              >
                Confirm and Execute
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
        )}
        {activeTab === 'cj' && (
           <div className="p-8 space-y-4">
              <h2 className="text-xl font-serif font-bold text-zinc-900 dark:text-white">CJ Dropshipping Integration</h2>
              <p className="text-zinc-500 font-mono text-xs">For technical controls on CJ synchronization, switch to the Products tab and scroll down.</p>
           </div>
        )}
        {activeTab === 'orders' && (
           <OrderDirectory />
        )}
        {activeTab === 'reports' && (
           <div className="p-8 text-center text-zinc-500 font-mono">Reports Hub placeholder.</div>
        )}
        {activeTab === 'settings' && (
           <div className="p-8 text-center text-zinc-500 font-mono">Settings placeholder.</div>
        )}
      </AdminLayout>
    </AdminDataProvider>
  );
};
