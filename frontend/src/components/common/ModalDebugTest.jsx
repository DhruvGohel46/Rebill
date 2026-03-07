/**
 * ============================================================================= 
 * DEBUG REMINDER MODAL - Standalone test for centering issues
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const DebugReminderModal = ({ isOpen, onClose }) => {
    const [modalPosition, setModalPosition] = useState({});

    useEffect(() => {
        if (isOpen) {
            // Log viewport and body info
            console.log('=== MODAL DEBUG INFO ===');
            console.log('Viewport dimensions:', {
                width: window.innerWidth,
                height: window.innerHeight,
                scrollX: window.scrollX,
                scrollY: window.scrollY
            });
            console.log('Body styles:', {
                position: getComputedStyle(document.body).position,
                transform: getComputedStyle(document.body).transform,
                overflow: getComputedStyle(document.body).overflow
            });
            console.log('Document element:', {
                scrollWidth: document.documentElement.scrollWidth,
                scrollHeight: document.documentElement.scrollHeight,
                clientWidth: document.documentElement.clientWidth,
                clientHeight: document.documentElement.clientHeight
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const modalContent = (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999999,
                backgroundColor: 'rgba(255, 0, 0, 0.3)', // Red background for debugging
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                boxSizing: 'border-box'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    position: 'relative',
                    width: '400px',
                    height: '300px',
                    backgroundColor: '#ffffff',
                    border: '3px solid #ff0000',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '20px',
                    padding: '20px',
                    boxSizing: 'border-box'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 style={{ margin: 0, color: '#000', fontSize: '24px' }}>
                    DEBUG MODAL
                </h2>
                <p style={{ margin: 0, color: '#666', textAlign: 'center' }}>
                    This modal should be perfectly centered.<br/>
                    Red background shows the full overlay.<br/>
                    White box should be in the center.
                </p>
                <div style={{ 
                    display: 'flex', 
                    gap: '10px',
                    fontSize: '12px',
                    color: '#999'
                }}>
                    <span>Viewport: {window.innerWidth}x{window.innerHeight}</span>
                    <span>Scroll: {window.scrollX},{window.scrollY}</span>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#ff0000',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    Close Debug Modal
                </button>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

// Test component
const ModalDebugTest = () => {
    const [showModal, setShowModal] = useState(false);
    const [showDebugModal, setShowDebugModal] = useState(false);

    return (
        <div style={{ 
            padding: '40px',
            minHeight: '200vh',
            background: 'linear-gradient(to bottom, #f0f0f0, #e0e0e0)'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ color: '#333', marginBottom: '20px' }}>
                    Modal Centering Debug Test
                </h1>
                
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '20px' }}>
                    <button
                        onClick={() => setShowModal(true)}
                        style={{
                            padding: '16px 32px',
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        Test Original Modal
                    </button>
                    
                    <button
                        onClick={() => setShowDebugModal(true)}
                        style={{
                            padding: '16px 32px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        Test Debug Modal (Red)
                    </button>
                </div>
                
                <p style={{ color: '#666', marginBottom: '40px' }}>
                    Scroll down and test both modals from different positions
                </p>
            </div>

            {/* Add content for scrolling */}
            {[...Array(10)].map((_, i) => (
                <div key={i} style={{
                    margin: '40px auto',
                    padding: '40px',
                    maxWidth: '600px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                }}>
                    <h3 style={{ color: '#333', marginBottom: '20px' }}>
                        Test Section {i + 1}
                    </h3>
                    <p style={{ color: '#666', lineHeight: '1.6' }}>
                        Scroll position: {i * 200}px from top<br/>
                        Test modals from this position to see if centering works correctly.
                    </p>
                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                            onClick={() => setShowModal(true)}
                            style={{
                                padding: '8px 16px',
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Test Modal
                        </button>
                        <button
                            onClick={() => setShowDebugModal(true)}
                            style={{
                                padding: '8px 16px',
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Debug Modal
                        </button>
                    </div>
                </div>
            ))}

            {/* Import and test the actual modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 999998,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        width: '400px',
                        height: '250px',
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: '20px',
                        padding: '30px',
                        border: '2px solid #007bff'
                    }}>
                        <h2 style={{ margin: 0, color: '#007bff' }}>
                            ORIGINAL MODAL TEST
                        </h2>
                        <p style={{ margin: 0, color: '#666', textAlign: 'center' }}>
                            This should also be centered<br/>
                            Check browser console for debug info
                        </p>
                        <button
                            onClick={() => setShowModal(false)}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Debug modal */}
            <DebugReminderModal 
                isOpen={showDebugModal} 
                onClose={() => setShowDebugModal(false)} 
            />
        </div>
    );
};

export default ModalDebugTest;
