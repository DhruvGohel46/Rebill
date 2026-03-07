/**
 * ============================================================================= 
 * MODAL CENTERING TEST - Simple test to verify reminder modal positioning
 * =============================================================================
 */

import React, { useState } from 'react';
import ReminderAlertModal from './ReminderAlertModal';

const ModalCenteringTest = () => {
    const [showModal, setShowModal] = useState(false);
    
    const testReminder = {
        id: 'test-centering',
        title: 'Modal Centering Test',
        description: 'This modal should appear perfectly centered on the screen, regardless of scroll position or screen size.',
        reminder_time: new Date().toISOString(),
        repeat_type: 'once'
    };

    return (
        <div style={{ 
            padding: '20px',
            minHeight: '200vh', // Make page scrollable to test centering
            background: 'linear-gradient(to bottom, #f0f0f0, #e0e0e0)'
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                marginTop: '100px'
            }}>
                <h2 style={{ color: '#333', textAlign: 'center' }}>
                    Reminder Modal Centering Test
                </h2>
                
                <p style={{ color: '#666', textAlign: 'center', maxWidth: '400px' }}>
                    Scroll down and click the button to test if the modal appears centered on the screen.
                    The modal should be centered regardless of scroll position.
                </p>
                
                <button
                    onClick={() => setShowModal(true)}
                    style={{
                        padding: '16px 32px',
                        background: 'linear-gradient(135deg, #FF6A00, #FF8A3D)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '18px',
                        fontWeight: '600',
                        boxShadow: '0 8px 24px rgba(255, 106, 0, 0.3)',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 12px 32px rgba(255, 106, 0, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 8px 24px rgba(255, 106, 0, 0.3)';
                    }}
                >
                    Test Modal Centering
                </button>
                
                <p style={{ color: '#999', fontSize: '14px' }}>
                    Scroll down to test centering from different positions
                </p>
            </div>
            
            {/* Add some content to make page scrollable */}
            <div style={{ marginTop: '100px', textAlign: 'center' }}>
                {[...Array(20)].map((_, i) => (
                    <p key={i} style={{ 
                        color: '#666', 
                        padding: '20px',
                        margin: '10px auto',
                        maxWidth: '600px',
                        background: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        Scroll Position Test Section {i + 1} - Click the test button from here to verify modal centering
                    </p>
                ))}
            </div>
            
            <ReminderAlertModal
                isOpen={showModal}
                reminder={testReminder}
                onMarkDone={() => {
                    console.log('Marked as done');
                    setShowModal(false);
                }}
                onSnooze={() => {
                    console.log('Snoozed');
                    setShowModal(false);
                }}
                onDismiss={() => {
                    console.log('Dismissed');
                    setShowModal(false);
                }}
                onClose={() => setShowModal(false)}
            />
        </div>
    );
};

export default ModalCenteringTest;
