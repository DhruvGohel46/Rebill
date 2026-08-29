import os
import json
import calendar
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy import func, extract

from config import Config
from models import db, Bill, Expense, Product, Category, Worker, Advance, SalaryPayment, Attendance
from services.excel_report_builder import ExcelReportBuilder


class ExcelXLSXService:
    """
    Excel export service producing publication-grade, multi-sheet .xlsx workbooks
    strictly adhering to the InfoOS Report Formats Spec.
    """

    def __init__(self, data_dir: str = None):
        self.data_dir = data_dir or Config.DATA_DIR
        self.export_dir = os.path.join(self.data_dir, "exports")
        os.makedirs(self.export_dir, exist_ok=True)
        self.builder = ExcelReportBuilder()

    def _parse_bill_items(self, items_json: Any) -> List[Dict]:
        """Safely parse JSON bill items."""
        if isinstance(items_json, list):
            return items_json
        if isinstance(items_json, str):
            try:
                return json.loads(items_json)
            except Exception:
                return []
        return []

    # ─────────────────────────────────────────────────────────────────────────
    # 1. DAILY SALES REPORT
    # ─────────────────────────────────────────────────────────────────────────
    def export_daily_sales_report(self, target_date_str: Optional[str] = None) -> str:
        """
        1. Daily Sales Report
        Sheet 1: Summary (Metrics, Payment Breakdown, Hourly Sales)
        Sheet 2: Item-Wise Breakdown (Qty, Price, Revenue, Cost, Profit)
        Sheet 3: Bill Log (All bills with Status & items summary)
        """
        today_date = date.today()
        if target_date_str:
            try:
                target_dt = datetime.strptime(target_date_str, "%Y-%m-%d").date()
            except Exception:
                target_dt = today_date
        else:
            target_dt = today_date

        date_str = target_dt.strftime("%Y-%m-%d")
        date_label = target_dt.strftime("%d-%b-%Y")

        wb = self.builder.create_workbook()

        # Query Bills for the target day
        bills = Bill.query.filter(func.date(Bill.created_at) == target_dt).order_by(Bill.id.asc()).all()
        # Query Expenses for the target day to compute true Net Profit
        expenses = Expense.query.filter(func.date(Expense.date) == target_dt).all()
        total_expenses = sum(e.amount for e in expenses)

        if not bills:
            ws_empty = wb.create_sheet(title="Summary")
            self.builder.write_empty_state_sheet(
                ws_empty,
                "Daily Sales Report",
                date_label,
                f"No sales recorded on {date_label}."
            )
            filepath = os.path.join(self.export_dir, self.builder.get_safe_filename("DailySales", date_str))
            wb.save(filepath)
            return filepath

        valid_bills = [b for b in bills if (b.status or "").upper() != "CANCELLED" and (b.status or "").upper() != "VOIDED"]
        total_sales = sum(b.total_amount for b in valid_bills)
        total_orders = len(valid_bills)
        avg_bill_val = (total_sales / total_orders) if total_orders > 0 else 0.0
        net_profit = total_sales - total_expenses

        # ── Sheet 1: Summary ──
        ws_sum = wb.create_sheet(title="Summary")
        self.builder.write_branded_header(ws_sum, "Daily Sales Report", date_label, num_columns=6)

        # Metric Cards
        metrics = [
            {"label": "Total Sales", "value": total_sales, "format": "currency"},
            {"label": "Total Orders", "value": total_orders, "format": "number"},
            {"label": "Net Profit", "value": net_profit, "format": "currency"},
            {"label": "Avg Bill Value", "value": avg_bill_val, "format": "currency"},
        ]
        next_row = self.builder.write_metric_cards(ws_sum, start_row=7, metrics=metrics, cols_per_card=2)

        # Payment Breakdown Table
        pay_totals = {}
        for b in valid_bills:
            method = (b.payment_method or "Cash").upper()
            pay_totals[method] = pay_totals.get(method, 0.0) + b.total_amount

        pay_data = []
        for method, amt in sorted(pay_totals.items(), key=lambda x: x[1], reverse=True):
            pct = (amt / total_sales) if total_sales > 0 else 0.0
            pay_data.append([method, amt, pct])

        pay_totals_row = ["TOTAL", total_sales, 1.0 if total_sales > 0 else 0.0]
        next_row = self.builder.write_table(
            ws_sum,
            start_row=next_row,
            headers=["Payment Method", "Amount", "% of Total"],
            data_rows=pay_data,
            col_formats=[None, self.builder.FMT_CURRENCY, self.builder.FMT_PERCENT],
            col_alignments=["left", "right", "right"],
            totals_row=pay_totals_row,
            section_title="Payment Method Breakdown",
            freeze_header=False
        )

        # Hourly Sales Table (full 24h breakdown)
        hourly_orders = {h: 0 for h in range(24)}
        hourly_rev = {h: 0.0 for h in range(24)}
        for b in valid_bills:
            if b.created_at:
                h = b.created_at.hour
                hourly_orders[h] += 1
                hourly_rev[h] += b.total_amount

        hourly_data = []
        for h in range(24):
            if hourly_orders[h] > 0 or (10 <= h <= 22):  # Focus on operating windows
                label = f"{h:02d}:00 – {h+1:02d}:00"
                hourly_data.append([label, hourly_orders[h], hourly_rev[h]])

        hourly_totals_row = ["TOTAL", total_orders, total_sales]
        self.builder.write_table(
            ws_sum,
            start_row=next_row,
            headers=["Hour Window", "Orders", "Revenue"],
            data_rows=hourly_data,
            col_formats=[None, self.builder.FMT_INTEGER, self.builder.FMT_CURRENCY],
            col_alignments=["left", "center", "right"],
            totals_row=hourly_totals_row,
            section_title="Hourly Sales Distribution",
            freeze_header=False
        )
        self.builder.autofit_column_widths(ws_sum)

        # ── Sheet 2: Item-Wise Breakdown ──
        ws_items = wb.create_sheet(title="Item-Wise Breakdown")
        self.builder.write_branded_header(ws_items, "Daily Item-Wise Breakdown", date_label, num_columns=7)

        # Aggregate products
        prod_agg = {}
        for b in valid_bills:
            items = self._parse_bill_items(b.items)
            for itm in items:
                name = itm.get("name") or itm.get("product_name") or "Unknown Item"
                qty = float(itm.get("quantity") or itm.get("qty") or 1)
                price = float(itm.get("price") or itm.get("unit_price") or 0)
                subtotal = float(itm.get("subtotal") or (qty * price))
                cat = itm.get("category") or "General"
                cog = float(itm.get("cost_price") or 0) * qty

                if name not in prod_agg:
                    prod_agg[name] = {
                        "name": name,
                        "category": cat,
                        "qty": 0.0,
                        "unit_price": price,
                        "revenue": 0.0,
                        "cog": 0.0
                    }
                prod_agg[name]["qty"] += qty
                prod_agg[name]["revenue"] += subtotal
                prod_agg[name]["cog"] += cog

        item_rows = []
        tot_qty = 0.0
        tot_rev = 0.0
        tot_cog = 0.0
        tot_profit = 0.0

        for itm in sorted(prod_agg.values(), key=lambda x: x["revenue"], reverse=True):
            profit = itm["revenue"] - itm["cog"]
            item_rows.append([
                itm["name"],
                itm["category"],
                itm["qty"],
                itm["unit_price"],
                itm["revenue"],
                itm["cog"],
                profit
            ])
            tot_qty += itm["qty"]
            tot_rev += itm["revenue"]
            tot_cog += itm["cog"]
            tot_profit += profit

        item_totals_row = ["TOTAL", "", tot_qty, None, tot_rev, tot_cog, tot_profit]
        self.builder.write_table(
            ws_items,
            start_row=6,
            headers=["Product Name", "Category", "Qty Sold", "Unit Price", "Total Revenue", "Cost of Goods", "Item Profit"],
            data_rows=item_rows,
            col_formats=[None, None, self.builder.FMT_INTEGER, self.builder.FMT_CURRENCY, self.builder.FMT_CURRENCY, self.builder.FMT_CURRENCY, self.builder.FMT_CURRENCY],
            col_alignments=["left", "left", "center", "right", "right", "right", "right"],
            totals_row=item_totals_row
        )
        self.builder.autofit_column_widths(ws_items)

        # ── Sheet 3: Bill Log ──
        ws_bills = wb.create_sheet(title="Bill Log")
        self.builder.write_branded_header(ws_bills, "Daily Bill Transaction Log", date_label, num_columns=8)

        bill_rows = []
        for b in bills:
            b_time = b.created_at.strftime("%I:%M %p") if b.created_at else ""
            b_items = self._parse_bill_items(b.items)
            items_summary = ", ".join([f"{i.get('name', 'Item')} (x{i.get('quantity', 1)})" for i in b_items])
            if len(items_summary) > 60:
                items_summary = items_summary[:57] + "..."

            bill_rows.append([
                b.bill_no,
                b.today_token or "-",
                b_time,
                (b.order_type or "Dine-In").title(),
                (b.payment_method or "Cash").upper(),
                items_summary,
                b.total_amount,
                (b.status or "CONFIRMED").upper()
            ])

        bill_totals_row = ["TOTAL", "", "", "", "", f"{len(bills)} Bills", total_sales, ""]
        self.builder.write_table(
            ws_bills,
            start_row=6,
            headers=["Bill No", "Token", "Time", "Order Type", "Payment Method", "Items Summary", "Total Amount", "Status"],
            data_rows=bill_rows,
            col_formats=[self.builder.FMT_INTEGER, None, None, None, None, None, self.builder.FMT_CURRENCY, None],
            col_alignments=["center", "center", "center", "center", "center", "left", "right", "center"],
            totals_row=bill_totals_row
        )
        self.builder.autofit_column_widths(ws_bills)

        filename = self.builder.get_safe_filename("DailySales", date_str)
        filepath = os.path.join(self.export_dir, filename)
        wb.save(filepath)
        return filepath

    # ─────────────────────────────────────────────────────────────────────────
    # 2. WEEKLY SALES SUMMARY
    # ─────────────────────────────────────────────────────────────────────────
    def export_weekly_sales_summary(self, week_date_str: Optional[str] = None) -> str:
        """
        2. Weekly Sales Summary (Monday to Sunday)
        Sheet 1: Week Overview (Metrics, Best/Worst day, Day-by-day table)
        Sheet 2: Product Overview (Units Sold, Revenue, % Share, Trend vs Prior Week)
        """
        today_date = date.today()
        if week_date_str:
            try:
                base_dt = datetime.strptime(week_date_str, "%Y-%m-%d").date()
            except Exception:
                base_dt = today_date
        else:
            base_dt = today_date

        start_week = base_dt - timedelta(days=base_dt.weekday())  # Monday
        end_week = start_week + timedelta(days=6)                 # Sunday
        prev_start_week = start_week - timedelta(days=7)
        prev_end_week = start_week - timedelta(days=1)

        range_label = f"{start_week.strftime('%d-%b-%Y')} to {end_week.strftime('%d-%b-%Y')}"
        range_code = f"{start_week.strftime('%Y%m%d')}_{end_week.strftime('%Y%m%d')}"

        wb = self.builder.create_workbook()

        # Query bills for current week
        week_bills = Bill.query.filter(
            func.date(Bill.created_at) >= start_week,
            func.date(Bill.created_at) <= end_week,
            Bill.status.notin_(["CANCELLED", "VOIDED"])
        ).all()

        # Query bills for prior week (for trend computation)
        prior_week_bills = Bill.query.filter(
            func.date(Bill.created_at) >= prev_start_week,
            func.date(Bill.created_at) <= prev_end_week,
            Bill.status.notin_(["CANCELLED", "VOIDED"])
        ).all()

        # Query expenses for week
        week_expenses = Expense.query.filter(
            func.date(Expense.date) >= start_week,
            func.date(Expense.date) <= end_week
        ).all()
        total_exp = sum(e.amount for e in week_expenses)

        # ── Sheet 1: Week Overview ──
        ws_overview = wb.create_sheet(title="Week Overview")
        self.builder.write_branded_header(ws_overview, "Weekly Sales Summary", range_label, num_columns=5)

        total_sales = sum(b.total_amount for b in week_bills)
        total_orders = len(week_bills)
        net_profit = total_sales - total_exp
        avg_daily = total_sales / 7.0

        # Compute Day-by-Day aggregation
        day_map = {start_week + timedelta(days=i): {"orders": 0, "revenue": 0.0, "expenses": 0.0} for i in range(7)}
        for b in week_bills:
            b_date = b.created_at.date() if b.created_at else None
            if b_date in day_map:
                day_map[b_date]["orders"] += 1
                day_map[b_date]["revenue"] += b.total_amount

        for e in week_expenses:
            e_date = e.date.date() if hasattr(e.date, "date") else e.date
            if e_date in day_map:
                day_map[e_date]["expenses"] += e.amount

        # Best / Worst Day
        best_day_name, best_day_rev = "N/A", 0.0
        worst_day_name, worst_day_rev = "N/A", 0.0
        sorted_days = sorted(day_map.items(), key=lambda x: x[1]["revenue"], reverse=True)
        if sorted_days and sorted_days[0][1]["revenue"] > 0:
            best_day_name = sorted_days[0][0].strftime("%A")
            best_day_rev = sorted_days[0][1]["revenue"]
            active_days = [d for d in sorted_days if d[1]["revenue"] > 0]
            worst_day_name = active_days[-1][0].strftime("%A")
            worst_day_rev = active_days[-1][1]["revenue"]

        metrics = [
            {"label": "Total Sales (Week)", "value": total_sales, "format": "currency"},
            {"label": "Total Orders", "value": total_orders, "format": "number"},
            {"label": "Net Profit", "value": net_profit, "format": "currency"},
            {"label": "Avg Daily Sales", "value": avg_daily, "format": "currency"},
            {"label": "Best Day", "value": f"{best_day_name} (₹{best_day_rev:,.0f})", "format": "text"},
            {"label": "Worst Day", "value": f"{worst_day_name} (₹{worst_day_rev:,.0f})", "format": "text"},
        ]
        next_row = self.builder.write_metric_cards(ws_overview, start_row=7, metrics=metrics, cols_per_card=2)

        day_rows = []
        for d_date, d_data in sorted(day_map.items()):
            d_profit = d_data["revenue"] - d_data["expenses"]
            day_rows.append([
                d_date.strftime("%d-%b-%Y"),
                d_date.strftime("%A"),
                d_data["orders"],
                d_data["revenue"],
                d_profit
            ])

        day_totals = ["TOTAL", "", total_orders, total_sales, net_profit]
        self.builder.write_table(
            ws_overview,
            start_row=next_row,
            headers=["Date", "Day of Week", "Orders", "Revenue", "Profit"],
            data_rows=day_rows,
            col_formats=[None, None, self.builder.FMT_INTEGER, self.builder.FMT_CURRENCY, self.builder.FMT_CURRENCY],
            col_alignments=["center", "left", "center", "right", "right"],
            totals_row=day_totals,
            section_title="Day-by-Day Revenue Breakdown"
        )
        self.builder.autofit_column_widths(ws_overview)

        # ── Sheet 2: Product Overview ──
        ws_prod = wb.create_sheet(title="Product Overview")
        self.builder.write_branded_header(ws_prod, "Weekly Product Performance", range_label, num_columns=6)

        # Aggregate current week products
        curr_prod = {}
        for b in week_bills:
            for itm in self._parse_bill_items(b.items):
                p_name = itm.get("name") or "Item"
                qty = float(itm.get("quantity") or 1)
                rev = float(itm.get("subtotal") or (qty * float(itm.get("price") or 0)))
                cat = itm.get("category") or "General"
                if p_name not in curr_prod:
                    curr_prod[p_name] = {"category": cat, "units": 0.0, "revenue": 0.0}
                curr_prod[p_name]["units"] += qty
                curr_prod[p_name]["revenue"] += rev

        # Aggregate prior week products
        prior_prod = {}
        for b in prior_week_bills:
            for itm in self._parse_bill_items(b.items):
                p_name = itm.get("name") or "Item"
                qty = float(itm.get("quantity") or 1)
                rev = float(itm.get("subtotal") or (qty * float(itm.get("price") or 0)))
                prior_prod[p_name] = prior_prod.get(p_name, 0.0) + rev

        prod_rows = []
        tot_units = 0.0
        for p_name, p_data in sorted(curr_prod.items(), key=lambda x: x[1]["revenue"], reverse=True):
            p_rev = p_data["revenue"]
            p_units = p_data["units"]
            share = (p_rev / total_sales) if total_sales > 0 else 0.0

            # Compute trend string
            prior_rev = prior_prod.get(p_name, 0.0)
            if prior_rev > 0:
                pct_change = ((p_rev - prior_rev) / prior_rev) * 100.0
                trend_str = f"▲ {pct_change:+.1f}%" if pct_change >= 0 else f"▼ {abs(pct_change):.1f}%"
            else:
                trend_str = "NEW"

            prod_rows.append([
                p_name,
                p_data["category"],
                p_units,
                p_rev,
                share,
                trend_str
            ])
            tot_units += p_units

        prod_totals = ["TOTAL", "", tot_units, total_sales, 1.0 if total_sales > 0 else 0.0, ""]
        self.builder.write_table(
            ws_prod,
            start_row=6,
            headers=["Product", "Category", "Units Sold (Week)", "Revenue (Week)", "% of Week's Revenue", "Trend vs. Prior Week"],
            data_rows=prod_rows,
            col_formats=[None, None, self.builder.FMT_INTEGER, self.builder.FMT_CURRENCY, self.builder.FMT_PERCENT, None],
            col_alignments=["left", "left", "center", "right", "right", "center"],
            totals_row=prod_totals
        )
        self.builder.autofit_column_widths(ws_prod)

        filename = self.builder.get_safe_filename("WeeklySales", range_code)
        filepath = os.path.join(self.export_dir, filename)
        wb.save(filepath)
        return filepath

    # ─────────────────────────────────────────────────────────────────────────
    # 3. MONTHLY SALES SUMMARY
    # ─────────────────────────────────────────────────────────────────────────
    def export_monthly_sales_summary(self, month: int, year: int) -> str:
        """
        3. Monthly Sales Summary
        Sheet 1: Month Overview (Gross Sales, Net Profit, Operating Days, Week rollup)
        Sheet 2: Daily Breakdown / Weekly Trend (Date, Orders, Revenue, Profit, Cumulative Revenue)
        Sheet 3: Product-Wise Totals (Product, Category, Units, Revenue, Profit, % Share)
        """
        _, last_day = calendar.monthrange(year, month)
        start_month = date(year, month, 1)
        end_month = date(year, month, last_day)
        month_label = f"{calendar.month_name[month]} {year}"
        date_code = f"{year}_{month:02d}"

        wb = self.builder.create_workbook()

        # Query Bills for month
        bills = Bill.query.filter(
            func.date(Bill.created_at) >= start_month,
            func.date(Bill.created_at) <= end_month,
            Bill.status.notin_(["CANCELLED", "VOIDED"])
        ).all()

        # Query Expenses for month
        expenses = Expense.query.filter(
            func.date(Expense.date) >= start_month,
            func.date(Expense.date) <= end_month
        ).all()
        total_exp = sum(e.amount for e in expenses)

        total_sales = sum(b.total_amount for b in bills)
        total_orders = len(bills)
        net_profit = total_sales - total_exp
        avg_bill = (total_sales / total_orders) if total_orders > 0 else 0.0

        # Unique operating days
        op_dates = set(b.created_at.date() for b in bills if b.created_at)
        op_days_count = len(op_dates)
        avg_daily = (total_sales / op_days_count) if op_days_count > 0 else 0.0

        # ── Sheet 1: Month Overview ──
        ws_overview = wb.create_sheet(title="Month Overview")
        self.builder.write_branded_header(ws_overview, "Monthly Sales Summary", month_label, num_columns=6)

        metrics = [
            {"label": "Gross Sales", "value": total_sales, "format": "currency"},
            {"label": "Net Profit", "value": net_profit, "format": "currency"},
            {"label": "Total Orders", "value": total_orders, "format": "number"},
            {"label": "Avg Bill Value", "value": avg_bill, "format": "currency"},
            {"label": "Operating Days", "value": op_days_count, "format": "number"},
            {"label": "Avg Daily Sales", "value": avg_daily, "format": "currency"},
        ]
        next_row = self.builder.write_metric_cards(ws_overview, start_row=7, metrics=metrics, cols_per_card=2)

        # Week-by-Week rollup within month
        week_rollups = {}
        for b in bills:
            if b.created_at:
                w_num = ((b.created_at.day - 1) // 7) + 1
                w_label = f"Week {w_num} (Days {((w_num-1)*7)+1}–{min(w_num*7, last_day)})"
                if w_label not in week_rollups:
                    week_rollups[w_label] = {"orders": 0, "revenue": 0.0, "exp": 0.0}
                week_rollups[w_label]["orders"] += 1
                week_rollups[w_label]["revenue"] += b.total_amount

        for e in expenses:
            e_dt = e.date.date() if hasattr(e.date, "date") else e.date
            if e_dt:
                w_num = ((e_dt.day - 1) // 7) + 1
                w_label = f"Week {w_num} (Days {((w_num-1)*7)+1}–{min(w_num*7, last_day)})"
                if w_label in week_rollups:
                    week_rollups[w_label]["exp"] += e.amount

        week_rows = []
        for w_label, w_data in sorted(week_rollups.items()):
            w_profit = w_data["revenue"] - w_data["exp"]
            week_rows.append([w_label, w_data["orders"], w_data["revenue"], w_profit])

        week_totals = ["TOTAL", total_orders, total_sales, net_profit]
        self.builder.write_table(
            ws_overview,
            start_row=next_row,
            headers=["Week Rollup", "Orders", "Revenue", "Profit"],
            data_rows=week_rows,
            col_formats=[None, self.builder.FMT_INTEGER, self.builder.FMT_CURRENCY, self.builder.FMT_CURRENCY],
            col_alignments=["left", "center", "right", "right"],
            totals_row=week_totals,
            section_title="Weekly Performance Rollup"
        )
        self.builder.autofit_column_widths(ws_overview)

        # ── Sheet 2: Daily Breakdown (Chart-Ready) ──
        ws_daily = wb.create_sheet(title="Daily Breakdown")
        self.builder.write_branded_header(ws_daily, "Monthly Daily Breakdown & Cumulative Trend", month_label, num_columns=5)

        daily_agg = {date(year, month, d): {"orders": 0, "rev": 0.0, "exp": 0.0} for d in range(1, last_day + 1)}
        for b in bills:
            if b.created_at and b.created_at.date() in daily_agg:
                daily_agg[b.created_at.date()]["orders"] += 1
                daily_agg[b.created_at.date()]["rev"] += b.total_amount
        for e in expenses:
            e_d = e.date.date() if hasattr(e.date, "date") else e.date
            if e_d in daily_agg:
                daily_agg[e_d]["exp"] += e.amount

        daily_rows = []
        cum_rev = 0.0
        for d_date, d_data in sorted(daily_agg.items()):
            cum_rev += d_data["rev"]
            d_profit = d_data["rev"] - d_data["exp"]
            daily_rows.append([
                d_date.strftime("%d-%b-%Y"),
                d_data["orders"],
                d_data["rev"],
                d_profit,
                cum_rev
            ])

        daily_totals = ["TOTAL", total_orders, total_sales, net_profit, total_sales]
        self.builder.write_table(
            ws_daily,
            start_row=6,
            headers=["Date", "Orders", "Revenue", "Profit", "Running Cumulative Revenue"],
            data_rows=daily_rows,
            col_formats=[None, self.builder.FMT_INTEGER, self.builder.FMT_CURRENCY, self.builder.FMT_CURRENCY, self.builder.FMT_CURRENCY],
            col_alignments=["center", "center", "right", "right", "right"],
            totals_row=daily_totals
        )
        self.builder.autofit_column_widths(ws_daily)

        # ── Sheet 3: Product-Wise Totals ──
        ws_prod = wb.create_sheet(title="Product-Wise Totals")
        self.builder.write_branded_header(ws_prod, "Monthly Product-Wise Sales", month_label, num_columns=6)

        prod_agg = {}
        for b in bills:
            for itm in self._parse_bill_items(b.items):
                p_name = itm.get("name") or "Product"
                qty = float(itm.get("quantity") or 1)
                rev = float(itm.get("subtotal") or (qty * float(itm.get("price") or 0)))
                cat = itm.get("category") or "General"
                cog = float(itm.get("cost_price") or 0) * qty

                if p_name not in prod_agg:
                    prod_agg[p_name] = {"cat": cat, "qty": 0.0, "rev": 0.0, "cog": 0.0}
                prod_agg[p_name]["qty"] += qty
                prod_agg[p_name]["rev"] += rev
                prod_agg[p_name]["cog"] += cog

        p_rows = []
        tot_units = 0.0
        for p_name, p_val in sorted(prod_agg.items(), key=lambda x: x[1]["rev"], reverse=True):
            profit = p_val["rev"] - p_val["cog"]
            share = (p_val["rev"] / total_sales) if total_sales > 0 else 0.0
            p_rows.append([
                p_name,
                p_val["cat"],
                p_val["qty"],
                p_val["rev"],
                profit,
                share
            ])
            tot_units += p_val["qty"]

        p_totals = ["TOTAL", "", tot_units, total_sales, net_profit, 1.0 if total_sales > 0 else 0.0]
        self.builder.write_table(
            ws_prod,
            start_row=6,
            headers=["Product", "Category", "Units Sold (Month)", "Revenue (Month)", "Profit (Month)", "% of Month's Revenue"],
            data_rows=p_rows,
            col_formats=[None, None, self.builder.FMT_INTEGER, self.builder.FMT_CURRENCY, self.builder.FMT_CURRENCY, self.builder.FMT_PERCENT],
            col_alignments=["left", "left", "center", "right", "right", "right"],
            totals_row=p_totals
        )
        self.builder.autofit_column_widths(ws_prod)

        filename = self.builder.get_safe_filename("MonthlySales", date_code)
        filepath = os.path.join(self.export_dir, filename)
        wb.save(filepath)
        return filepath

    # ─────────────────────────────────────────────────────────────────────────
    # 4. WEEKLY EXPENSE REPORT
    # ─────────────────────────────────────────────────────────────────────────
    def export_weekly_expense_report(self, week_date_str: Optional[str] = None) -> str:
        """
        4. Weekly Expense Report (Single sheet, two tables)
        Table A: Category Summary (Category, Amount, % of Week's Expenses, # of Entries)
        Table B: Full Ledger (Date, Title, Category, Amount, Payment Method, Linked Worker, Notes)
        """
        today_date = date.today()
        if week_date_str:
            try:
                base_dt = datetime.strptime(week_date_str, "%Y-%m-%d").date()
            except Exception:
                base_dt = today_date
        else:
            base_dt = today_date

        start_week = base_dt - timedelta(days=base_dt.weekday())
        end_week = start_week + timedelta(days=6)
        range_label = f"{start_week.strftime('%d-%b-%Y')} to {end_week.strftime('%d-%b-%Y')}"
        range_code = f"{start_week.strftime('%Y%m%d')}_{end_week.strftime('%Y%m%d')}"

        wb = self.builder.create_workbook()
        ws = wb.create_sheet(title="Weekly Expenses")
        self.builder.write_branded_header(ws, "Weekly Business Expense Report", range_label, num_columns=7)

        expenses = Expense.query.filter(
            func.date(Expense.date) >= start_week,
            func.date(Expense.date) <= end_week
        ).order_by(Expense.date.asc()).all()

        total_exp = sum(e.amount for e in expenses)

        if not expenses:
            self.builder.write_empty_state_sheet(ws, "Weekly Expense Report", range_label, "No expenses recorded for this week.")
            filepath = os.path.join(self.export_dir, self.builder.get_safe_filename("WeeklyExpenses", range_code))
            wb.save(filepath)
            return filepath

        # Table A: Category Summary
        cat_agg = {}
        for e in expenses:
            cat = e.category or "Operational"
            if cat not in cat_agg:
                cat_agg[cat] = {"amt": 0.0, "count": 0}
            cat_agg[cat]["amt"] += e.amount
            cat_agg[cat]["count"] += 1

        cat_rows = []
        for cat, data in sorted(cat_agg.items(), key=lambda x: x[1]["amt"], reverse=True):
            pct = (data["amt"] / total_exp) if total_exp > 0 else 0.0
            cat_rows.append([cat, data["amt"], pct, data["count"]])

        cat_totals = ["TOTAL", total_exp, 1.0 if total_exp > 0 else 0.0, len(expenses)]
        next_row = self.builder.write_table(
            ws,
            start_row=6,
            headers=["Category", "Amount", "% of Week's Expenses", "# of Entries"],
            data_rows=cat_rows,
            col_formats=[None, self.builder.FMT_CURRENCY, self.builder.FMT_PERCENT, self.builder.FMT_INTEGER],
            col_alignments=["left", "right", "right", "center"],
            totals_row=cat_totals,
            section_title="Category Summary",
            freeze_header=False
        )

        # Table B: Full Ledger
        ledger_rows = []
        for e in expenses:
            e_dt = e.date.strftime("%d-%b-%Y") if hasattr(e.date, "strftime") else str(e.date)
            w_name = e.worker.name if e.worker else "-"
            ledger_rows.append([
                e_dt,
                e.title,
                e.category,
                e.amount,
                (e.payment_method or "Cash").title(),
                w_name,
                e.notes or ""
            ])

        ledger_totals = ["TOTAL", f"{len(expenses)} Entries", "", total_exp, "", "", ""]
        self.builder.write_table(
            ws,
            start_row=next_row,
            headers=["Date", "Title", "Category", "Amount", "Payment Method", "Linked Worker", "Notes"],
            data_rows=ledger_rows,
            col_formats=[None, None, None, self.builder.FMT_CURRENCY, None, None, None],
            col_alignments=["center", "left", "left", "right", "center", "left", "left"],
            totals_row=ledger_totals,
            section_title="Detailed Expense Ledger",
            freeze_header=False
        )
        self.builder.autofit_column_widths(ws)

        filename = self.builder.get_safe_filename("WeeklyExpenses", range_code)
        filepath = os.path.join(self.export_dir, filename)
        wb.save(filepath)
        return filepath

    # ─────────────────────────────────────────────────────────────────────────
    # 5. MONTHLY EXPENSE REPORT
    # ─────────────────────────────────────────────────────────────────────────
    def export_monthly_expense_report(self, month: int, year: int) -> str:
        """
        5. Monthly Expense Report
        Sheet 1: Category Summary (Category, Amount, % Share, vs Prior Month)
        Sheet 2: Vendor/Payee Breakdown (Vendor/Payee, Category, # of Payments, Total Paid)
        Sheet 3: Full Ledger (Date, Title, Category, Amount, Payment Method, Linked Worker, Notes)
        """
        _, last_day = calendar.monthrange(year, month)
        start_month = date(year, month, 1)
        end_month = date(year, month, last_day)

        # Prior Month
        prev_month = 12 if month == 1 else month - 1
        prev_year = year - 1 if month == 1 else year
        _, prev_last_day = calendar.monthrange(prev_year, prev_month)
        prev_start = date(prev_year, prev_month, 1)
        prev_end = date(prev_year, prev_month, prev_last_day)

        month_label = f"{calendar.month_name[month]} {year}"
        date_code = f"{year}_{month:02d}"

        wb = self.builder.create_workbook()

        curr_expenses = Expense.query.filter(
            func.date(Expense.date) >= start_month,
            func.date(Expense.date) <= end_month
        ).order_by(Expense.date.asc()).all()

        prev_expenses = Expense.query.filter(
            func.date(Expense.date) >= prev_start,
            func.date(Expense.date) <= prev_end
        ).all()

        total_curr = sum(e.amount for e in curr_expenses)
        total_prev = sum(e.amount for e in prev_expenses)

        # ── Sheet 1: Category Summary ──
        ws_cat = wb.create_sheet(title="Category Summary")
        self.builder.write_branded_header(ws_cat, "Monthly Expense Category Summary", month_label, num_columns=4)

        curr_cat = {}
        for e in curr_expenses:
            curr_cat[e.category] = curr_cat.get(e.category, 0.0) + e.amount
        prev_cat = {}
        for e in prev_expenses:
            prev_cat[e.category] = prev_cat.get(e.category, 0.0) + e.amount

        cat_rows = []
        all_categories = sorted(set(list(curr_cat.keys()) + list(prev_cat.keys())))
        for cat in all_categories:
            c_amt = curr_cat.get(cat, 0.0)
            p_amt = prev_cat.get(cat, 0.0)
            pct_share = (c_amt / total_curr) if total_curr > 0 else 0.0
            if p_amt > 0:
                change = ((c_amt - p_amt) / p_amt) * 100.0
                change_str = f"▲ {change:+.1f}%" if change >= 0 else f"▼ {abs(change):.1f}%"
            else:
                change_str = "NEW" if c_amt > 0 else "-"

            cat_rows.append([cat, c_amt, pct_share, change_str])

        cat_totals = ["TOTAL", total_curr, 1.0 if total_curr > 0 else 0.0, ""]
        self.builder.write_table(
            ws_cat,
            start_row=6,
            headers=["Category", "Amount (Month)", "% of Month's Expenses", "vs. Prior Month"],
            data_rows=cat_rows,
            col_formats=[None, self.builder.FMT_CURRENCY, self.builder.FMT_PERCENT, None],
            col_alignments=["left", "right", "right", "center"],
            totals_row=cat_totals
        )
        self.builder.autofit_column_widths(ws_cat)

        # ── Sheet 2: Vendor/Payee Breakdown ──
        ws_vendor = wb.create_sheet(title="Vendor Breakdown")
        self.builder.write_branded_header(ws_vendor, "Vendor & Payee Outflows", month_label, num_columns=4)

        vendor_agg = {}
        for e in curr_expenses:
            # Derive vendor or title payee
            v_name = (e.worker.name if e.worker else e.title) or "General Payee"
            if v_name not in vendor_agg:
                vendor_agg[v_name] = {"category": e.category, "count": 0, "total": 0.0}
            vendor_agg[v_name]["count"] += 1
            vendor_agg[v_name]["total"] += e.amount

        vendor_rows = []
        for v_name, v_data in sorted(vendor_agg.items(), key=lambda x: x[1]["total"], reverse=True):
            vendor_rows.append([v_name, v_data["category"], v_data["count"], v_data["total"]])

        vendor_totals = ["TOTAL", "", len(curr_expenses), total_curr]
        self.builder.write_table(
            ws_vendor,
            start_row=6,
            headers=["Vendor / Payee", "Category", "# of Payments", "Total Paid (Month)"],
            data_rows=vendor_rows,
            col_formats=[None, None, self.builder.FMT_INTEGER, self.builder.FMT_CURRENCY],
            col_alignments=["left", "left", "center", "right"],
            totals_row=vendor_totals
        )
        self.builder.autofit_column_widths(ws_vendor)

        # ── Sheet 3: Full Ledger ──
        ws_ledger = wb.create_sheet(title="Full Ledger")
        self.builder.write_branded_header(ws_ledger, "Monthly Expense Full Ledger", month_label, num_columns=7)

        ledger_rows = []
        for e in curr_expenses:
            e_dt = e.date.strftime("%d-%b-%Y") if hasattr(e.date, "strftime") else str(e.date)
            w_name = e.worker.name if e.worker else "-"
            ledger_rows.append([
                e_dt,
                e.title,
                e.category,
                e.amount,
                (e.payment_method or "Cash").title(),
                w_name,
                e.notes or ""
            ])

        ledger_totals = ["TOTAL", f"{len(curr_expenses)} Entries", "", total_curr, "", "", ""]
        self.builder.write_table(
            ws_ledger,
            start_row=6,
            headers=["Date", "Title", "Category", "Amount", "Payment Method", "Linked Worker", "Notes"],
            data_rows=ledger_rows,
            col_formats=[None, None, None, self.builder.FMT_CURRENCY, None, None, None],
            col_alignments=["center", "left", "left", "right", "center", "left", "left"],
            totals_row=ledger_totals
        )
        self.builder.autofit_column_widths(ws_ledger)

        filename = self.builder.get_safe_filename("MonthlyExpenses", date_code)
        filepath = os.path.join(self.export_dir, filename)
        wb.save(filepath)
        return filepath

    # ─────────────────────────────────────────────────────────────────────────
    # 6. YEARLY EXPENSE AUDIT
    # ─────────────────────────────────────────────────────────────────────────
    def export_yearly_expense_audit(self, year: int) -> str:
        """
        6. Yearly Expense Audit
        Sheet 1: Year Overview (Metrics, Month-by-month table)
        Sheet 2: Category Breakdown Year (Wide Pivot: Category × Jan..Dec + Total + % Share)
        Sheet 3: Full Ledger (All expense rows for the year)
        """
        start_year = date(year, 1, 1)
        end_year = date(year, 12, 31)
        year_label = f"Calendar Year {year}"

        wb = self.builder.create_workbook()

        expenses = Expense.query.filter(
            func.date(Expense.date) >= start_year,
            func.date(Expense.date) <= end_year
        ).order_by(Expense.date.asc()).all()

        total_ytd = sum(e.amount for e in expenses)

        # ── Sheet 1: Year Overview ──
        ws_overview = wb.create_sheet(title="Year Overview")
        self.builder.write_branded_header(ws_overview, "Yearly Expense Audit Overview", year_label, num_columns=4)

        monthly_totals = {m: 0.0 for m in range(1, 13)}
        for e in expenses:
            e_dt = e.date.date() if hasattr(e.date, "date") else e.date
            if e_dt:
                monthly_totals[e_dt.month] += e.amount

        active_months = [amt for amt in monthly_totals.values() if amt > 0]
        avg_monthly = (sum(active_months) / len(active_months)) if active_months else 0.0

        high_month_idx, high_month_val = max(monthly_totals.items(), key=lambda x: x[1])
        low_month_idx, low_month_val = min(
            [(m, a) for m, a in monthly_totals.items() if a > 0] or [(1, 0.0)],
            key=lambda x: x[1]
        )

        metrics = [
            {"label": "Total YTD Expenses", "value": total_ytd, "format": "currency"},
            {"label": "Avg Monthly Expense", "value": avg_monthly, "format": "currency"},
            {"label": "Highest Expense Month", "value": f"{calendar.month_abbr[high_month_idx]} (₹{high_month_val:,.0f})", "format": "text"},
            {"label": "Lowest Expense Month", "value": f"{calendar.month_abbr[low_month_idx]} (₹{low_month_val:,.0f})", "format": "text"},
        ]
        next_row = self.builder.write_metric_cards(ws_overview, start_row=7, metrics=metrics, cols_per_card=2)

        month_rows = []
        prev_amt = 0.0
        for m in range(1, 13):
            c_amt = monthly_totals[m]
            if prev_amt > 0 and c_amt > 0:
                diff = ((c_amt - prev_amt) / prev_amt) * 100.0
                vs_prior = f"▲ {diff:+.1f}%" if diff >= 0 else f"▼ {abs(diff):.1f}%"
            else:
                vs_prior = "-"
            month_rows.append([
                calendar.month_name[m],
                c_amt,
                vs_prior,
                "-"
            ])
            if c_amt > 0:
                prev_amt = c_amt

        month_totals = ["TOTAL", total_ytd, "", ""]
        self.builder.write_table(
            ws_overview,
            start_row=next_row,
            headers=["Month", "Total Outflows", "vs. Prior Month", "vs. Prior Year"],
            data_rows=month_rows,
            col_formats=[None, self.builder.FMT_CURRENCY, None, None],
            col_alignments=["left", "right", "center", "center"],
            totals_row=month_totals,
            section_title="Month-by-Month Expense Trend"
        )
        self.builder.autofit_column_widths(ws_overview)

        # ── Sheet 2: Category Breakdown (Year Pivot) ──
        ws_pivot = wb.create_sheet(title="Category Breakdown (Year)")
        self.builder.write_branded_header(ws_pivot, "Yearly Category Expense Matrix", year_label, num_columns=15)

        cat_matrix = {}
        for e in expenses:
            cat = e.category or "Operational"
            e_dt = e.date.date() if hasattr(e.date, "date") else e.date
            m_idx = e_dt.month if e_dt else 1
            if cat not in cat_matrix:
                cat_matrix[cat] = {m: 0.0 for m in range(1, 13)}
            cat_matrix[cat][m_idx] += e.amount

        pivot_rows = []
        col_month_totals = [0.0] * 12
        for cat, months in sorted(cat_matrix.items()):
            row_total = sum(months.values())
            share = (row_total / total_ytd) if total_ytd > 0 else 0.0
            row_data = [cat] + [months[m] for m in range(1, 13)] + [row_total, share]
            pivot_rows.append(row_data)
            for m in range(1, 13):
                col_month_totals[m - 1] += months[m]

        pivot_totals = ["TOTAL"] + col_month_totals + [total_ytd, 1.0 if total_ytd > 0 else 0.0]
        pivot_headers = ["Category", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Total", "% of Year"]
        pivot_formats = [None] + [self.builder.FMT_CURRENCY] * 13 + [self.builder.FMT_PERCENT]
        pivot_aligns = ["left"] + ["right"] * 14

        self.builder.write_table(
            ws_pivot,
            start_row=6,
            headers=pivot_headers,
            data_rows=pivot_rows,
            col_formats=pivot_formats,
            col_alignments=pivot_aligns,
            totals_row=pivot_totals
        )
        self.builder.autofit_column_widths(ws_pivot)

        # ── Sheet 3: Full Ledger ──
        ws_ledger = wb.create_sheet(title="Full Ledger")
        self.builder.write_branded_header(ws_ledger, "Yearly Expense Master Ledger", year_label, num_columns=7)

        ledger_rows = []
        for e in expenses:
            e_dt = e.date.strftime("%d-%b-%Y") if hasattr(e.date, "strftime") else str(e.date)
            w_name = e.worker.name if e.worker else "-"
            ledger_rows.append([
                e_dt,
                e.title,
                e.category,
                e.amount,
                (e.payment_method or "Cash").title(),
                w_name,
                e.notes or ""
            ])

        ledger_totals = ["TOTAL", f"{len(expenses)} Entries", "", total_ytd, "", "", ""]
        self.builder.write_table(
            ws_ledger,
            start_row=6,
            headers=["Date", "Title", "Category", "Amount", "Payment Method", "Linked Worker", "Notes"],
            data_rows=ledger_rows,
            col_formats=[None, None, None, self.builder.FMT_CURRENCY, None, None, None],
            col_alignments=["center", "left", "left", "right", "center", "left", "left"],
            totals_row=ledger_totals
        )
        self.builder.autofit_column_widths(ws_ledger)

        filename = self.builder.get_safe_filename("YearlyExpenseAudit", str(year))
        filepath = os.path.join(self.export_dir, filename)
        wb.save(filepath)
        return filepath

    # ─────────────────────────────────────────────────────────────────────────
    # 7. MASTER FINANCIAL SHEET (Yearly Audit)
    # ─────────────────────────────────────────────────────────────────────────
    def export_master_financial_sheet(self, year: int) -> str:
        """
        7. Master Financial Sheet (Sales & Expenses Combined Full Audit)
        Sheet 1: Executive Summary (Key KPIs, Month-by-month Sales/Expenses/Net/Margin)
        Sheet 2: Sales Detail (Year) (All 12 months day-by-day sales & running cumulative)
        Sheet 3: Expense Detail (Year) (Category × 12 Month wide pivot)
        Sheet 4: Payroll Summary (Worker, Role, Paid, Advances, Days Present)
        Sheet 5: Full Transaction Log (Unified sales & expenses chronological ledger + running balance)
        """
        start_year = date(year, 1, 1)
        end_year = date(year, 12, 31)
        year_label = f"Calendar Year {year}"

        wb = self.builder.create_workbook()

        # Query full year bills & expenses
        bills = Bill.query.filter(
            func.date(Bill.created_at) >= start_year,
            func.date(Bill.created_at) <= end_year,
            Bill.status.notin_(["CANCELLED", "VOIDED"])
        ).order_by(Bill.created_at.asc()).all()

        expenses = Expense.query.filter(
            func.date(Expense.date) >= start_year,
            func.date(Expense.date) <= end_year
        ).order_by(Expense.date.asc()).all()

        gross_sales = sum(b.total_amount for b in bills)
        total_exp = sum(e.amount for e in expenses)
        net_profit = gross_sales - total_exp
        profit_margin = (net_profit / gross_sales) if gross_sales > 0 else 0.0
        total_orders = len(bills)
        avg_bill = (gross_sales / total_orders) if total_orders > 0 else 0.0

        # ── Sheet 1: Executive Summary ──
        ws_exec = wb.create_sheet(title="Executive Summary")
        self.builder.write_branded_header(ws_exec, "Master Financial Audit Summary", year_label, num_columns=5)

        metrics = [
            {"label": "Gross Sales (Year)", "value": gross_sales, "format": "currency"},
            {"label": "Total Expenses (Year)", "value": total_exp, "format": "currency"},
            {"label": "Net Profit (Year)", "value": net_profit, "format": "currency"},
            {"label": "Profit Margin %", "value": profit_margin, "format": "percent"},
            {"label": "Total Orders", "value": total_orders, "format": "number"},
            {"label": "Avg Bill Value", "value": avg_bill, "format": "currency"},
        ]
        next_row = self.builder.write_metric_cards(ws_exec, start_row=7, metrics=metrics, cols_per_card=2)

        # Monthly rollup table
        month_sales = {m: 0.0 for m in range(1, 13)}
        month_exp = {m: 0.0 for m in range(1, 13)}
        for b in bills:
            if b.created_at:
                month_sales[b.created_at.month] += b.total_amount
        for e in expenses:
            e_dt = e.date.date() if hasattr(e.date, "date") else e.date
            if e_dt:
                month_exp[e_dt.month] += e.amount

        exec_rows = []
        for m in range(1, 13):
            s = month_sales[m]
            ex = month_exp[m]
            p = s - ex
            mrg = (p / s) if s > 0 else 0.0
            exec_rows.append([calendar.month_name[m], s, ex, p, mrg])

        exec_totals = ["TOTAL", gross_sales, total_exp, net_profit, profit_margin]
        self.builder.write_table(
            ws_exec,
            start_row=next_row,
            headers=["Month", "Sales Revenue", "Expenses", "Net Profit", "Margin %"],
            data_rows=exec_rows,
            col_formats=[None, self.builder.FMT_CURRENCY, self.builder.FMT_CURRENCY, self.builder.FMT_CURRENCY, self.builder.FMT_PERCENT],
            col_alignments=["left", "right", "right", "right", "right"],
            totals_row=exec_totals,
            section_title="Combined Monthly Financial Performance"
        )
        self.builder.autofit_column_widths(ws_exec)

        # ── Sheet 2: Sales Detail (Year) ──
        ws_sales = wb.create_sheet(title="Sales Detail (Year)")
        self.builder.write_branded_header(ws_sales, "Annual Daily Sales Breakdown", year_label, num_columns=5)

        # Group by day
        sales_by_day = {}
        for b in bills:
            if b.created_at:
                d = b.created_at.date()
                if d not in sales_by_day:
                    sales_by_day[d] = {"orders": 0, "rev": 0.0}
                sales_by_day[d]["orders"] += 1
                sales_by_day[d]["rev"] += b.total_amount

        sales_rows = []
        cum_rev = 0.0
        for d in sorted(sales_by_day.keys()):
            d_rev = sales_by_day[d]["rev"]
            cum_rev += d_rev
            sales_rows.append([
                d.strftime("%d-%b-%Y"),
                d.strftime("%A"),
                sales_by_day[d]["orders"],
                d_rev,
                cum_rev
            ])

        sales_totals = ["TOTAL", "", total_orders, gross_sales, gross_sales]
        self.builder.write_table(
            ws_sales,
            start_row=6,
            headers=["Date", "Day", "Orders", "Sales Revenue", "Cumulative Revenue"],
            data_rows=sales_rows,
            col_formats=[None, None, self.builder.FMT_INTEGER, self.builder.FMT_CURRENCY, self.builder.FMT_CURRENCY],
            col_alignments=["center", "left", "center", "right", "right"],
            totals_row=sales_totals
        )
        self.builder.autofit_column_widths(ws_sales)

        # ── Sheet 3: Expense Detail (Year Pivot) ──
        ws_exp_pivot = wb.create_sheet(title="Expense Detail (Year)")
        self.builder.write_branded_header(ws_exp_pivot, "Annual Expense Category Matrix", year_label, num_columns=15)

        cat_matrix = {}
        for e in expenses:
            cat = e.category or "Operational"
            e_dt = e.date.date() if hasattr(e.date, "date") else e.date
            m_idx = e_dt.month if e_dt else 1
            if cat not in cat_matrix:
                cat_matrix[cat] = {m: 0.0 for m in range(1, 13)}
            cat_matrix[cat][m_idx] += e.amount

        pivot_rows = []
        col_month_totals = [0.0] * 12
        for cat, months in sorted(cat_matrix.items()):
            row_total = sum(months.values())
            share = (row_total / total_exp) if total_exp > 0 else 0.0
            row_data = [cat] + [months[m] for m in range(1, 13)] + [row_total, share]
            pivot_rows.append(row_data)
            for m in range(1, 13):
                col_month_totals[m - 1] += months[m]

        pivot_totals = ["TOTAL"] + col_month_totals + [total_exp, 1.0 if total_exp > 0 else 0.0]
        pivot_headers = ["Category", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Total", "% of Year"]
        pivot_formats = [None] + [self.builder.FMT_CURRENCY] * 13 + [self.builder.FMT_PERCENT]
        pivot_aligns = ["left"] + ["right"] * 14

        self.builder.write_table(
            ws_exp_pivot,
            start_row=6,
            headers=pivot_headers,
            data_rows=pivot_rows,
            col_formats=pivot_formats,
            col_alignments=pivot_aligns,
            totals_row=pivot_totals
        )
        self.builder.autofit_column_widths(ws_exp_pivot)

        # ── Sheet 4: Payroll Summary ──
        ws_payroll = wb.create_sheet(title="Payroll Summary")
        self.builder.write_branded_header(ws_payroll, "Annual Worker Payroll & Attendance Summary", year_label, num_columns=5)

        workers = Worker.query.all()
        payroll_rows = []
        tot_paid = 0.0
        tot_adv = 0.0
        tot_days = 0

        for w in workers:
            # Query paid salaries for this worker in the year
            payments = SalaryPayment.query.filter(
                SalaryPayment.worker_id == w.worker_id,
                SalaryPayment.year == year,
                SalaryPayment.paid == True
            ).all()
            w_paid = sum(p.final_salary for p in payments)

            # Query advances in the year
            advances = Advance.query.filter(
                Advance.worker_id == w.worker_id,
                func.date(Advance.date) >= start_year,
                func.date(Advance.date) <= end_year
            ).all()
            w_adv = sum(a.amount for a in advances)

            # Query present days in the year
            att_count = Attendance.query.filter(
                Attendance.worker_id == w.worker_id,
                func.date(Attendance.date) >= start_year,
                func.date(Attendance.date) <= end_year,
                Attendance.status == "Present"
            ).count()

            payroll_rows.append([
                w.name,
                w.role or "Staff",
                w_paid,
                w_adv,
                att_count
            ])
            tot_paid += w_paid
            tot_adv += w_adv
            tot_days += att_count

        payroll_totals = ["TOTAL", f"{len(workers)} Staff", tot_paid, tot_adv, tot_days]
        self.builder.write_table(
            ws_payroll,
            start_row=6,
            headers=["Worker Name", "Role / Title", "Total Paid (Year)", "Total Advances (Year)", "Days Present (Year)"],
            data_rows=payroll_rows,
            col_formats=[None, None, self.builder.FMT_CURRENCY, self.builder.FMT_CURRENCY, self.builder.FMT_INTEGER],
            col_alignments=["left", "left", "right", "right", "center"],
            totals_row=payroll_totals
        )
        self.builder.autofit_column_widths(ws_payroll)

        # ── Sheet 5: Full Transaction Log (Unified Chronological) ──
        ws_tx = wb.create_sheet(title="Transaction Log")
        self.builder.write_branded_header(ws_tx, "Annual Unified Transaction Ledger", year_label, num_columns=6)

        # Merge bills and expenses into a single unified stream
        unified_events = []
        for b in bills:
            dt = b.created_at or datetime.combine(start_year, datetime.min.time())
            unified_events.append({
                "datetime": dt,
                "type": "Sale",
                "ref": f"Bill #{b.bill_no}",
                "category": "POS Revenue",
                "amount": b.total_amount,
                "is_credit": True
            })

        for e in expenses:
            dt = e.date if isinstance(e.date, datetime) else datetime.combine(e.date or start_year, datetime.min.time())
            unified_events.append({
                "datetime": dt,
                "type": "Expense",
                "ref": e.title,
                "category": e.category or "Expense",
                "amount": e.amount,
                "is_credit": False
            })

        unified_events.sort(key=lambda x: x["datetime"])

        tx_rows = []
        running_bal = 0.0
        for ev in unified_events:
            amt = ev["amount"]
            if ev["is_credit"]:
                running_bal += amt
            else:
                running_bal -= amt

            tx_rows.append([
                ev["datetime"].strftime("%d-%b-%Y %I:%M %p"),
                ev["type"],
                ev["ref"],
                ev["category"],
                amt if ev["is_credit"] else -amt,
                running_bal
            ])

        tx_totals = ["TOTAL", f"{len(unified_events)} Transactions", "", "", net_profit, net_profit]
        self.builder.write_table(
            ws_tx,
            start_row=6,
            headers=["Date & Time", "Type", "Reference", "Category", "Amount", "Running Balance"],
            data_rows=tx_rows,
            col_formats=[None, None, None, None, self.builder.FMT_CURRENCY, self.builder.FMT_CURRENCY],
            col_alignments=["center", "center", "left", "left", "right", "right"],
            totals_row=tx_totals
        )
        self.builder.autofit_column_widths(ws_tx)

        filename = self.builder.get_safe_filename("MasterFinancial", str(year))
        filepath = os.path.join(self.export_dir, filename)
        wb.save(filepath)
        return filepath

    # ─────────────────────────────────────────────────────────────────────────
    # Backward-compatible helper methods
    # ─────────────────────────────────────────────────────────────────────────
    def export_detailed_sales_report(self, bills: List[Dict], summary_data: Dict) -> str:
        date_str = summary_data.get("date") if summary_data else None
        return self.export_daily_sales_report(date_str)

    def export_simple_sales_report(self, bills: List[Dict]) -> str:
        return self.export_daily_sales_report()

    def export_summary_report(self, summary_data: Dict) -> str:
        date_str = summary_data.get("date") if summary_data else None
        return self.export_daily_sales_report(date_str)

    def create_sample_report(self) -> str:
        return self.export_daily_sales_report()

    def export_monthly_product_sales_report(self, report_data: Dict) -> str:
        month = report_data.get("month", date.today().month)
        year = report_data.get("year", date.today().year)
        return self.export_monthly_sales_summary(month, year)

    def export_weekly_product_sales_report(self, report_data: Dict) -> str:
        date_str = report_data.get("start_date")
        return self.export_weekly_sales_summary(date_str)

    def export_expenses_report(self, expenses: List[Dict], title: str, filename: str) -> str:
        return self.export_weekly_expense_report()
