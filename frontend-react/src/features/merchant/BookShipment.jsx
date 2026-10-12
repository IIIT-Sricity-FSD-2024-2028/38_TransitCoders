import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BoxSeam, 
  Truck, 
  CheckCircleFill, 
  Printer, 
  Building, 
  GeoAlt, 
  ShieldCheck, 
  ArrowRight,
  InfoCircle,
  CashCoin,
  QrCode,
  TagFill
} from 'react-bootstrap-icons';
import { useMerchant } from '../../services/MerchantContext';

/**
 * Realistic & Streamlined Merchant Shipment Booking Portal
 * 
 * Key Realistic Improvements:
 * 1. Pre-configured Warehouse Profile: Defaults to Merchant's registered warehouse.
 * 2. Automatic PIN-Code Routing: Resolves routing hub automatically.
 * 3. Compact 2-Column Workflow: Destination & Package on left, Real-time sticky Fare breakdown on right.
 * 4. Printable AWB Shipping Label: Realistic barcode/QR printable shipping label on confirmation.
 */
export default function BookShipment() {
  const navigate = useNavigate();
  const { createOrder } = useMerchant();

  // Saved Merchant Warehouses
  const SAVED_WAREHOUSES = [
    {
      id: 'wh-01',
      name: 'Main Chennai Warehouse (Default)',
      address: 'Plot 24, Guindy Industrial Estate',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600032',
      phone: '+91 98765 43210'
    },
    {
      id: 'wh-02',
      name: 'Bengaluru Electronic City Depot',
      address: 'Phase 1, Hosur Main Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560100',
      phone: '+91 98765 11223'
    }
  ];

  const [selectedWarehouseId, setSelectedWarehouseId] = useState('wh-01');

  // Customer / Destination Details
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    destinationCity: 'Bengaluru',
    pincode: '560001',
    landmark: '',
    // Package Details
    pkgType: 'Box',
    pkgCategory: 'Electronics',
    pkgWeight: 2.0,
    pkgLength: 25,
    pkgWidth: 20,
    pkgHeight: 15,
    declaredValue: 2000,
    // Service Level
    serviceSpeed: 'express', // 'standard' | 'express' | 'overnight'
    fragile: true,
    addInsurance: true,
    pickupDate: '2026-10-14',
    pickupSlot: 'Morning (09:00 AM – 01:00 PM)'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedShipment, setBookedShipment] = useState(null);

  // Active Origin Warehouse
  const activeWarehouse = SAVED_WAREHOUSES.find(w => w.id === selectedWarehouseId) || SAVED_WAREHOUSES[0];

  // Dynamic Pricing Engine
  const PRICING_CONFIG = {
    standard: { base: 120, perKg: 40, sla: '3–4 Business Days' },
    express: { base: 220, perKg: 60, sla: '1–2 Business Days' },
    overnight: { base: 450, perKg: 95, sla: 'Next Day by 11:00 AM' }
  };

  const selectedTier = PRICING_CONFIG[formData.serviceSpeed] || PRICING_CONFIG.standard;
  const weight = parseFloat(formData.pkgWeight) || 1;
  const weightCharge = Math.round(weight * selectedTier.perKg);
  const fragileCharge = formData.fragile ? 40 : 0;
  const insuranceCharge = formData.addInsurance ? Math.max(30, Math.round(Number(formData.declaredValue || 0) * 0.012)) : 0;
  const subTotal = selectedTier.base + weightCharge + fragileCharge + insuranceCharge;
  const gstTax = Math.round(subTotal * 0.18);
  const grandTotal = subTotal + gstTax;

  // Auto-resolved Routing Hub
  const resolvedDestinationHub = useMemo(() => {
    if (formData.destinationCity.toLowerCase().includes('bengaluru')) return 'BLR-01 (South Air Hub)';
    if (formData.destinationCity.toLowerCase().includes('hyderabad')) return 'HYD-01 (Secunderabad Hub)';
    if (formData.destinationCity.toLowerCase().includes('mumbai')) return 'BOM-01 (Bhiwandi Gateway)';
    if (formData.destinationCity.toLowerCase().includes('delhi')) return 'DEL-01 (IGI Cargo Terminal)';
    return `${formData.destinationCity.toUpperCase()}-01 Regional Depot`;
  }, [formData.destinationCity]);

  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  async function handleBookShipment(e) {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.deliveryAddress.trim() || !formData.pincode.trim()) {
      alert('Please complete recipient name, address, and PIN code.');
      return;
    }

    try {
      setIsSubmitting(true);

      const orderPayload = {
        recvName: formData.customerName,
        recvPhone: formData.customerPhone || '+91 94444 00000',
        pickupAddress: activeWarehouse.address,
        pickupCity: activeWarehouse.city,
        recvAddress: formData.deliveryAddress,
        recvCity: formData.destinationCity,
        pkgWeight: weight,
        pkgType: formData.pkgType,
        serviceType: formData.serviceSpeed,
        price: grandTotal
      };

      const newOrder = await createOrder(orderPayload);
      setBookedShipment(newOrder);
    } catch (err) {
      alert('Failed to book shipment: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create & Dispatch Shipment</h1>
          <p className="text-sm text-gray-500">Fast order fulfillment, automatic hub routing, and instant AWB label generation</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200">
            ● Ready for Dispatch
          </span>
        </div>
      </div>

      {/* ── CONFIRMATION & AWB SHIPPING LABEL VIEW ── */}
      {bookedShipment ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-8 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                <CheckCircleFill size={28} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Shipment Booked Successfully!</h2>
                <p className="text-xs text-gray-500">Pickup scheduled for {formData.pickupDate} ({formData.pickupSlot})</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm transition-colors"
              >
                <Printer size={16} />
                <span>Print AWB Shipping Label</span>
              </button>
              <button
                onClick={() => setBookedShipment(null)}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-lg transition-colors"
              >
                + Book Another
              </button>
            </div>
          </div>

          {/* REALISTIC AWB SHIPPING LABEL PREVIEW */}
          <div className="max-w-2xl mx-auto border-2 border-dashed border-gray-300 p-6 rounded-xl bg-gray-50/50 space-y-4">
            <div className="flex justify-between items-start border-b-2 border-black pb-3">
              <div>
                <span className="text-xl font-black tracking-tight text-gray-900">Swift<span className="text-orange-600">Track</span> Express</span>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Standard Air Waybill (AWB)</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold uppercase bg-black text-white px-2.5 py-1 rounded">
                  {formData.serviceSpeed.toUpperCase()} AIR
                </span>
              </div>
            </div>

            {/* Barcode Mock */}
            <div className="py-2 text-center bg-white border border-gray-200 rounded-lg p-3 space-y-1">
              <div className="font-mono text-2xl font-black tracking-widest text-gray-900">
                {bookedShipment.trackingNumber}
              </div>
              <div className="flex justify-center items-center gap-1 h-10 overflow-hidden opacity-80">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className={`h-full ${i % 3 === 0 ? 'w-1 bg-black' : i % 2 === 0 ? 'w-0.5 bg-black' : 'w-1.5 bg-black'}`} />
                ))}
              </div>
              <p className="text-[9px] text-gray-400 font-mono">SCAN TO INDUCT AT CARGO GATEWAY</p>
            </div>

            {/* Sender & Receiver Info */}
            <div className="grid grid-cols-2 gap-4 text-xs border-b border-gray-200 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase text-gray-400">SHIP FROM (MERCHANT):</p>
                <p className="font-bold text-gray-900">{activeWarehouse.name}</p>
                <p className="text-gray-600">{activeWarehouse.address}</p>
                <p className="text-gray-600">{activeWarehouse.city}, {activeWarehouse.state} - {activeWarehouse.pincode}</p>
                <p className="text-gray-500 font-mono mt-1">Ph: {activeWarehouse.phone}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-gray-400">DELIVER TO (CUSTOMER):</p>
                <p className="font-bold text-gray-900">{formData.customerName}</p>
                <p className="text-gray-600">{formData.deliveryAddress}</p>
                <p className="text-gray-600">{formData.destinationCity}, {formData.pincode}</p>
                <p className="text-gray-500 font-mono mt-1">Ph: {formData.customerPhone}</p>
              </div>
            </div>

            {/* Routing and Dimensions */}
            <div className="grid grid-cols-3 gap-3 text-xs bg-white p-3 rounded-lg border border-gray-200">
              <div>
                <span className="text-[10px] text-gray-400 block font-semibold">WEIGHT</span>
                <span className="font-bold text-gray-900">{weight} kg</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block font-semibold">AUTO ROUTING HUB</span>
                <span className="font-bold text-orange-600">{resolvedDestinationHub}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block font-semibold">COLLECTIBLE</span>
                <span className="font-bold text-gray-900">₹{grandTotal} (PAID)</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/merchant/orders')}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              View in My Shipments
            </button>
            <button
              onClick={() => navigate('/merchant/track')}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors"
            >
              Track on Live GPS Map
            </button>
          </div>
        </div>
      ) : (

        /* ── FAST 2-COLUMN MERCHANT FULFILLMENT FORM ── */
        <form onSubmit={handleBookShipment} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT 2 COLUMNS: Order Inputs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Origin Warehouse (Pre-configured profile) */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div className="flex items-center gap-2">
                  <Building className="text-orange-600" size={18} />
                  <h3 className="text-sm font-bold text-gray-900">1. Pickup Warehouse Location</h3>
                </div>
                <span className="text-[11px] text-gray-400">Pre-saved Merchant Origin</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAVED_WAREHOUSES.map((wh) => (
                  <div
                    key={wh.id}
                    onClick={() => setSelectedWarehouseId(wh.id)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedWarehouseId === wh.id
                        ? 'border-orange-500 bg-orange-50/50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">{wh.name}</span>
                      <span className={`w-3 h-3 rounded-full border-2 ${selectedWarehouseId === wh.id ? 'border-orange-600 bg-orange-600' : 'border-gray-300'}`} />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">{wh.address}, {wh.city} - {wh.pincode}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Recipient & Delivery Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div className="flex items-center gap-2">
                  <GeoAlt className="text-orange-600" size={18} />
                  <h3 className="text-sm font-bold text-gray-900">2. Customer & Delivery Destination</h3>
                </div>
                <span className="text-[11px] text-gray-400">Required for last-mile drop</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Customer / Recipient Name *</label>
                  <input
                    type="text"
                    name="customerName"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Recipient Mobile Phone *</label>
                  <input
                    type="tel"
                    name="customerPhone"
                    required
                    placeholder="e.g. +91 94444 11223"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Street Address, Building & Flat Number *</label>
                <input
                  type="text"
                  name="deliveryAddress"
                  required
                  placeholder="e.g. Flat 4B, Sky Residency, 15 MG Road"
                  value={formData.deliveryAddress}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Destination City *</label>
                  <input
                    type="text"
                    name="destinationCity"
                    required
                    value={formData.destinationCity}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    name="pincode"
                    required
                    placeholder="e.g. 560001"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Auto Hub Resolved</label>
                  <div className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-orange-600 truncate">
                    {resolvedDestinationHub}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Package Specifications & Price Per KG */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div className="flex items-center gap-2">
                  <BoxSeam className="text-orange-600" size={18} />
                  <h3 className="text-sm font-bold text-gray-900">3. Package Specifications & Weight Rate</h3>
                </div>
                <span className="text-xs bg-orange-50 text-orange-700 font-bold px-2.5 py-0.5 rounded-full">
                  Current Tier: ₹{selectedTier.perKg} / KG
                </span>
              </div>

              {/* Dynamic Weight Calculator Box */}
              <div className="bg-gradient-to-r from-orange-50/70 to-amber-50/50 border border-orange-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 w-full sm:w-auto">
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wide">
                    Package Dead Weight (kg)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="50"
                      name="pkgWeight"
                      value={formData.pkgWeight}
                      onChange={handleInputChange}
                      className="w-32 px-3 py-2 border-2 border-orange-300 rounded-lg text-base font-bold text-gray-900 bg-white"
                    />
                    <span className="text-xs font-bold text-gray-500">KG</span>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-orange-200 shadow-sm text-right min-w-[200px]">
                  <div className="text-[11px] text-gray-500 font-semibold uppercase">
                    Rate: <span className="text-orange-600 font-bold">₹{selectedTier.perKg} / kg</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    {weight} kg × ₹{selectedTier.perKg}
                  </div>
                  <div className="text-lg font-extrabold text-orange-600">
                    = ₹{weightCharge}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Package Type</label>
                  <select
                    name="pkgType"
                    value={formData.pkgType}
                    onChange={handleInputChange}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                  >
                    <option>Box</option>
                    <option>Envelope</option>
                    <option>Pallet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    name="pkgCategory"
                    value={formData.pkgCategory}
                    onChange={handleInputChange}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                  >
                    <option>Electronics</option>
                    <option>Apparel</option>
                    <option>Documents</option>
                    <option>Pharma</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Dimensions (LxWxH)</label>
                  <input
                    type="text"
                    disabled
                    value={`${formData.pkgLength}x${formData.pkgWidth}x${formData.pkgHeight} cm`}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-gray-50 text-gray-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Declared Value (₹)</label>
                  <input
                    type="number"
                    name="declaredValue"
                    value={formData.declaredValue}
                    onChange={handleInputChange}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 4. Speed Selection Cards */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-900 border-b pb-2">4. Service Speed & Courier SLA</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(PRICING_CONFIG).map(([speed, tier]) => (
                  <div
                    key={speed}
                    onClick={() => setFormData({ ...formData, serviceSpeed: speed })}
                    className={`p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.serviceSpeed === speed
                        ? 'border-orange-500 bg-orange-50/60'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs uppercase text-gray-900">{speed}</span>
                      <span className="text-[10px] font-bold text-orange-600">₹{tier.perKg}/kg</span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">{tier.sla}</div>
                    <div className="text-xs font-extrabold text-gray-900 mt-2">
                      Base ₹{tier.base}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT 1 COLUMN: Real-Time Sticky Summary & Dispatch Button */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border-2 border-orange-200 p-6 shadow-md space-y-4 sticky top-6">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <CashCoin size={20} className="text-orange-600" />
                  <h3 className="text-sm font-bold text-gray-900">Live Itemized Bill</h3>
                </div>
                <span className="text-xs font-bold text-orange-600 uppercase">{formData.serviceSpeed}</span>
              </div>

              {/* Itemized Fare Computation */}
              <div className="space-y-2.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Base Pickup & Handling:</span>
                  <span className="font-semibold text-gray-900">₹{selectedTier.base}.00</span>
                </div>

                <div className="flex justify-between">
                  <span>Weight Freight ({weight} kg × ₹{selectedTier.perKg}):</span>
                  <span className="font-bold text-gray-900">₹{weightCharge}.00</span>
                </div>

                {formData.fragile && (
                  <div className="flex justify-between text-amber-700">
                    <span>Fragile Protective Surcharge:</span>
                    <span className="font-semibold">+₹{fragileCharge}.00</span>
                  </div>
                )}

                {formData.addInsurance && (
                  <div className="flex justify-between text-blue-700">
                    <span>Transit Risk Cover (1.2%):</span>
                    <span className="font-semibold">+₹{insuranceCharge}.00</span>
                  </div>
                )}

                <div className="flex justify-between border-t pt-2 text-gray-500">
                  <span>GST (18% Transport Tax):</span>
                  <span className="font-semibold text-gray-900">+₹{gstTax}.00</span>
                </div>

                <div className="border-t-2 border-gray-100 pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-gray-900">Total Billed:</span>
                  <span className="text-2xl font-black text-orange-600">₹{grandTotal}</span>
                </div>
              </div>

              {/* Transit & Routing Info */}
              <div className="bg-gray-50 rounded-xl p-3 text-[11px] text-gray-600 space-y-1">
                <div><b>SLA Delivery:</b> {selectedTier.sla}</div>
                <div><b>Pickup Date:</b> {formData.pickupDate}</div>
                <div><b>Route Vector:</b> {activeWarehouse.city} → {formData.destinationCity}</div>
              </div>

              {/* Confirm Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white font-bold rounded-xl shadow-md transition-colors text-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Generating AWB Label...</span>
                ) : (
                  <>
                    <span>Book & Dispatch (₹{grandTotal})</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <p className="text-[10px] text-gray-400 text-center">
                Instantly registered in SwiftTrack logistics database
              </p>
            </div>
          </div>

        </form>
      )}

    </div>
  );
}
