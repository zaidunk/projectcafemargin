from fpdf import FPDF
from datetime import datetime
import io


class CafeMarginPDF(FPDF):
    def __init__(self, cafe_name: str):
        super().__init__()
        self.cafe_name = cafe_name
        self.set_margins(15, 15, 15)

    def header(self):
        self.set_fill_color(92, 61, 46)  # dark brown
        self.rect(0, 0, 210, 18, "F")
        self.set_text_color(245, 239, 230)  # cream
        self.set_font("Helvetica", "B", 11)
        self.set_xy(10, 4)
        self.cell(0, 10, "CafeMargin - Strategic Data Analytics", align="L")
        self.set_font("Helvetica", "", 9)
        self.set_xy(10, 10)
        self.cell(0, 6, f"PT Xolvon Kehidupan Cerdas Abadi", align="L")
        self.ln(12)
        self.set_text_color(45, 27, 16)  # dark brown text

    def footer(self):
        self.set_y(-12)
        self.set_fill_color(200, 168, 130)  # warm tan
        self.rect(0, self.get_y(), 210, 12, "F")
        self.set_text_color(92, 61, 46)
        self.set_font("Helvetica", "I", 8)
        self.set_xy(10, self.get_y() + 3)
        self.cell(0, 6, f"Halaman {self.page_no()} | Confidential - {self.cafe_name}", align="L")
        self.set_xy(10, self.get_y())
        self.cell(0, 6, f"Digenerate: {datetime.now().strftime('%d %B %Y')}", align="R")

    def section_title(self, title: str):
        self.set_fill_color(92, 61, 46)
        self.set_text_color(245, 239, 230)
        self.set_font("Helvetica", "B", 11)
        self.cell(0, 8, f"  {title}", fill=True, ln=True)
        self.set_text_color(45, 27, 16)
        self.ln(2)

    def metric_box(self, label: str, value: str, x: float, y: float, w: float = 55, h: float = 20):
        self.set_fill_color(245, 239, 230)
        self.set_draw_color(200, 168, 130)
        self.rect(x, y, w, h, "FD")
        self.set_font("Helvetica", "", 8)
        self.set_text_color(139, 94, 60)
        self.set_xy(x + 2, y + 2)
        self.cell(w - 4, 5, label, ln=True)
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(92, 61, 46)
        self.set_xy(x + 2, y + 8)
        self.cell(w - 4, 10, value)


def format_idr(value: float) -> str:
    return f"Rp {value:,.0f}".replace(",", ".")


def generate_executive_summary(analytics: dict, cafe_name: str, period: str) -> bytes:
    pdf = CafeMarginPDF(cafe_name)
    pdf.add_page()

    # Cover section
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(92, 61, 46)
    pdf.cell(0, 12, "Executive Summary Report", ln=True, align="C")
    pdf.set_font("Helvetica", "", 12)
    pdf.set_text_color(139, 94, 60)
    pdf.cell(0, 6, cafe_name, ln=True, align="C")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, f"Periode: {period}", ln=True, align="C")
    pdf.ln(8)

    # Margin Snapshot boxes
    pdf.section_title("Margin Snapshot")
    summary = analytics.get("summary", {})
    snapshot = analytics.get("margin_snapshot", {})
    y = pdf.get_y()
    pdf.metric_box("Total Revenue", format_idr(summary.get("total_revenue", 0)), 15, y)
    pdf.metric_box("Gross Profit", format_idr(snapshot.get("gross_profit", 0)), 73, y)
    pdf.metric_box("Margin %", f"{snapshot.get('margin_pct', 0):.1f}%", 131, y)
    pdf.ln(28)

    y2 = pdf.get_y()
    pdf.metric_box("Total Transaksi", f"{summary.get('total_transactions', 0):,}", 15, y2)
    pdf.metric_box("Avg Transaksi", format_idr(summary.get("avg_transaction_value", 0)), 73, y2)
    pdf.metric_box("Total HPP", format_idr(snapshot.get("total_hpp_cost", 0)), 131, y2)
    pdf.ln(28)

    # Top Leakages
    pdf.section_title("Top Kebocoran Margin")
    leakages = analytics.get("top_leakages", [])
    if leakages:
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_fill_color(200, 168, 130)
        col_w = [60, 30, 30, 30, 30]
        headers = ["Item", "Revenue", "Margin %", "HPP", "Saran Harga"]
        for i, h in enumerate(headers):
            pdf.cell(col_w[i], 7, h, border=1, fill=True)
        pdf.ln()
        pdf.set_font("Helvetica", "", 8)
        for i, leak in enumerate(leakages[:5]):
            fill = i % 2 == 0
            pdf.set_fill_color(245, 239, 230) if fill else pdf.set_fill_color(255, 255, 255)
            pdf.cell(col_w[0], 6, str(leak.get("item_name", ""))[:30], border=1, fill=fill)
            pdf.cell(col_w[1], 6, format_idr(leak.get("total_revenue", 0)), border=1, fill=fill)
            pdf.cell(col_w[2], 6, f"{leak.get('margin_pct', 0):.1f}%", border=1, fill=fill)
            pdf.cell(col_w[3], 6, format_idr(leak.get("avg_hpp", 0)), border=1, fill=fill)
            suggested = leak.get("suggested_price", leak.get("avg_unit_price", 0))
            pdf.cell(col_w[4], 6, format_idr(suggested), border=1, fill=fill)
            pdf.ln()
    else:
        pdf.set_font("Helvetica", "I", 10)
        pdf.cell(0, 8, "Tidak ada data kebocoran terdeteksi", ln=True)
    pdf.ln(4)

    # Peak Hours
    pdf.section_title("Peak Hour Analysis")
    golden_hours = analytics.get("golden_hours", [])
    dead_hours = analytics.get("dead_hours", [])
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(92, 61, 46)
    pdf.cell(0, 6, "Golden Hours (jam puncak):", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(45, 27, 16)
    if golden_hours:
        hours_str = ", ".join(f"{h:02d}:00" for h in golden_hours)
        pdf.multi_cell(0, 6, f"  {hours_str}")
        pdf.cell(0, 5, "  -> Rekomendasi: Upsell, bundling paket, tambah kapasitas staf", ln=True)
    else:
        pdf.cell(0, 6, "  Tidak ada data yang cukup", ln=True)

    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(92, 61, 46)
    pdf.cell(0, 6, "Dead Hours (jam sepi):", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(45, 27, 16)
    if dead_hours:
        hours_str = ", ".join(f"{h:02d}:00" for h in dead_hours)
        pdf.multi_cell(0, 6, f"  {hours_str}")
        pdf.cell(0, 5, "  -> Rekomendasi: Flash promo, happy hour, loyalty program", ln=True)
    pdf.ln(4)

    # Top items
    pdf.section_title("Top 5 Item by Revenue")
    top_items = analytics.get("top_items_by_revenue", [])[:5]
    if top_items:
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_fill_color(200, 168, 130)
        pdf.cell(10, 7, "#", border=1, fill=True)
        pdf.cell(80, 7, "Nama Item", border=1, fill=True)
        pdf.cell(45, 7, "Total Revenue", border=1, fill=True)
        pdf.cell(45, 7, "Total Qty", border=1, fill=True)
        pdf.ln()
        pdf.set_font("Helvetica", "", 8)
        for i, item in enumerate(top_items):
            fill = i % 2 == 0
            pdf.set_fill_color(245, 239, 230) if fill else pdf.set_fill_color(255, 255, 255)
            pdf.cell(10, 6, str(i + 1), border=1, fill=fill)
            pdf.cell(80, 6, str(item.get("item_name", ""))[:40], border=1, fill=fill)
            pdf.cell(45, 6, format_idr(item.get("total_revenue", 0)), border=1, fill=fill)
            pdf.cell(45, 6, str(item.get("total_qty", 0)), border=1, fill=fill)
            pdf.ln()
    pdf.ln(6)

    # Footer note
    pdf.set_fill_color(245, 239, 230)
    pdf.set_draw_color(200, 168, 130)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(139, 94, 60)
    pdf.multi_cell(
        0, 5,
        "Laporan ini digenerate secara otomatis oleh CafeMargin Analytics Platform. "
        "Untuk konsultasi lebih lanjut, hubungi tim CafeMargin - PT Xolvon Kehidupan Cerdas Abadi.",
        border=1, fill=True
    )

    return bytes(pdf.output())
