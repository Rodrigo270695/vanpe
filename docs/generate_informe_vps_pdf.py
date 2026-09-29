# -*- coding: utf-8 -*-
"""Genera el PDF del informe VanPe (proyección 1M usuarios)."""
from pathlib import Path

from fpdf import FPDF

OUT = Path(__file__).resolve().parent / "INFORME_INFRAESTRUCTURA_COSTOS_VANPE_1M.pdf"
FONT = r"C:\Windows\Fonts\arial.ttf"
FONTB = r"C:\Windows\Fonts\arialbd.ttf"


class PDF(FPDF):
    def header(self):
        self.set_font("ArialDoc", "B", 9)
        self.set_text_color(30, 64, 175)
        self.cell(0, 6, "VanPe  |  Informe de infraestructura y costos operativos")
        self.ln(6)
        self.set_draw_color(30, 64, 175)
        self.set_line_width(0.4)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-12)
        self.set_font("ArialDoc", "", 8)
        self.set_text_color(100, 116, 139)
        self.cell(
            0,
            8,
            f"Página {self.page_no()}/{{nb}}  ·  Uso interno VanPe  ·  Septiembre 2026",
            align="C",
        )


def main() -> None:
    pdf = PDF("P", "mm", "A4")
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.add_font("ArialDoc", "", FONT)
    pdf.add_font("ArialDoc", "B", FONTB)
    pdf.add_page()

    def h1(t: str) -> None:
        pdf.set_font("ArialDoc", "B", 15)
        pdf.set_text_color(15, 23, 42)
        pdf.multi_cell(0, 7.5, t)
        pdf.ln(2)

    def h2(t: str) -> None:
        pdf.ln(2)
        pdf.set_font("ArialDoc", "B", 11.5)
        pdf.set_text_color(30, 64, 175)
        pdf.multi_cell(0, 6.5, t)
        pdf.ln(1)

    def h3(t: str) -> None:
        pdf.set_font("ArialDoc", "B", 10)
        pdf.set_text_color(15, 23, 42)
        pdf.multi_cell(0, 5.5, t)
        pdf.ln(0.5)

    def body(t: str) -> None:
        pdf.set_font("ArialDoc", "", 9.5)
        pdf.set_text_color(51, 65, 85)
        pdf.multi_cell(0, 5.2, t)
        pdf.ln(1)

    def bullet(t: str) -> None:
        pdf.set_x(pdf.l_margin)
        pdf.set_font("ArialDoc", "", 9.5)
        pdf.set_text_color(51, 65, 85)
        pdf.multi_cell(0, 5.2, f"- {t}")

    def kv_table(rows: list[tuple[str, str]], col1: float = 70, col2: float = 110) -> None:
        for i, (a, b) in enumerate(rows):
            pdf.set_fill_color(241, 245, 249) if i % 2 == 0 else pdf.set_fill_color(255, 255, 255)
            y0 = pdf.get_y()
            if y0 > pdf.h - 25:
                pdf.add_page()
                y0 = pdf.get_y()
            pdf.set_xy(pdf.l_margin, y0)
            pdf.set_font("ArialDoc", "B", 8.5)
            pdf.set_text_color(15, 23, 42)
            pdf.cell(col1, 7, a, fill=True)
            pdf.set_font("ArialDoc", "", 8.5)
            pdf.set_text_color(51, 65, 85)
            pdf.cell(col2, 7, b, fill=True)
            pdf.ln(7)
        pdf.ln(2)

    def simple_table(headers: list[str], rows: list[list[str]], widths: list[float]) -> None:
        pdf.set_font("ArialDoc", "B", 8)
        pdf.set_fill_color(30, 64, 175)
        pdf.set_text_color(255, 255, 255)
        for h, w in zip(headers, widths):
            pdf.cell(w, 7, h, fill=True, align="C")
        pdf.ln(7)
        for ri, row in enumerate(rows):
            if pdf.get_y() > pdf.h - 28:
                pdf.add_page()
                pdf.set_font("ArialDoc", "B", 8)
                pdf.set_fill_color(30, 64, 175)
                pdf.set_text_color(255, 255, 255)
                for h, w in zip(headers, widths):
                    pdf.cell(w, 7, h, fill=True, align="C")
                pdf.ln(7)
            pdf.set_fill_color(248, 250, 252) if ri % 2 == 0 else pdf.set_fill_color(255, 255, 255)
            pdf.set_text_color(51, 65, 85)
            pdf.set_font("ArialDoc", "", 7.8)
            # altura dinámica simple
            max_lines = 1
            for cell, w in zip(row, widths):
                approx = max(1, int(pdf.get_string_width(cell) / max(w - 3, 8)) + 1)
                max_lines = max(max_lines, approx)
            row_h = max(7, 4.2 * max_lines + 1.5)
            x0, y0 = pdf.get_x(), pdf.get_y()
            for i, (cell, w) in enumerate(zip(row, widths)):
                pdf.set_xy(x0 + sum(widths[:i]), y0)
                pdf.rect(x0 + sum(widths[:i]), y0, w, row_h, style="F")
                pdf.set_xy(x0 + sum(widths[:i]) + 1, y0 + 1)
                pdf.multi_cell(w - 2, 4.2, cell)
            pdf.set_y(y0 + row_h)
        pdf.ln(2)

    h1(
        "Informe técnico-económico de infraestructura y costos operativos de VanPe"
    )
    body(
        "Proyección de capacidad y costos para un mínimo de 1.000.000 de usuarios "
        "de la aplicación móvil."
    )
    kv_table(
        [
            ("Producto", "VanPe (app turística — Android / iOS)"),
            ("Alcance proyección 1M", "Solo servidor VPS (resto: costos actuales)"),
            ("Moneda", "Soles (S/) y USD donde aplique"),
            ("Fecha", "Septiembre 2026"),
            ("Servidor actual", "rodrigo95 — 161.132.37.209"),
        ]
    )

    h2("1. Objetivo del informe")
    body(
        "Documentar el VPS actual, las alternativas de ampliación, la proyección "
        "recomendada de VPS para 1.000.000 de usuarios, y los costos de seguridad, "
        "SUNAT/RENIEC, publicación en tiendas, Google Maps y WhatsApp Business."
    )

    h2("2. VPS actual (situación vigente)")
    h3("2.1. Costo")
    kv_table([("Costo mensual actual del VPS", "S/ 1 008,00")])
    h3("2.2. Detalle técnico observado")
    simple_table(
        ["Recurso", "Estado actual"],
        [
            ["Sistema operativo", "Ubuntu 22.04.5 LTS (x86_64)"],
            ["Almacenamiento (/)", "≈ 314,93 GB totales — uso ≈ 41,1%"],
            ["Uso de memoria (RAM)", "≈ 13% ocupada"],
            ["Carga del sistema (load)", "0,19 (baja)"],
            ["Procesos", "≈ 164"],
            ["Red", "IPv4 pública en servicio"],
        ],
        [55, 125],
    )
    body(
        "Lectura operativa: el plan actual está holgado (CPU/RAM/disco con margen). "
        "Es adecuado para la etapa actual, pero no es la meta de capacidad para "
        "1 millón de usuarios."
    )

    h2("3. Alternativas de VPS evaluadas")
    simple_table(
        ["Plan", "Almacenamiento", "RAM", "Costo/mes", "Rol"],
        [
            ["A — Actual", "≈ 315 GB", "Plan vigente", "S/ 1 008", "Operación actual"],
            ["B — Intermedio", "650 GB NVMe", "32 GB", "S/ 1 800", "Escalón / tránsito"],
            ["C — Alto", "800 GB NVMe", "64 GB", "S/ 3 500", "Recomendado 1M"],
        ],
        [32, 40, 28, 28, 52],
    )

    h2("4. Proyección VPS para 1.000.000 de usuarios")
    h3("4.1. Criterios")
    bullet("1.000.000 de usuarios no implica 1.000.000 de conexiones simultáneas.")
    bullet(
        "Pico típico concurrente estimado 1%–3% "
        "(aprox. 10.000–30.000 sesiones en pico)."
    )
    bullet("Carga: API Laravel, base de datos, Redis, colas, medios e imágenes.")
    bullet("Buenas prácticas: CDN, caché, índices DB, rate limiting y monitoreo.")
    pdf.ln(1)

    h3("4.2. Comparación")
    simple_table(
        ["Plan", "¿Soporta 1M?", "Comentario"],
        [
            ["A — S/ 1 008", "No", "Suficiente hoy; insuficiente ante picos y 1M."],
            [
                "B — S/ 1 800",
                "Parcial / transición",
                "Paso intermedio con CDN; margen estrecho en picos altos.",
            ],
            [
                "C — S/ 3 500",
                "Sí — idóneo",
                "RAM y disco adecuados para app+DB+Redis+colas con margen.",
            ],
        ],
        [35, 40, 105],
    )

    h3("4.3. Recomendación")
    body("Plan idóneo: C — 800 GB NVMe + 64 GB RAM — S/ 3 500 mensuales.")
    kv_table(
        [
            ("VPS recomendado (mensual)", "S/ 3 500"),
            ("VPS recomendado (anual estimado)", "S/ 42 000"),
            ("Diferencia vs plan actual (mensual)", "+ S/ 2 492"),
        ]
    )
    body(
        "Condiciones: CDN para imágenes; Redis; optimización DB/colas; backups y "
        "monitoreo. Si se supera 1M o hay saturación, evaluar arquitectura multi-nodo."
    )

    h3("4.4. Resumen ejecutivo VPS")
    simple_table(
        ["Escenario", "Plan", "Costo mensual"],
        [
            ["Operación actual", "A", "S/ 1 008"],
            ["Escalón intermedio", "B", "S/ 1 800"],
            ["Proyección 1.000.000 usuarios", "C (recomendado)", "S/ 3 500"],
        ],
        [70, 55, 55],
    )

    h2("5. Seguridad actual (postura fuerte)")
    body("VanPe opera con enfoque de seguridad reforzada:")
    bullet("Acceso SSH restringido y endurecimiento del host.")
    bullet("HTTPS/TLS en API y web.")
    bullet("Autenticación, tokens y validación de entradas.")
    bullet("Credenciales fuera del código (variables de entorno).")
    bullet("Permisos móviles justificados (ubicación para mapas/navegación).")
    bullet("Cumplimiento de políticas Google Play / App Store.")
    bullet("Backups y actualización de sistema como proceso continuo.")
    pdf.ln(1)
    body(
        "Declaración: la plataforma cuenta con una postura de seguridad fuerte "
        "orientada a proteger datos de usuarios, integridad del servicio y "
        "continuidad operativa."
    )

    h2("6. Consultas SUNAT y RENIEC")
    kv_table([("Presupuesto anual informado", "S/ 500 / año")])

    h2("7. Publicación Android e iOS")
    simple_table(
        ["Tienda", "Concepto", "Costo", "Periodicidad"],
        [
            ["Google Play", "Alta desarrollador", "US$ 25 (≈ S/ 90–100)", "Único"],
            ["App Store", "Apple Developer Program", "US$ 99 (≈ S/ 360–380)", "Anual"],
        ],
        [35, 55, 55, 35],
    )
    body(
        "Total tiendas en un año típico (con iOS activo): ≈ S/ 360–380 "
        "(+ US$ 25 el primer año de Play si aplica)."
    )

    h2("8. Google Maps")
    body(
        "VanPe usa Google Maps Platform (Maps SDK y APIs asociadas). El modelo es "
        "pago por uso; Geocoding, Directions y Places pueden generar costo según "
        "volumen. El monto es variable según Google Cloud Billing. Se recomienda "
        "activar presupuestos y alertas."
    )

    h2("9. WhatsApp Business")
    simple_table(
        ["Modalidad", "Costo", "Uso"],
        [
            ["WhatsApp Business (app)", "Gratuito", "Atención manual / enlaces contacto"],
            ["WhatsApp Business API", "Variable (Meta)", "Automatizaciones y notificaciones"],
        ],
        [55, 40, 85],
    )
    body(
        "Si solo se abren chats wa.me: costo ≈ S/ 0. Si se usa API oficial: gasto "
        "variable según volumen y categoría de mensajes."
    )

    h2("10. Consolidado de costos")
    simple_table(
        ["Rubro", "Monto", "Periodo"],
        [
            ["VPS actual", "S/ 1 008", "Mensual"],
            ["VPS proyección 1M (recomendado)", "S/ 3 500", "Mensual"],
            ["SUNAT + RENIEC", "S/ 500", "Anual"],
            ["Google Play", "US$ 25", "Único (alta)"],
            ["Apple Developer", "US$ 99", "Anual"],
            ["Google Maps", "Variable", "Mensual"],
            ["WhatsApp Business (app)", "≈ 0", "—"],
            ["WhatsApp API (si se activa)", "Variable", "Mensual"],
        ],
        [85, 45, 50],
    )
    body(
        "Solo se proyecta a 1 millón de usuarios el VPS. El resto de rubros se "
        "presenta como costos actuales / de referencia."
    )

    h2("11. Conclusión")
    bullet("El VPS actual (S/ 1 008) es adecuado para la operación presente.")
    bullet(
        "Para 1.000.000 de usuarios, el plan idóneo es 800 GB NVMe + 64 GB RAM "
        "a S/ 3 500/mes."
    )
    bullet(
        "El plan de 32 GB / 650 GB (S/ 1 800) es escalón intermedio, no meta final a 1M."
    )
    bullet("La postura de seguridad es fuerte y debe mantenerse con parches y controles.")
    bullet(
        "SUNAT/RENIEC (S/ 500/año), tiendas, Maps y WhatsApp completan el mapa de "
        "costos; Maps y WhatsApp API son variables."
    )

    pdf.ln(4)
    pdf.set_font("ArialDoc", "B", 10)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6, "Aprobaciones")
    pdf.ln(8)
    simple_table(
        ["Rol", "Nombre", "Firma / fecha"],
        [
            ["Elaboración técnica", "", ""],
            ["Revisión infraestructura", "", ""],
            ["Aprobación gerencia / producto", "", ""],
        ],
        [70, 55, 55],
    )

    pdf.ln(3)
    pdf.set_font("ArialDoc", "", 8)
    pdf.set_text_color(100, 116, 139)
    pdf.multi_cell(
        0,
        5,
        "Documento preparado para uso interno de VanPe — infraestructura y "
        "presupuesto operativo.",
    )

    pdf.output(str(OUT))
    print(f"OK: {OUT}")
    print(f"Bytes: {OUT.stat().st_size}")


if __name__ == "__main__":
    main()
