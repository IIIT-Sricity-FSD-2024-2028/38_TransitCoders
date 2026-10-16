import { useState, useEffect } from 'react';
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
import { 
  loadOrders, 
  saveOrders, 
  createMerchantOrder, 
  fetchMerchantHubs, 
  fetchMerchantPricing, 
  generateTrackingNumber, 
  getAutoDimensions 
} from '../../services/merchantHelpers';

/**
 * BookShipment — Merchant Order Creation Form
 * 
 * Order booking and shipment dispatch view for merchants.
 * Supports warehouse selection, destination resolution, live weight pricing,
 * service level selection, and instant AWB shipping label generation.
 */
export default function BookShipment() {
  // ── Live Warehouses & Pricing from Backend Database ──
  const [warehouses, setWarehouses] = useState([]);
  const [pricingConfig, setPricingConfig] = useState(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');

  // Form data state
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
    declaredValue: 2000,
    // Service Level
    serviceSpeed: 'express',
    fragile: true,
    addInsurance: true,
    pickupDate: new Date().toISOString().split('T')[0],
    pickupSlot: 'Morning (09:00 AM – 01:00 PM)'
  });

  // Submission state and created shipment
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedShipment, setBookedShipment] = useState(null);

  // Fetch real warehouses and pricing from backend SQLite database on mount
  useEffect(() => {
    fetchMerchantHubs().then((hubs) => {
      if (Array.isArray(hubs) && hubs.length > 0) {
        setWarehouses(hubs);
        setSelectedWarehouseId(hubs[0].id || hubs[0].hubId);
      }
    });

    fetchMerchantPricing().then((config) => {
      if (config) setPricingConfig(config);
    });
  }, []);

  // Active warehouse object from database
  const activeWarehouse = warehouses.find(w => (w.id || w.hubId) === selectedWarehouseId) || warehouses[0] || null;

  // ── Live Pricing from Database Configuration ──
  const baseRate = pricingConfig ? Number(pricingConfig.baseFee) : 40;
  const standardKg = pricingConfig ? Number(pricingConfig.perKgStandard) : 25;
  const expressKg = pricingConfig ? Number(pricingConfig.perKgExpress) : 45;
  const sameDayKg = pricingConfig ? Number(pricingConfig.perKgSameDay) : 80;

  const PRICING_CONFIG = {
    standard: { base: baseRate, perKg: standardKg, sla: '3–4 Business Days' },
    express: { base: Math.round(baseRate * 1.5), perKg: expressKg, sla: '1–2 Business Days' },
    overnight: { base: Math.round(baseRate * 2.0), perKg: sameDayKg, sla: 'Same Day / Overnight' }
  };

  // Live fare and tax calculations
  const selectedTier = PRICING_CONFIG[formData.serviceSpeed] || PRICING_CONFIG.standard;
  const weight = parseFloat(formData.pkgWeight) || 1;
  const weightCharge = Math.round(weight * selectedTier.perKg);
  const fragileCharge = formData.fragile ? 40 : 0;
  const insuranceCharge = formData.addInsurance ? Math.max(30, Math.round(Number(formData.declaredValue || 0) * 0.012)) : 0;
  const subTotal = selectedTier.base + weightCharge + fragileCharge + insuranceCharge;
  const taxPct = pricingConfig ? (Number(pricingConfig.taxPercent) || 5) / 100 : 0.05;
  const gstTax = Math.round(subTotal * taxPct);
  const grandTotal = subTotal + gstTax;

  // Resolve regional distribution hub from destination city based on database hubs
  function getResolvedHub() {
    const city = (formData.destinationCity || '').toLowerCase().trim();
    if (!city) return 'Regional Logistics Depot';
    const matched = warehouses.find(w => 
      (w.city && w.city.toLowerCase().includes(city)) || 
      (w.name && w.name.toLowerCase().includes(city))
    );
    if (matched) return `${matched.hubId || matched.id} (${matched.name || matched.city})`;
    return `${formData.destinationCity.toUpperCase()}-01 Regional Depot`;
  }
  const resolvedDestinationHub = getResolvedHub();

  // Automatically assign dimensions based on package type and weight
  const autoDimensions = getAutoDimensions(formData.pkgType, formData.pkgWeight);

  // Handle form input change with strict type filtering
  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;

    // Checkboxes
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }

    let cleanValue = value;

    // 1. Text-Only: Customer Name (letters, spaces, dots, hyphens only)
    if (name === 'customerName') {
      cleanValue = value.replace(/[^a-zA-Z\s.'-]/g, '');
    }

    // 2. Text-Only: Destination City (letters, spaces, hyphens only)
    if (name === 'destinationCity') {
      cleanValue = value.replace(/[^a-zA-Z\s-]/g, '');
    }

    // 3. Number/Phone: Recipient Phone (digits, spaces, hyphens, and leading + only, max 15 chars)
    if (name === 'customerPhone') {
      cleanValue = value.replace(/[^0-9+\-\s]/g, '').slice(0, 15);
    }

    // 4. Number-Only: Indian PIN Code (digits only, strictly 6 digits max)
    if (name === 'pincode') {
      cleanValue = value.replace(/\D/g, '').slice(0, 6);
    }

    // 5. Number-Only: Declared Value (positive integers only)
    if (name === 'declaredValue') {
      cleanValue = value.replace(/\D/g, '');
    }

    // 6. Number: Package Weight (positive number up to 50kg)
    if (name === 'pkgWeight') {
      const num = parseFloat(value);
      if (num < 0) cleanValue = '0.1';
      else if (num > 50) cleanValue = '50';
    }

    setFormData(prev => ({
      ...prev,
      [name]: cleanValue
    }));
  }

  // Handle shipment booking form submission
  async function handleBookShipment(e) {
    e.preventDefault();

    // 1. Validate Recipient Name (text only, at least 3 letters)
    if (!formData.customerName.trim() || formData.customerName.trim().length < 3) {
      alert('Please enter a valid recipient name (minimum 3 letters, alphabets only).');
      return;
    }

    // 2. Validate Phone Number (must have at least 10 numeric digits)
    const digitsOnlyPhone = (formData.customerPhone || '').replace(/\D/g, '');
    if (!digitsOnlyPhone || digitsOnlyPhone.length < 10) {
      alert('Please enter a valid 10-digit mobile phone number (numbers only).');
      return;
    }

    // 3. Validate Delivery Address
    if (!formData.deliveryAddress.trim() || formData.deliveryAddress.trim().length < 5) {
      alert('Please enter a complete delivery address (street, building, flat number).');
      return;
    }

    // 4. Validate Destination City (text only)
    if (!formData.destinationCity.trim()) {
      alert('Please enter a valid destination city (alphabets only).');
      return;
    }

    // 5. Validate PIN Code (strictly 6 numeric digits)
    if (formData.pincode.length !== 6) {
      alert('PIN code must be exactly 6 numeric digits (e.g. 560001).');
      return;
    }

    // 6. Validate Weight (positive number)
    const currentWeight = parseFloat(formData.pkgWeight);
    if (isNaN(currentWeight) || currentWeight <= 0) {
      alert('Please enter a valid package weight greater than 0 kg.');
      return;
    }

    setIsSubmitting(true);

    // Generate unique tracking number
    const trackingNumber = generateTrackingNumber();

    // Create the new shipment object
    const newShipment = {
      id: trackingNumber,
      trackingNumber: trackingNumber,
      recipientName: formData.customerName,
      recipientPhone: formData.customerPhone || '+91 94444 00000',
      pickupAddress: activeWarehouse ? `${activeWarehouse.address}, ${activeWarehouse.city}` : 'Origin Logistics Hub',
      pickupHubId: activeWarehouse?.hubId || activeWarehouse?.id || 'H001',
      deliveryAddress: `${formData.deliveryAddress}, ${formData.destinationCity}`,
      origin: activeWarehouse?.city || 'Origin',
      destination: formData.destinationCity,
      packageWeight: weight,
      packageType: formData.pkgType,
      length: autoDimensions.length,
      width: autoDimensions.width,
      height: autoDimensions.height,
      dimensions: `${autoDimensions.length}x${autoDimensions.width}x${autoDimensions.height} cm`,
      dimensionLabel: autoDimensions.label,
      serviceType: formData.serviceSpeed,
      status: 'PENDING',
      price: grandTotal,
      date: 'Just now',
      timeline: [
        { title: 'Shipment Created', time: 'Just now', status: 'done' },
        { title: 'Dispatched to Origin Hub', time: 'In Queue', status: 'active' },
        { title: 'Hub Transit', time: 'Expected tomorrow', status: 'pending' },
        { title: 'Delivery to Recipient', time: 'Pending', status: 'pending' }
      ]
    };

    // Save locally and sync with backend database
    const savedShipment = await createMerchantOrder(newShipment);

    // Update UI state with created shipment
    setBookedShipment(savedShipment || newShipment);
    setIsSubmitting(false);
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

      {/* Show booking confirmation label OR booking form */}
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
              {/* Reset form to book another shipment */}
              <button
                onClick={() => setBookedShipment(null)}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-lg transition-colors"
              >
                + Book Another
              </button>
            </div>
          </div>

          {/* AWB SHIPPING LABEL PREVIEW */}
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

            {/* Printable Barcode Lines */}
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
                <p className="font-bold text-gray-900">{activeWarehouse?.name || 'Logistics Origin Hub'}</p>
                <p className="text-gray-600">{activeWarehouse?.address || 'Origin Address'}</p>
                <p className="text-gray-600">{activeWarehouse?.city || ''}{activeWarehouse?.state ? `, ${activeWarehouse.state}` : ''}{activeWarehouse?.pincode ? ` - ${activeWarehouse.pincode}` : ''}</p>
                <p className="text-gray-500 font-mono mt-1">Ph: {activeWarehouse?.phone || 'N/A'}</p>
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3 rounded-lg border border-gray-200">
              <div>
                <span className="text-[10px] text-gray-400 block font-semibold">WEIGHT</span>
                <span className="font-bold text-gray-900">{weight} kg</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block font-semibold">DIMENSIONS</span>
                <span className="font-bold text-gray-900">{autoDimensions.length}x{autoDimensions.width}x{autoDimensions.height} cm</span>
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

        /* ── Merchant Fulfillment Form ── */
        <form onSubmit={handleBookShipment} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT 2 COLUMNS: Order Inputs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Origin Warehouse Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div className="flex items-center gap-2">
                  <Building className="text-orange-600" size={18} />
                  <h3 className="text-sm font-bold text-gray-900">1. Pickup Warehouse Location</h3>
                </div>
                <span className="text-[11px] text-gray-400">Pre-saved Merchant Origin</span>
              </div>

              {/* Warehouse Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {warehouses.length > 0 ? (
                  warehouses.map((wh) => (
                    <div
                      key={wh.id || wh.hubId}
                      onClick={() => setSelectedWarehouseId(wh.id || wh.hubId)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedWarehouseId === (wh.id || wh.hubId)
                          ? 'border-orange-500 bg-orange-50/50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900">{wh.name}</span>
                        <span className={`w-3 h-3 rounded-full border-2 ${selectedWarehouseId === (wh.id || wh.hubId) ? 'border-orange-600 bg-orange-600' : 'border-gray-300'}`} />
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">{wh.address}, {wh.city} - {wh.pincode}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-400 italic p-4 sm:col-span-2 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    Loading logistics warehouses from backend database...
                  </div>
                )}
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Customer / Recipient Name * <span className="text-[10px] text-gray-400 font-normal">(Letters only)</span>
                  </label>
                  {/* Customer / Recipient Name */}
                  <input
                    type="text"
                    name="customerName"
                    required
                    inputMode="text"
                    placeholder="e.g. Ramesh Chandra"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    title="Enter recipient name (letters only)"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Recipient Mobile Phone * <span className="text-[10px] text-gray-400 font-normal">(Numbers only)</span>
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    required
                    inputMode="tel"
                    maxLength={15}
                    placeholder="e.g. 9444411223 or +91 94444 11223"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    title="Enter 10-digit mobile number (numbers only)"
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Destination City * <span className="text-[10px] text-gray-400 font-normal">(Letters only)</span>
                  </label>
                  <input
                    type="text"
                    name="destinationCity"
                    required
                    inputMode="text"
                    placeholder="e.g. Bengaluru"
                    value={formData.destinationCity}
                    onChange={handleInputChange}
                    title="Enter city name (letters only)"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    PIN Code * <span className="text-[10px] text-gray-400 font-normal">(6 digits)</span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    required
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="e.g. 560001"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    title="Enter 6-digit postal PIN code (numbers only)"
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

              {/* Live Weight Calculator */}
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

                {/* Live weight rate calculation */}
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-gray-700">Dimensions (LxWxH)</label>
                    <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1 rounded border border-orange-200">
                      Auto
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={`${autoDimensions.length} x ${autoDimensions.width} x ${autoDimensions.height} cm`}
                    className="w-full px-2.5 py-1.5 border border-orange-200 rounded-lg bg-orange-50/40 text-gray-900 font-mono text-xs font-bold"
                    title={`Auto-computed for ${formData.pkgType} (${weight} kg)`}
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate" title={autoDimensions.label}>
                    {autoDimensions.label}
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Declared Value (₹)</label>
                  <input
                    type="number"
                    name="declaredValue"
                    min="0"
                    step="100"
                    inputMode="numeric"
                    value={formData.declaredValue}
                    onChange={handleInputChange}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 4. Service Speed & Courier SLA */}
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

              {/* Itemized Fare Breakdown */}
              <div className="space-y-2.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Base Pickup & Handling:</span>
                  <span className="font-semibold text-gray-900">₹{selectedTier.base}.00</span>
                </div>

                <div className="flex justify-between">
                  <span>Weight Freight ({weight} kg × ₹{selectedTier.perKg}):</span>
                  <span className="font-bold text-gray-900">₹{weightCharge}.00</span>
                </div>

                {/* Fragile surcharge */}
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
                <div><b>Route Vector:</b> {activeWarehouse?.city || 'Origin'} → {formData.destinationCity}</div>
              </div>

              {/* Submit Button */}
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
