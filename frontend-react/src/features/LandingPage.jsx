import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import vanImage from '../assets/van-image.png';
import logoImage from '../assets/Container.svg';
import API from '../services/api';
import './LandingPage.css';

export default function LandingPage() {
    const navigate = useNavigate();
    const [trackingId, setTrackingId] = useState('');
    const [trackingData, setTrackingData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleTrack = async (e) => {
        e?.preventDefault();
        const query = trackingId.trim();
        if (!query) return;

        setLoading(true);
        setErrorMsg('');
        setTrackingData(null);

        try {
            const data = await API.tracking.track(query);
            setTrackingData(data);
        } catch (err) {
            setErrorMsg(err.message || 'Tracking ID not found');
        } finally {
            setLoading(false);
        }
    };

    // Formats "2026-09-02T19:50:06.939Z" -> "Sep 2, 7:50 PM"
    const formatEta = (raw) => {
        if (!raw) return '—';
        const d = new Date(raw);
        return isNaN(d) ? raw : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    const isCancelled = trackingData?.status?.toLowerCase() === 'cancelled';

    const getProgressInfo = (status = '') => {
        const s = status.toLowerCase();
        if (s.includes('deliver')) return { percent: '100%', step: 4 };
        if (s.includes('transit') || s.includes('dispatch') || s.includes('out')) return { percent: '66%', step: 3 };
        if (s.includes('hub') || s.includes('process') || s.includes('staging')) return { percent: '33%', step: 2 };
        return { percent: '10%', step: 1 };
    };

    const progress = getProgressInfo(trackingData?.status);

    return (
        <div className="landing-page">
            {/* Header */}
            <header>
                <div className="container header-content">
                    <a href="#" className="logo">
                        <div className="logo-icon">
                            <img src={logoImage} className="logo-img" alt="SwiftTrack Logo" />
                        </div>
                        <span>SwiftTrack</span>
                    </a>

                    <nav className="nav-links">
                        <a href="#about">What is SwiftTrack?</a>
                        <a href="#workflow">Features</a>
                        <a href="#tracking">Tracking</a>
                    </nav>

                    <div className="nav-actions">
                        <button 
                            className="primary-btn" 
                            onClick={() => navigate('/login')}
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero" style={{ position: 'relative' }}>
                <div className="animated-blob" style={{ width: '700px', height: '700px', background: '#f97316', top: '-200px', right: '-200px' }}></div>
                <div className="animated-blob" style={{ width: '500px', height: '500px', background: '#fb923c', bottom: '-100px', left: '-100px', animationDelay: '-10s' }}></div>

                <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                    <h1>WE WILL <span className="accent">TRACK</span> YOUR PACKAGE <br /> <span className="accent">ALL THE WAY</span> HOME</h1>
                    <p className="hero-desc">
                        A unified platform for merchants, hub managers, and delivery agents to manage and track shipments in real time.
                    </p>

                    <div className="hero-layout">
                        <div className="hero-left">
                            <div className="shipment-card">
                                <div className="status-header">Shipment Status</div>
                                <div className="shipment-info">
                                    Order ID: ST-20481 <br />
                                    Route: Chennai → Bengaluru <br />
                                    Status: In Transit
                                </div>
                                <div className="progress-box">
                                    <span className="progress-label">Progress</span>
                                    <div className="progress-bar">
                                        <div className="progress-fill"></div>
                                    </div>
                                    <div className="progress-footer">
                                        <span>40%</span>
                                        <span>ETA: 2h 15m</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="hero-right">
                            <div className="van-bg-box"></div>
                            <img src={vanImage} className="van-img" alt="Logistics Van" />
                        </div>
                    </div>
                </div>
            </section>

           {/* Tracking Section */}
            <section id="tracking" className="new-tracking">
                <div className="container">
                    <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px' }}>Track Your Shipment</h2>
                    <p style={{ color: '#64748b', marginBottom: '40px' }}>Enter your tracking ID to view real-time delivery status</p>

                    <form className="trk-card" onSubmit={handleTrack}>
                        <input 
                            type="text" 
                            className="trk-input" 
                            placeholder="Enter tracking ID (e.g. TRK-QR90ST12)"
                            value={trackingId}
                            onChange={(e) => setTrackingId(e.target.value)}
                        />
                        <button 
                            type="submit"
                            className="cta-btn primary-btn" 
                            style={{ padding: '14px 32px', borderRadius: '100px', cursor: 'pointer' }}
                            disabled={loading}
                        >
                            {loading ? 'Searching...' : 'Track Order'}
                        </button>
                    </form>

                    {errorMsg && (
                        <p style={{ color: '#ef4444', marginTop: '16px' }}>{errorMsg}</p>
                    )}

                    {trackingData && (
                        <div id="tracking-result" style={{ display: 'block' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Shipment ID</div>
                                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                                        {trackingData.trackingId || trackingData.id || trackingId}
                                    </div>
                                </div>
                                <div style={{ 
                                    padding: '6px 16px', 
                                    borderRadius: '100px', 
                                    fontSize: '14px', 
                                    fontWeight: 700, 
                                    background: isCancelled ? '#fee2e2' : '#ff5c0222', 
                                    color: isCancelled ? '#ef4444' : '#ff5c02' 
                                }}>
                                    {trackingData.status || 'Active'}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
                                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>📍 Current Location</div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: isCancelled ? '#94a3b8' : '#1e293b' }}>
                                        {isCancelled ? '—' : (trackingData.currentHub || trackingData.location || trackingData.destination || 'In Route')}
                                    </div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>🕒 Estimated Delivery</div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: isCancelled ? '#ef4444' : '#1e293b' }}>
                                        {isCancelled ? 'Cancelled' : formatEta(trackingData.eta || trackingData.estimatedDelivery)}
                                    </div>
                                </div>
                            </div>

                            {isCancelled ? (
                                <div style={{ padding: '16px', textAlign: 'center', background: '#fef2f2', borderRadius: '12px', color: '#b91c1c', fontSize: '14px', fontWeight: 600 }}>
                                    This shipment has been cancelled.
                                </div>
                            ) : (
                                <div className="trk-timeline">
                                    <div className="trk-progress-fill" style={{ width: progress.percent }}></div>
                                    <div className={`trk-step ${progress.step >= 1 ? 'active' : ''} ${progress.step === 1 ? 'current' : ''}`}>
                                        <div className="trk-dot">📦</div>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Ordered</span>
                                    </div>
                                    <div className={`trk-step ${progress.step >= 2 ? 'active' : ''} ${progress.step === 2 ? 'current' : ''}`}>
                                        <div className="trk-dot">🏭</div>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>At Hub</span>
                                    </div>
                                    <div className={`trk-step ${progress.step >= 3 ? 'active' : ''} ${progress.step === 3 ? 'current' : ''}`}>
                                        <div className="trk-dot">🚚</div>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Transit</span>
                                    </div>
                                    <div className={`trk-step ${progress.step >= 4 ? 'active' : ''} ${progress.step === 4 ? 'current' : ''}`}>
                                        <div className="trk-dot">✓</div>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Delivered</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Stats Strip */}
            <div className="stats-strip">
                <div className="marquee">
                    1200+ Deliveries • 85 Active Delivery Agents • 15 Logistics Hubs • Real-Time Shipment Tracking • Smart Route Optimization •
                    1200+ Deliveries • 85 Active Delivery Agents • 15 Logistics Hubs • Real-Time Shipment Tracking • Smart Route Optimization •
                </div>
            </div>

            {/* Why Choose */}
            <section style={{ padding: '100px 0' }}>
                <div className="container">
                    <div className="section-header">
                        <h2>Why Choose SwiftTrack</h2>
                        <p>Powerful logistics tools built for merchants, hub managers and delivery agents</p>
                    </div>

                    <div className="feature-grid">
                        <div className="feature-card">
                            <div className="feature-icon-box">🚚</div>
                            <h3>Real-Time Tracking</h3>
                            <p>Track shipments and monitor delivery progress in real time.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-box">📦</div>
                            <h3>Smart Dispatch</h3>
                            <p>Automatically assign delivery agents based on route efficiency.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-box">🏭</div>
                            <h3>Hub Management</h3>
                            <p>Manage logistics hubs and shipments across multiple locations.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-box">📈</div>
                            <h3>Delivery Analytics</h3>
                            <p>Monitor delivery performance and optimize operations.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="workflow" className="ai-workflow">
                <div className="container">
                    <div className="section-header" style={{ textAlign: 'center', marginBottom: '6rem' }}>
                        <h2 style={{ fontSize: '38px', fontWeight: 800, marginBottom: '12px', color: '#0f172a', fontFamily: 'Poppins' }}>
                            How SwiftTrack <span style={{ color: '#f97316' }}>Works</span>
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '18px' }}>Seamless end-to-end logistics processing tracked in real time</p>
                    </div>

                    <div className="wf-container">
                        <div className="wf-line"></div>
                        <div className="wf-line-progress"></div>

                        <div className="wf-step-alt revealed">
                            <div className="wf-icon-box">📦</div>
                            <div className="wf-content">
                                <h4>1. Package Creation</h4>
                                <p>Merchant schedules shipment and generates tracking label with optimized hub-to-hub routing directly from the portal before the truck even starts.</p>
                            </div>
                            <div className="wf-visual">
                                <div className="wf-glass-card" style={{ textAlign: 'center' }}>
                                    <div className="wfv-bar-bg"><div className="wfv-bar-fill"></div></div>
                                    <div className="wfv-bar-bg" style={{ width: '70%' }}><div className="wfv-bar-fill" style={{ animationDelay: '0.5s' }}></div></div>
                                    <p style={{ color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace', letterSpacing: '1px', marginTop: '10px' }}>CALCULATING_OPTIMAL_PATH...</p>
                                </div>
                            </div>
                        </div>

                        <div className="wf-step-alt revealed">
                            <div className="wf-icon-box">🏭</div>
                            <div className="wf-content">
                                <h4>2. Hub Processing</h4>
                                <p>The shipment is securely scanned via barcode and routed to the correct staging area within the central hub, continuously updating the cloud ledger.</p>
                            </div>
                            <div className="wf-visual">
                                <div className="wf-glass-card" style={{ display: 'flex', gap: '15px', flexDirection: 'column', alignItems: 'center' }}>
                                    <div className="wfv-scanner"></div>
                                    <div style={{ fontSize: '48px', color: '#cbd5e1' }}>||| | || |||</div>
                                    <div style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>AWAITING SCAN</div>
                                </div>
                            </div>
                        </div>

                        <div className="wf-step-alt revealed">
                            <div className="wf-icon-box">⚡</div>
                            <div className="wf-content">
                                <h4>3. Smart Dispatch</h4>
                                <p>Our algorithm determines the most efficient path and instantly dispatches a delivery agent for the final package drop-off to the exact location.</p>
                            </div>
                            <div className="wf-visual">
                                <div className="wf-glass-card">
                                    <div className="wfv-radar"></div>
                                    <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace', marginTop: '15px' }}>DISPATCH_AGENT_FOUND</p>
                                </div>
                            </div>
                        </div>

                        <div className="wf-step-alt revealed">
                            <div className="wf-icon-box">✓</div>
                            <div className="wf-content">
                                <h4>4. Verified Success</h4>
                                <p>The customer receives the package safely. Agents capture physical signatures or upload photo proof securely straight from the SwiftTrack app.</p>
                            </div>
                            <div className="wf-visual">
                                <div className="wf-glass-card" style={{ textAlign: 'center', padding: '50px 0' }}>
                                    <div style={{ fontSize: '40px', color: '#22c55e', background: '#dcfce7', width: '70px', height: '70px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', boxShadow: '0 10px 20px rgba(34,197,94,0.2)' }}>✓</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Testimonials */}
            <section className="testi-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Trusted by Logistics Teams</h2>
                        <p>Companies rely on SwiftTrack to streamline delivery operations and monitor logistics in real time.</p>
                    </div>

                    <div className="testi-row">
                        <div className="testi-card">
                            <p className="content-txt">SwiftTrack helped us streamline delivery operations and track shipments efficiently.</p>
                            <div className="author-box">
                                <img src="https://ui-avatars.com/api/?name=Karthik+Menon&background=f97316&color=fff" className="author-img" alt="Karthik Menon" />
                                <div className="author-info">
                                    <h5>Karthik Menon</h5>
                                    <p>Operations Manager</p>
                                </div>
                            </div>
                        </div>

                        <div className="testi-card">
                            <p className="content-txt">The hub management tools in SwiftTrack allow us to coordinate deliveries with complete visibility.</p>
                            <div className="author-box">
                                <img src="https://ui-avatars.com/api/?name=Divya+Rao&background=0284c7&color=fff" className="author-img" alt="Divya Rao" />
                                <div className="author-info">
                                    <h5>Divya Rao</h5>
                                    <p>Hub Manager — Chennai</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="custom-cta-wrapper">
                <div className="container">
                    <div className="cta-header">
                        <h2>Start Managing Your Logistics Operations with SwiftTrack</h2>
                        <p>Built for merchants, hub managers and delivery agents to track shipments, dispatch deliveries and optimize logistics operations</p>
                    </div>

                    <div className="cta-orange-block">
                        <h3 className="cta-block-title">Optimize Your Delivery Network with SwiftTrack</h3>
                        <p className="cta-block-desc">Track shipments, dispatch delivery agents, and manage logistics hubs from one unified logistics platform</p>
                        <div className="cta-actions">
                            <button className="cta-btn-white" onClick={() => navigate('/login')} style={{ border: 'none', cursor: 'pointer' }}>Access SwiftTrack</button>
                            <button className="cta-btn-white" onClick={() => navigate('/register')} style={{ border: 'none', cursor: 'pointer' }}>Schedule Demo</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer>
                <div className="container">
                    <div className="f-grid">
                        <div className="f-col">
                            <a href="#" className="logo">
                                <div className="logo-icon">🚚</div>
                                <span>SwiftTrack</span>
                            </a>
                            <p className="f-desc">Smart logistics dispatch and delivery tracking platform built for merchants, hub managers, and delivery teams.</p>
                        </div>
                        <div className="f-col">
                            <h4>Company</h4>
                            <ul className="f-links">
                                <li><a href="#">About SwiftTrack</a></li>
                                <li><a href="#">Contact</a></li>
                                <li><a href="#">Careers</a></li>
                                <li><a href="#">Privacy Policy</a></li>
                            </ul>
                        </div>
                        <div className="f-col">
                            <h4>Platform</h4>
                            <ul className="f-links">
                                <li><a href="#">Merchant Dashboard</a></li>
                                <li><a href="#">Hub Manager Tools</a></li>
                                <li><a href="#">Delivery Agent Portal</a></li>
                                <li><a href="#">Admin Panel</a></li>
                            </ul>
                        </div>
                        <div className="f-col">
                            <h4>Logistics</h4>
                            <ul className="f-links">
                                <li><a href="#">Track Shipment</a></li>
                                <li><a href="#">Dispatch Management</a></li>
                                <li><a href="#">Hub Monitoring</a></li>
                                <li><a href="#">Delivery Analytics</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="f-bottom">
                        <p>© 2026 SWIFTTRACK. ALL RIGHTS RESERVED.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}