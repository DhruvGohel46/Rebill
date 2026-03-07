from flask import Blueprint, request, jsonify
from models import db, Worker, Advance, SalaryPayment, Attendance
from sqlalchemy import func, extract
from services.worker_service import WorkerService
from datetime import datetime, date

workers_bp = Blueprint('workers', __name__)

@workers_bp.route('/api/workers', methods=['GET'])
def get_workers():
    workers = WorkerService.get_all_workers()
    result = []
    
    # Get today's attendance map
    attendance_map = WorkerService.get_today_attendance()
    
    # Calculate Salary Cycle Period
    from models import Settings
    salary_day_setting = Settings.query.get('salary_day')
    salary_day = int(salary_day_setting.value) if salary_day_setting else 1
    
    today = date.today()
    if today.day >= salary_day:
        # Current cycle: This month's salary_day to Next month's salary_day - 1
        start_date = date(today.year, today.month, salary_day)
        # End date is just for query, we can query > start_date
        next_month = today.month + 1 if today.month < 12 else 1
        next_year = today.year if today.month < 12 else today.year + 1
        end_date = date(next_year, next_month, salary_day) # up to next start
    else:
        # Current cycle: Previous month's salary_day to This month's salary_day - 1
        prev_month = today.month - 1 if today.month > 1 else 12
        prev_year = today.year if today.month > 1 else today.year - 1
        start_date = date(prev_year, prev_month, salary_day)
        end_date = date(today.year, today.month, salary_day) # up to today's start

    # Get advances for this period
    # Note: using end_date as inclusive/exclusive might vary, let's assume get_advances_sum_map handles inclusive
    # We want up to BEFORE the next cycle starts.
    # Actually, pass end_date - 1 day to be precise for inclusive filter
    from datetime import timedelta
    inclusive_end_date = end_date - timedelta(days=1)
    
    advances_map = WorkerService.get_advances_sum_map(start_date, inclusive_end_date)
    
    for w in workers:
        result.append({
            'worker_id': w.worker_id,
            'name': w.name,
            'role': w.role,
            'salary': w.salary,
            'phone': w.phone,
            'photo': w.photo,
            'status': w.status,
            'today_attendance': attendance_map.get(w.worker_id, 'Not Marked'),
            'current_advance': advances_map.get(w.worker_id, 0.0),
            'cycle_start': start_date.isoformat(),
            'cycle_end': inclusive_end_date.isoformat()
        })
    return jsonify(result)

@workers_bp.route('/api/workers', methods=['POST'])
def create_worker():
    data = request.json
    try:
        worker = WorkerService.create_worker(data)
        return jsonify({'success': True, 'worker_id': worker.worker_id}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@workers_bp.route('/api/workers/<worker_id>', methods=['GET'])
def get_worker(worker_id):
    worker = WorkerService.get_worker(worker_id)
    if not worker:
        return jsonify({'success': False, 'message': 'Worker not found'}), 404
    
    return jsonify({
        'worker_id': worker.worker_id,
        'name': worker.name,
        'phone': worker.phone,
        'email': worker.email,
        'role': worker.role,
        'salary': worker.salary,
        'join_date': worker.join_date.isoformat() if worker.join_date else None,
        'status': worker.status,
        'photo': worker.photo
    })

@workers_bp.route('/api/workers/<worker_id>', methods=['PUT'])
def update_worker(worker_id):
    data = request.json
    worker = WorkerService.update_worker(worker_id, data)
    if not worker:
        return jsonify({'success': False, 'message': 'Worker not found'}), 404
    return jsonify({'success': True})

@workers_bp.route('/api/workers/<worker_id>', methods=['DELETE'])
def delete_worker(worker_id):
    success = WorkerService.soft_delete_worker(worker_id)
    if not success:
        return jsonify({'success': False, 'message': 'Worker not found'}), 404
    return jsonify({'success': True})

# ADVANCES
@workers_bp.route('/api/workers/<worker_id>/advance', methods=['POST'])
def add_advance(worker_id):
    data = request.json
    amount = float(data.get('amount', 0))
    reason = data.get('reason', '')
    
    advance = WorkerService.add_advance(worker_id, amount, reason)
    return jsonify({'success': True, 'advance_id': advance.advance_id})

@workers_bp.route('/api/workers/<worker_id>/advances', methods=['GET'])
def get_advances(worker_id):
    advances = WorkerService.get_advances(worker_id)
    return jsonify([{
        'advance_id': a.advance_id,
        'amount': a.amount,
        'reason': a.reason,
        'date': a.date.isoformat()
    } for a in advances])

# SALARY
@workers_bp.route('/api/workers/<worker_id>/salary-history', methods=['GET'])
def get_salary_history(worker_id):
    history = WorkerService.get_salary_history(worker_id)
    return jsonify([{
        'payment_id': p.payment_id,
        'month': p.month,
        'year': p.year,
        'base_salary': p.base_salary,
        'advance_deduction': p.advance_deduction,
        'final_salary': p.final_salary,
        'paid': p.paid,
        'paid_date': p.paid_date.isoformat() if p.paid_date else None
    } for p in history])

@workers_bp.route('/api/workers/<worker_id>/generate-salary', methods=['POST'])
def generate_salary(worker_id):
    data = request.json
    month = data.get('month', date.today().month)
    year = data.get('year', date.today().year)
    
    payment = WorkerService.generate_salary(worker_id, month, year)
    if not payment:
        return jsonify({'success': False, 'message': 'Worker not found'}), 404
        
    return jsonify({
        'success': True,
        'payment': {
            'payment_id': payment.payment_id,
            'base_salary': payment.base_salary,
            'advance_deduction': payment.advance_deduction,
            'final_salary': payment.final_salary
        }
    })

@workers_bp.route('/api/salary/<payment_id>/pay', methods=['POST'])
def mark_salary_paid(payment_id):
    success = WorkerService.mark_salary_paid(payment_id)
    return jsonify({'success': success})

@workers_bp.route('/api/workers/salary/status', methods=['GET'])
def check_salary_status():
    try:
        month = request.args.get('month', type=int, default=date.today().month)
        year = request.args.get('year', type=int, default=date.today().year)
        
        status = WorkerService.check_salary_status(month, year)
        return jsonify(status)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# STATS
@workers_bp.route('/api/workers/stats', methods=['GET'])
def get_worker_stats():
    workers = WorkerService.get_all_workers()
    total_workers = len(workers)
    active_workers = len([w for w in workers if w.status == 'active'])
    
    # Calculate total salary (sum of active workers' salaries)
    total_salary = sum(w.salary for w in workers if w.status == 'active' and w.salary)

    # Create set of active worker IDs for fast lookup
    active_worker_ids = {w.worker_id for w in workers}
    
    # Calculate Total Advances for CURRENT MONTH (Active Workers Only)
    today = date.today()
    total_advances = db.session.query(func.sum(Advance.amount)).join(Worker).filter(
        Worker.status == 'active',
        extract('month', Advance.date) == today.month,
        extract('year', Advance.date) == today.year
    ).scalar() or 0.0

    net_payable = total_salary - total_advances
    
    # Get today's attendance
    today_attendance = WorkerService.get_today_attendance()
    # Only count present if worker is active
    present_today = len([
        status for w_id, status in today_attendance.items() 
        if status == 'Present' and w_id in active_worker_ids
    ])
    
    return jsonify({
        'totalWorkers': total_workers,
        'activeWorkers': active_workers,
        'presentToday': present_today,
        'totalSalary': float(total_salary),
        'netPayable': float(net_payable)
    })

# ATTENDANCE
@workers_bp.route('/api/workers/<worker_id>/attendance', methods=['GET'])
def get_worker_attendance(worker_id):
    history = WorkerService.get_attendance_history(worker_id)
    return jsonify([{
        'attendance_id': a.attendance_id,
        'date': a.date.isoformat(),
        'status': a.status,
        'check_in': a.check_in.strftime('%H:%M') if a.check_in else None,
        'check_out': a.check_out.strftime('%H:%M') if a.check_out else None
    } for a in history])

@workers_bp.route('/api/workers/<worker_id>/attendance', methods=['POST'])
def mark_attendance(worker_id):
    data = request.json
    status = data.get('status', 'Present')
    # Optional time tracking
    check_in = datetime.strptime(data['check_in'], '%H:%M').time() if data.get('check_in') else None
    check_out = datetime.strptime(data['check_out'], '%H:%M').time() if data.get('check_out') else None
    
    entry = WorkerService.record_attendance(worker_id, status, check_in, check_out)
    return jsonify({'success': True, 'status': entry.status})

@workers_bp.route('/api/workers/<worker_id>/attendance', methods=['PUT'])
def update_attendance(worker_id):
    """Update attendance record (e.g., for check-out)"""
    data = request.json
    date_str = data.get('date', date.today().isoformat())
    check_out = datetime.strptime(data['check_out'], '%H:%M').time() if data.get('check_out') else None
    
    try:
        # Find today's attendance record
        attendance = Attendance.query.filter_by(
            worker_id=worker_id,
            date=datetime.strptime(date_str, '%Y-%m-%d').date()
        ).first()
        
        if not attendance:
            return jsonify({'success': False, 'message': 'Attendance record not found'}), 404
        
        # Update check-out time
        attendance.check_out = check_out
        attendance.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'check_out': check_out.strftime('%H:%M') if check_out else None
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400

@workers_bp.route('/api/workers/attendance/bulk', methods=['POST'])
def bulk_attendance():
    """Mark all active workers as Present"""
    workers = WorkerService.get_all_workers()
    ids = [w.worker_id for w in workers]
    count = WorkerService.bulk_mark_present(ids)
    return jsonify({'success': True, 'marked_count': count})

@workers_bp.route('/api/workers/attendance/status', methods=['GET'])
def check_attendance_status():
    """Check if attendance is marked for today"""
    is_marked = WorkerService.check_todays_attendance_status()
    return jsonify({'is_marked': is_marked})
