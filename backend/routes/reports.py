from flask import Blueprint, request, jsonify, send_file
from services.db_service import DatabaseService
from services.excel_service import ExcelService
from services.excel_xlsx_service import ExcelXLSXService
from services.summary_service import SummaryService
from error_handler import safe_route, ValidationError, NotFoundError
import os
import logging
from datetime import date

logger = logging.getLogger(__name__)

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")
db = DatabaseService()
excel_service = ExcelService()
excel_xlsx_service = ExcelXLSXService()
summary_service = SummaryService(db)


# ─────────────────────────────────────────────────────────────────────────────
# 1. DAILY SALES REPORT (.xlsx)
# ─────────────────────────────────────────────────────────────────────────────
@reports_bp.route("/excel/today", methods=["GET"])
@reports_bp.route("/excel/daily", methods=["GET"])
@safe_route
def export_daily_sales_excel():
    """
    1. Daily Sales Report
    Detailed breakdown of items sold, summaries, and profits for a specific date.
    Sheets: Summary, Item-Wise Breakdown, Bill Log
    """
    target_date_str = request.args.get("date")
    filepath = excel_xlsx_service.export_daily_sales_report(target_date_str)

    if not filepath or not os.path.exists(filepath):
        raise Exception("Failed to generate Daily Sales Report")

    filename = os.path.basename(filepath)
    return send_file(
        filepath,
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


# ─────────────────────────────────────────────────────────────────────────────
# 2. WEEKLY SALES SUMMARY (.xlsx)
# ─────────────────────────────────────────────────────────────────────────────
@reports_bp.route("/excel/weekly", methods=["GET"])
@safe_route
def export_weekly_sales_excel():
    """
    2. Weekly Sales Summary
    Aggregated product overview and revenues from Monday to Sunday.
    Sheets: Week Overview, Product Overview
    """
    date_param = request.args.get("date")
    filepath = excel_xlsx_service.export_weekly_sales_summary(date_param)

    if not filepath or not os.path.exists(filepath):
        raise Exception("Failed to generate Weekly Sales Summary")

    filename = os.path.basename(filepath)
    return send_file(
        filepath,
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


# ─────────────────────────────────────────────────────────────────────────────
# 3. MONTHLY SALES SUMMARY (.xlsx)
# ─────────────────────────────────────────────────────────────────────────────
@reports_bp.route("/excel/monthly", methods=["GET"])
@safe_route
def export_monthly_sales_excel():
    """
    3. Monthly Sales Summary
    Monthly product-wise totals and overall gross sales report.
    Sheets: Month Overview, Daily Breakdown, Product-Wise Totals
    """
    month = request.args.get("month", type=int) or date.today().month
    year = request.args.get("year", type=int) or date.today().year

    if not (1 <= month <= 12):
        raise ValidationError("Invalid month (must be 1-12)", code="INVALID_MONTH")

    filepath = excel_xlsx_service.export_monthly_sales_summary(month, year)

    if not filepath or not os.path.exists(filepath):
        raise Exception("Failed to generate Monthly Sales Summary")

    filename = os.path.basename(filepath)
    return send_file(
        filepath,
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


# ─────────────────────────────────────────────────────────────────────────────
# 4. WEEKLY EXPENSE REPORT (.xlsx)
# ─────────────────────────────────────────────────────────────────────────────
@reports_bp.route("/excel/expenses/weekly", methods=["GET"])
@safe_route
def export_weekly_expense_excel():
    """
    4. Weekly Expense Report
    Categorized business outflows and details recorded for the current week.
    Single sheet: Table A Category Summary, Table B Full Ledger
    """
    date_param = request.args.get("date")
    filepath = excel_xlsx_service.export_weekly_expense_report(date_param)

    if not filepath or not os.path.exists(filepath):
        raise Exception("Failed to generate Weekly Expense Report")

    filename = os.path.basename(filepath)
    return send_file(
        filepath,
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


# ─────────────────────────────────────────────────────────────────────────────
# 5. MONTHLY EXPENSE REPORT (.xlsx)
# ─────────────────────────────────────────────────────────────────────────────
@reports_bp.route("/excel/expenses/monthly", methods=["GET"])
@safe_route
def export_monthly_expense_excel():
    """
    5. Monthly Expense Report
    Detailed monthly accounting report for utility, supplier and operational costs.
    Sheets: Category Summary, Vendor Breakdown, Full Ledger
    """
    month = request.args.get("month", type=int) or date.today().month
    year = request.args.get("year", type=int) or date.today().year

    if not (1 <= month <= 12):
        raise ValidationError("Invalid month (must be 1-12)", code="INVALID_MONTH")

    filepath = excel_xlsx_service.export_monthly_expense_report(month, year)

    if not filepath or not os.path.exists(filepath):
        raise Exception("Failed to generate Monthly Expense Report")

    filename = os.path.basename(filepath)
    return send_file(
        filepath,
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


# ─────────────────────────────────────────────────────────────────────────────
# 6. YEARLY EXPENSE AUDIT (.xlsx)
# ─────────────────────────────────────────────────────────────────────────────
@reports_bp.route("/excel/expenses/yearly", methods=["GET"])
@reports_bp.route("/excel/yearly-expenses", methods=["GET"])
@safe_route
def export_yearly_expense_excel():
    """
    6. Yearly Expense Audit
    Year-to-date business expenses breakdown and category summaries.
    Sheets: Year Overview, Category Breakdown (Year Pivot), Full Ledger
    """
    year = request.args.get("year", type=int) or date.today().year
    filepath = excel_xlsx_service.export_yearly_expense_audit(year)

    if not filepath or not os.path.exists(filepath):
        raise Exception("Failed to generate Yearly Expense Audit")

    filename = os.path.basename(filepath)
    return send_file(
        filepath,
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


# ─────────────────────────────────────────────────────────────────────────────
# 7. MASTER FINANCIAL SHEET (.xlsx)
# ─────────────────────────────────────────────────────────────────────────────
@reports_bp.route("/excel/master-financial", methods=["GET"])
@safe_route
def export_master_financial_excel():
    """
    7. Master Financial Sheet (Combined Sales & Expense Yearly Audit)
    Sheets:
      1. Executive Summary (KPIs, Combined month-by-month table)
      2. Sales Detail (Year)
      3. Expense Detail (Year Pivot)
      4. Payroll Summary
      5. Full Transaction Log (Unified Chronological with Running Balance)
    """
    year = request.args.get("year", type=int) or date.today().year
    filepath = excel_xlsx_service.export_master_financial_sheet(year)

    if not filepath or not os.path.exists(filepath):
        raise Exception("Failed to generate Master Financial Sheet")

    filename = os.path.basename(filepath)
    return send_file(
        filepath,
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


# ─────────────────────────────────────────────────────────────────────────────
# Legacy & Helper Endpoints
# ─────────────────────────────────────────────────────────────────────────────
@reports_bp.route("/excel/expenses", methods=["GET"])
@safe_route
def export_expenses_legacy():
    """Legacy expense router with range=week|month|year."""
    range_type = request.args.get("range", "week")
    today = date.today()

    if range_type == "month":
        month = request.args.get("month", type=int) or today.month
        year = request.args.get("year", type=int) or today.year
        return export_monthly_expense_excel()
    elif range_type == "year":
        year = request.args.get("year", type=int) or today.year
        return export_yearly_expense_excel()
    else:
        return export_weekly_expense_excel()


@reports_bp.route("/csv/today", methods=["GET"])
@safe_route
def export_today_csv():
    """Export today's bills data as CSV."""
    bills = db.get_todays_bills()
    if not bills:
        raise NotFoundError("No bills found for today", code="NO_BILLS_TODAY")

    today_str = date.today().strftime("%Y-%m-%d")
    temp_filepath = os.path.join(excel_service.export_dir, f"bills_{today_str}.csv")
    csv_content = excel_service.generate_bills_csv(bills)

    with open(temp_filepath, "w", encoding="utf-8") as f:
        f.write(csv_content)

    return send_file(
        temp_filepath,
        as_attachment=True,
        download_name=f"bills_{today_str}.csv",
        mimetype="text/csv",
    )


@reports_bp.route("/available-reports", methods=["GET"])
@safe_route
def get_available_reports():
    """Get list of all 7 available standardized Excel reports."""
    reports_info = {
        "standard_reports": [
            {
                "id": "daily_sales",
                "name": "Daily Sales Report",
                "endpoint": "/api/reports/excel/daily",
                "description": "Detailed breakdown of items sold, summaries, and profits for a specific date.",
                "sheets": ["Summary", "Item-Wise Breakdown", "Bill Log"]
            },
            {
                "id": "weekly_sales",
                "name": "Weekly Sales Summary",
                "endpoint": "/api/reports/excel/weekly",
                "description": "Aggregated product overview and revenues from Monday to Sunday.",
                "sheets": ["Week Overview", "Product Overview"]
            },
            {
                "id": "monthly_sales",
                "name": "Monthly Sales Summary",
                "endpoint": "/api/reports/excel/monthly",
                "description": "Monthly product-wise totals and overall gross sales report.",
                "sheets": ["Month Overview", "Daily Breakdown", "Product-Wise Totals"]
            },
            {
                "id": "weekly_expenses",
                "name": "Weekly Expense Report",
                "endpoint": "/api/reports/excel/expenses/weekly",
                "description": "Categorized business outflows and details recorded for the current week.",
                "sheets": ["Category Summary & Full Ledger"]
            },
            {
                "id": "monthly_expenses",
                "name": "Monthly Expense Report",
                "endpoint": "/api/reports/excel/expenses/monthly",
                "description": "Detailed monthly accounting report for utility, supplier and operational costs.",
                "sheets": ["Category Summary", "Vendor Breakdown", "Full Ledger"]
            },
            {
                "id": "yearly_expenses",
                "name": "Yearly Expense Audit",
                "endpoint": "/api/reports/excel/expenses/yearly",
                "description": "Year-to-date business expenses breakdown and category summaries.",
                "sheets": ["Year Overview", "Category Breakdown (Year Pivot)", "Full Ledger"]
            },
            {
                "id": "master_financial",
                "name": "Master Financial Sheet",
                "endpoint": "/api/reports/excel/master-financial",
                "description": "Combined Sales & Expense yearly audit with payroll and unified transaction ledger.",
                "sheets": ["Executive Summary", "Sales Detail (Year)", "Expense Detail (Year)", "Payroll Summary", "Transaction Log"]
            }
        ]
    }
    return jsonify({"success": True, "reports": reports_info}), 200
