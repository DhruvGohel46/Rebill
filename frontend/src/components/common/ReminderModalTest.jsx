/**
 * ============================================================================= 
 * REMINDER MODAL TEST - Quick test component to verify centering
 * =============================================================================
 */

import React, { useState } from 'react';
import ReminderAlertModal from './ReminderAlertModal';

const ReminderModalTest = () => {
    const [showModal, setShowModal] = useState(false);
    
    const testReminder = {
        id: 'test-123',
        title: 'Test Reminder',
        description: 'This is a test reminder to verify the modal is centered properly on the screen.',
        reminder_time: new Date().toISOString(),
        repeat_type: 'once'
    };

    return (
        <div style={{ padding: '20px' }}>
            <button
                onClick={() => setShowModal(true)}
                style={{
                    padding: '12px 24px',
                    background: '#FF6A00',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600'
                }}
            >
                Test Reminder Modal (Center Check)
            </button>
            
            <ReminderAlertModal
                isOpen={showModal}
                reminder={testReminder}
                onMarkDone={() => console.log('Marked as done')}
                onSnooze={() => console.log('Snoozed')}
                onDismiss={() => console.log('Dismissed')}
                onClose={() => setShowModal(false)}
            />
        </div>
    );
};

export default ReminderModalTest;
