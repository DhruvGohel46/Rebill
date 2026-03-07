"""
REMINDER API ROUTES - CRUD operations for reminder management
Production-ready REST API with comprehensive error handling
"""

from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from services.reminder_service import reminder_service
from models import db, Reminder
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
reminders_bp = Blueprint('reminders', __name__, url_prefix='/api/reminders')

def validate_reminder_data(data, is_update=False):
    """Validate reminder data"""
    errors = []
    
    if not is_update and not data.get('title'):
        errors.append('Title is required')
    
    if data.get('title') and len(data['title']) > 255:
        errors.append('Title must be less than 255 characters')
    
    if data.get('description') and len(data['description']) > 1000:
        errors.append('Description must be less than 1000 characters')
    
    if not is_update and not data.get('reminder_time'):
        errors.append('Reminder time is required')
    
    if data.get('reminder_time'):
        try:
            reminder_time = datetime.fromisoformat(data['reminder_time'].replace('Z', '+00:00'))
            if reminder_time <= datetime.utcnow():
                errors.append('Reminder time must be in the future')
        except ValueError:
            errors.append('Invalid reminder time format. Use ISO format (YYYY-MM-DDTHH:MM:SS)')
    
    if data.get('repeat_type') and data['repeat_type'] not in ['once', 'daily']:
        errors.append('Repeat type must be either "once" or "daily"')
    
    return errors

@reminders_bp.route('/', methods=['GET'])
def get_reminders():
    """Get all reminders with optional filtering"""
    try:
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
        repeat_type = request.args.get('repeat_type')
        
        reminders = reminder_service.get_reminders(include_inactive)
        
        # Filter by repeat type if specified
        if repeat_type:
            reminders = [r for r in reminders if r.repeat_type == repeat_type]
        
        # Convert to dict and add calculated fields
        result = []
        for reminder in reminders:
            reminder_dict = reminder.to_dict()
            
            # Add calculated fields
            reminder_dict['is_overdue'] = (
                reminder.reminder_time < datetime.utcnow() and 
                reminder.is_active and 
                (not reminder.last_triggered_at or 
                 reminder.last_triggered_at < reminder.reminder_time)
            )
            
            # Add next trigger time for active reminders
            if reminder.is_active:
                next_trigger = reminder_service._calculate_next_trigger_time(reminder)
                reminder_dict['next_trigger'] = next_trigger.isoformat() if next_trigger else None
            
            result.append(reminder_dict)
        
        return jsonify({
            'success': True,
            'data': result,
            'count': len(result)
        })
        
    except Exception as e:
        logger.error(f"Error getting reminders: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve reminders',
            'message': str(e)
        }), 500

@reminders_bp.route('/<reminder_id>', methods=['GET'])
def get_reminder(reminder_id):
    """Get a specific reminder by ID"""
    try:
        reminder = reminder_service.get_reminder_by_id(reminder_id)
        
        if not reminder:
            return jsonify({
                'success': False,
                'error': 'Reminder not found',
                'message': f'Reminder with ID {reminder_id} not found'
            }), 404
        
        reminder_dict = reminder.to_dict()
        
        # Add calculated fields
        reminder_dict['is_overdue'] = (
            reminder.reminder_time < datetime.utcnow() and 
            reminder.is_active and 
            (not reminder.last_triggered_at or 
             reminder.last_triggered_at < reminder.reminder_time)
        )
        
        return jsonify({
            'success': True,
            'data': reminder_dict
        })
        
    except Exception as e:
        logger.error(f"Error getting reminder {reminder_id}: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve reminder',
            'message': str(e)
        }), 500

@reminders_bp.route('/', methods=['POST'])
def create_reminder():
    """Create a new reminder"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Invalid request',
                'message': 'No data provided'
            }), 400
        
        # Validate data
        errors = validate_reminder_data(data)
        if errors:
            return jsonify({
                'success': False,
                'error': 'Validation failed',
                'message': errors
            }), 400
        
        # Create reminder
        reminder = reminder_service.create_reminder(data)
        
        return jsonify({
            'success': True,
            'data': reminder.to_dict(),
            'message': 'Reminder created successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating reminder: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to create reminder',
            'message': str(e)
        }), 500

@reminders_bp.route('/<reminder_id>', methods=['PUT'])
def update_reminder(reminder_id):
    """Update an existing reminder"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Invalid request',
                'message': 'No data provided'
            }), 400
        
        # Validate data
        errors = validate_reminder_data(data, is_update=True)
        if errors:
            return jsonify({
                'success': False,
                'error': 'Validation failed',
                'message': errors
            }), 400
        
        # Update reminder
        reminder = reminder_service.update_reminder(reminder_id, data)
        
        if not reminder:
            return jsonify({
                'success': False,
                'error': 'Reminder not found',
                'message': f'Reminder with ID {reminder_id} not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': reminder.to_dict(),
            'message': 'Reminder updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error updating reminder {reminder_id}: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to update reminder',
            'message': str(e)
        }), 500

@reminders_bp.route('/<reminder_id>', methods=['DELETE'])
def delete_reminder(reminder_id):
    """Delete a reminder"""
    try:
        success = reminder_service.delete_reminder(reminder_id)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Reminder not found',
                'message': f'Reminder with ID {reminder_id} not found'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Reminder deleted successfully'
        })
        
    except Exception as e:
        logger.error(f"Error deleting reminder {reminder_id}: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to delete reminder',
            'message': str(e)
        }), 500

@reminders_bp.route('/<reminder_id>/snooze', methods=['POST'])
def snooze_reminder(reminder_id):
    """Snooze a reminder for specified minutes"""
    try:
        data = request.get_json()
        
        if not data or 'minutes' not in data:
            return jsonify({
                'success': False,
                'error': 'Invalid request',
                'message': 'Minutes parameter is required'
            }), 400
        
        minutes = int(data['minutes'])
        if minutes <= 0 or minutes > 1440:  # Max 24 hours
            return jsonify({
                'success': False,
                'error': 'Invalid snooze duration',
                'message': 'Minutes must be between 1 and 1440'
            }), 400
        
        reminder = reminder_service.snooze_reminder(reminder_id, minutes)
        
        if not reminder:
            return jsonify({
                'success': False,
                'error': 'Reminder not found',
                'message': f'Reminder with ID {reminder_id} not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': reminder.to_dict(),
            'message': f'Reminder snoozed for {minutes} minutes'
        })
        
    except ValueError:
        return jsonify({
            'success': False,
            'error': 'Invalid snooze duration',
            'message': 'Minutes must be a valid integer'
        }), 400
    except Exception as e:
        logger.error(f"Error snoozing reminder {reminder_id}: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to snooze reminder',
            'message': str(e)
        }), 500

@reminders_bp.route('/<reminder_id>/complete', methods=['POST'])
def complete_reminder(reminder_id):
    """Mark a reminder as completed (deactivate one-time, reschedule recurring)"""
    try:
        reminder = reminder_service.get_reminder_by_id(reminder_id)
        
        if not reminder:
            return jsonify({
                'success': False,
                'error': 'Reminder not found',
                'message': f'Reminder with ID {reminder_id} not found'
            }), 404
        
        # Update last triggered time
        reminder.last_triggered_at = datetime.utcnow()
        reminder.updated_at = datetime.utcnow()
        
        # For one-time reminders, deactivate them
        if reminder.repeat_type == 'once':
            reminder.is_active = False
        else:
            # For recurring reminders, calculate next trigger time
            next_trigger = reminder_service._calculate_next_trigger_time(reminder)
            if next_trigger:
                reminder.reminder_time = next_trigger
        
        db.session.commit()
        
        # Reschedule if still active
        if reminder.is_active:
            reminder_service._schedule_reminder(reminder)
        else:
            # Remove from scheduler
            job_id = f"reminder_{reminder.id}"
            if reminder_service.scheduler.get_job(job_id):
                reminder_service.scheduler.remove_job(job_id)
            if reminder_id in reminder_service._active_reminders:
                del reminder_service._active_reminders[reminder_id]
        
        return jsonify({
            'success': True,
            'data': reminder.to_dict(),
            'message': 'Reminder marked as completed'
        })
        
    except Exception as e:
        logger.error(f"Error completing reminder {reminder_id}: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to complete reminder',
            'message': str(e)
        }), 500

@reminders_bp.route('/status', methods=['GET'])
def get_scheduler_status():
    """Get scheduler status and statistics"""
    try:
        status = reminder_service.get_scheduler_status()
        
        return jsonify({
            'success': True,
            'data': status
        })
        
    except Exception as e:
        logger.error(f"Error getting scheduler status: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get scheduler status',
            'message': str(e)
        }), 500

@reminders_bp.route('/test', methods=['POST'])
def test_reminder():
    """Test endpoint to create a quick test reminder"""
    try:
        data = request.get_json()
        
        # Create a test reminder 1 minute from now
        from datetime import timedelta
        test_time = datetime.utcnow() + timedelta(minutes=1)
        
        test_data = {
            'title': data.get('title', 'Test Reminder'),
            'description': data.get('description', 'This is a test reminder'),
            'reminder_time': test_time.isoformat(),
            'repeat_type': 'once'
        }
        
        reminder = reminder_service.create_reminder(test_data)
        
        return jsonify({
            'success': True,
            'data': reminder.to_dict(),
            'message': f'Test reminder created for {test_time.strftime("%H:%M:%S")}'
        })
        
    except Exception as e:
        logger.error(f"Error creating test reminder: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to create test reminder',
            'message': str(e)
        }), 500

# Error handlers
@reminders_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Not found',
        'message': 'The requested resource was not found'
    }), 404

@reminders_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'message': 'An unexpected error occurred'
    }), 500
