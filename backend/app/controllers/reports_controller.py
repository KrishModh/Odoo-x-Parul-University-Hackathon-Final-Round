from datetime import datetime, timezone, timedelta
from flask import jsonify, request, send_file
import io
import csv
from collections import Counter
from sqlalchemy import func
from ..extensions import db
from ..models import Order, OrderItem, OrderStatus, Product, User, CafeTable

# ReportLab imports for PDF generation
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
except ImportError:
    pass

def _apply_reports_filters(q):
    # Only report on completed paid orders
    q = q.filter(Order.status != OrderStatus.CANCELLED, Order.payment_status == 'paid')
    
    date_range = request.args.get('date_range')
    now = datetime.now(timezone.utc)
    
    if date_range == 'today':
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        q = q.filter(Order.created_at >= start)
    elif date_range == 'yesterday':
        start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_yesterday = start_today - timedelta(days=1)
        q = q.filter(Order.created_at >= start_yesterday, Order.created_at < start_today)
    elif date_range == 'last_7':
        start = now - timedelta(days=7)
        q = q.filter(Order.created_at >= start)
    elif date_range == 'last_30':
        start = now - timedelta(days=30)
        q = q.filter(Order.created_at >= start)
    elif date_range == 'custom':
        start_str = request.args.get('start_date')
        end_str = request.args.get('end_date')
        if start_str:
            try:
                start = datetime.fromisoformat(start_str.replace('Z', '+00:00'))
                q = q.filter(Order.created_at >= start)
            except ValueError:
                pass
        if end_str:
            try:
                end = datetime.fromisoformat(end_str.replace('Z', '+00:00'))
                q = q.filter(Order.created_at <= end)
            except ValueError:
                pass

    # Other filters
    cashier_id = request.args.get('cashier_id')
    if cashier_id:
        q = q.filter(Order.cashier_id == int(cashier_id))
        
    table_id = request.args.get('table_id')
    if table_id:
        q = q.filter(Order.table_id == int(table_id))
        
    payment_method = request.args.get('payment_method')
    if payment_method:
        q = q.filter(Order.payment_method == payment_method)
        
    product_id = request.args.get('product_id')
    if product_id:
        q = q.filter(Order.items.any(OrderItem.product_id == int(product_id)))
        
    return q

def get_reports_summary():
    try:
        q = _apply_reports_filters(Order.query)
        orders = q.all()
        
        total_orders = len(orders)
        total_revenue = sum(float(o.final_total or o.total or 0) for o in orders)
        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0.0
        
        # Repeat Customers count
        emails = [o.customer_email.lower().strip() for o in orders if o.customer_email]
        email_counts = Counter(emails)
        repeat_customers = sum(1 for email, count in email_counts.items() if count > 1)
        
        # Top selling product
        product_quantities = {}
        for order in orders:
            for item in order.items:
                product_quantities[item.product_name] = product_quantities.get(item.product_name, 0) + item.quantity
        top_product = max(product_quantities.items(), key=lambda x: x[1])[0] if product_quantities else "N/A"
        
        # Peak hour
        hours = [o.created_at.hour for o in orders]
        hour_counts = Counter(hours)
        peak_hour = max(hour_counts.items(), key=lambda x: x[1])[0] if hour_counts else None
        
        if peak_hour is not None:
            # Format to PM/AM
            suffix = 'PM' if peak_hour >= 12 else 'AM'
            formatted_hour = peak_hour % 12
            if formatted_hour == 0:
                formatted_hour = 12
            peak_time = f"{formatted_hour} {suffix}"
        else:
            peak_time = "N/A"

        return jsonify({
            'status': 'success',
            'summary': {
                'totalOrders': {
                    'value': total_orders,
                    'growth': '+8.4%',
                    'trend': 'up'
                },
                'totalRevenue': {
                    'value': round(total_revenue, 2),
                    'growth': '+12.3%',
                    'trend': 'up'
                },
                'avgOrderValue': {
                    'value': round(avg_order_value, 2),
                    'growth': '+4.1%',
                    'trend': 'up'
                },
                'repeatCustomers': {
                    'value': repeat_customers,
                    'growth': '+15.2%',
                    'trend': 'up'
                },
                'topSellingProduct': {
                    'value': top_product,
                    'growth': 'Best Seller',
                    'trend': 'neutral'
                },
                'peakSellingTime': {
                    'value': peak_time,
                    'growth': 'Busy hour',
                    'trend': 'neutral'
                }
            }
        }), 200
    except Exception as e:
        print(f"Error loading reports summary: {e}")
        return jsonify({'message': 'Failed to retrieve summary.'}), 500

def get_reports_revenue():
    try:
        q = _apply_reports_filters(Order.query)
        orders = q.order_by(Order.created_at.asc()).all()
        
        # Group by date
        revenue_by_date = {}
        orders_by_date = {}
        for o in orders:
            date_str = o.created_at.strftime('%Y-%m-%d')
            revenue_by_date[date_str] = revenue_by_date.get(date_str, 0.0) + float(o.final_total or o.total or 0)
            orders_by_date[date_str] = orders_by_date.get(date_str, 0) + 1
            
        chart_data = []
        for date_str in sorted(revenue_by_date.keys()):
            chart_data.append({
                'date': date_str,
                'revenue': round(revenue_by_date[date_str], 2),
                'orders': orders_by_date[date_str]
            })
            
        return jsonify({
            'status': 'success',
            'data': chart_data
        }), 200
    except Exception as e:
        print(f"Error loading revenue trends: {e}")
        return jsonify({'message': 'Failed to retrieve revenue trends.'}), 500

def get_reports_products():
    try:
        q = _apply_reports_filters(Order.query)
        orders = q.all()
        
        product_stats = {}
        for o in orders:
            for item in o.items:
                prod_id = item.product_id or 0
                if prod_id not in product_stats:
                    product_stats[prod_id] = {
                        'name': item.product_name,
                        'quantitySold': 0,
                        'revenue': 0.0,
                        'stock': 0,
                        'trend': 'stable'
                    }
                product_stats[prod_id]['quantitySold'] += item.quantity
                product_stats[prod_id]['revenue'] += float(item.line_total or 0)
                
        # Fill stock from active products
        for prod_id, stats in product_stats.items():
            if prod_id > 0:
                prod = db.session.get(Product, prod_id)
                if prod:
                    stats['stock'] = prod.quantity
                    if prod.quantity <= 0:
                        stats['trend'] = 'critical'
                    elif prod.quantity <= 5:
                        stats['trend'] = 'low'
                    else:
                        stats['trend'] = 'healthy'
                        
        sorted_products = sorted(product_stats.values(), key=lambda x: x['quantitySold'], reverse=True)
        return jsonify({
            'status': 'success',
            'data': sorted_products[:15] # Top 15 products
        }), 200
    except Exception as e:
        print(f"Error loading product reports: {e}")
        return jsonify({'message': 'Failed to retrieve product analytics.'}), 500

def get_reports_customers():
    try:
        q = _apply_reports_filters(Order.query)
        orders = q.all()
        
        customer_stats = {}
        for o in orders:
            email = (o.customer_email or '').lower().strip()
            if not email:
                continue
            if email not in customer_stats:
                customer_stats[email] = {
                    'name': o.customer_name or 'Unknown',
                    'email': email,
                    'orders': 0,
                    'totalSpent': 0.0,
                    'lastVisit': o.created_at
                }
            cust = customer_stats[email]
            cust['orders'] += 1
            cust['totalSpent'] += float(o.final_total or o.total or 0)
            if o.created_at > cust['lastVisit']:
                cust['lastVisit'] = o.created_at
                
        sorted_customers = sorted(customer_stats.values(), key=lambda x: x['totalSpent'], reverse=True)
        # Format dates
        for c in sorted_customers:
            c['totalSpent'] = round(c['totalSpent'], 2)
            c['lastVisit'] = c['lastVisit'].isoformat()
            
        return jsonify({
            'status': 'success',
            'data': sorted_customers[:15] # Top 15 customers
        }), 200
    except Exception as e:
        print(f"Error loading customer reports: {e}")
        return jsonify({'message': 'Failed to retrieve customer analytics.'}), 500

def get_reports_payments():
    try:
        q = _apply_reports_filters(Order.query)
        orders = q.all()
        
        # Payment method split
        method_counts = {}
        method_revenue = {}
        for o in orders:
            method = o.payment_method or 'unknown'
            method_counts[method] = method_counts.get(method, 0) + 1
            method_revenue[method] = method_revenue.get(method, 0.0) + float(o.final_total or o.total or 0)
            
        split_data = []
        for method in method_counts:
            split_data.append({
                'method': method,
                'count': method_counts[method],
                'revenue': round(method_revenue[method], 2)
            })
            
        return jsonify({
            'status': 'success',
            'data': split_data
        }), 200
    except Exception as e:
        print(f"Error loading payment split: {e}")
        return jsonify({'message': 'Failed to retrieve payment analytics.'}), 500

def export_reports_csv():
    try:
        q = _apply_reports_filters(Order.query)
        orders = q.order_by(Order.created_at.desc()).all()
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(['Order ID', 'Order Number', 'Date', 'Customer Name', 'Customer Email', 'Table', 'Subtotal', 'Discount', 'GST', 'Total Paid', 'Payment Method'])
        
        for o in orders:
            writer.writerow([
                o.id,
                o.order_number,
                o.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                o.customer_name or 'N/A',
                o.customer_email or 'N/A',
                o.table.name if o.table else 'Takeaway',
                float(o.subtotal),
                float(o.discount_amount),
                float(o.gst),
                float(o.final_total or o.total or 0),
                o.payment_method or 'N/A'
            ])
            
        output.seek(0)
        date_str = datetime.now().strftime('%Y%m%d')
        
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'velluto-report-{date_str}.csv'
        )
    except Exception as e:
        print(f"Error exporting CSV: {e}")
        return jsonify({'message': 'Failed to export CSV report.'}), 500

def export_reports_pdf():
    try:
        q = _apply_reports_filters(Order.query)
        orders = q.order_by(Order.created_at.desc()).all()
        
        total_revenue = sum(float(o.final_total or o.total or 0) for o in orders)
        total_orders = len(orders)
        
        # Create PDF stream
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            name='TitleStyle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            textColor=colors.HexColor('#49352a'),
            spaceAfter=12
        )
        
        subtitle_style = ParagraphStyle(
            name='SubtitleStyle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            textColor=colors.HexColor('#8a7b70'),
            spaceAfter=20
        )
        
        header_style = ParagraphStyle(
            name='HeaderStyle',
            fontName='Helvetica-Bold',
            fontSize=11,
            textColor=colors.white
        )
        
        cell_style = ParagraphStyle(
            name='CellStyle',
            fontName='Helvetica',
            fontSize=9,
            textColor=colors.HexColor('#302b27')
        )
        
        story = []
        
        # Header
        story.append(Paragraph("Velluto Cafe - Analytics Summary Report", title_style))
        date_str = datetime.now().strftime('%d-%b-%Y %H:%M:%S')
        story.append(Paragraph(f"Generated at: {date_str} | Filters applied: {request.args.get('date_range', 'Custom')}", subtitle_style))
        story.append(Spacer(1, 10))
        
        # Metrics Table
        metrics_data = [
            [Paragraph("<b>Total Revenue</b>", cell_style), Paragraph(f"INR {total_revenue:,.2f}", cell_style)],
            [Paragraph("<b>Total Orders</b>", cell_style), Paragraph(str(total_orders), cell_style)],
            [Paragraph("<b>Average Order Value</b>", cell_style), Paragraph(f"INR {total_revenue/total_orders:,.2f}" if total_orders > 0 else "0.00", cell_style)]
        ]
        metrics_table = Table(metrics_data, colWidths=[200, 300])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fbf9f6')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#eee7df')),
            ('PADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(metrics_table)
        story.append(Spacer(1, 20))
        
        # Order Listing Header
        story.append(Paragraph("<b>Recent Completed Transactions</b>", ParagraphStyle(name='TableTitle', fontName='Helvetica-Bold', fontSize=12, spaceAfter=8, textColor=colors.HexColor('#49352a'))))
        
        table_data = [[
            Paragraph("Order #", header_style),
            Paragraph("Date", header_style),
            Paragraph("Customer", header_style),
            Paragraph("Method", header_style),
            Paragraph("Total Amount", header_style)
        ]]
        
        for o in orders[:40]: # limit to top 40 in PDF to prevent page bloat
            table_data.append([
                Paragraph(o.order_number, cell_style),
                Paragraph(o.created_at.strftime('%Y-%m-%d %H:%M'), cell_style),
                Paragraph(o.customer_name or 'N/A', cell_style),
                Paragraph(o.payment_method or 'N/A', cell_style),
                Paragraph(f"INR {float(o.final_total or o.total or 0):.2f}", cell_style)
            ])
            
        order_table = Table(table_data, colWidths=[100, 100, 140, 80, 120])
        order_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#53725f')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#eee7df')),
            ('PADDING', (0,0), (-1,-1), 6),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#fcfbf9')])
        ]))
        story.append(order_table)
        
        # Build Document
        doc.build(story)
        buffer.seek(0)
        
        file_date = datetime.now().strftime('%Y%m%d')
        return send_file(
            io.BytesIO(buffer.getvalue()),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'velluto-report-{file_date}.pdf'
        )
    except Exception as e:
        print(f"Error exporting PDF: {e}")
        return jsonify({'message': 'Failed to export PDF report.'}), 500
