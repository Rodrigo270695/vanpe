import ExcelJS from 'exceljs';

/** Paleta VanPe para exportaciones Excel (ARGB sin #). */
export const VANPE_EXCEL = {
    headerBg: 'FF0744A9',
    headerFg: 'FFFFFFFF',
    titleFg: 'FF0744A9',
    bodyFg: 'FF475569',
    mutedFg: 'FF94A3B8',
    altRowBg: 'FFEEF3FC',
    border: 'FFD0DBEF',
    headerSize: 10,
    bodySize: 9,
    titleSize: 11,
} as const;

export type XlsxColumn<T> = {
    header: string;
    width?: number;
    value: (row: T) => string | number | null | undefined;
};

export type XlsxExportMeta = {
    title: string;
    subtitle?: string;
};

function applyThinBorder(cell: ExcelJS.Cell): void {
    const border: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: VANPE_EXCEL.border } },
        left: { style: 'thin', color: { argb: VANPE_EXCEL.border } },
        bottom: { style: 'thin', color: { argb: VANPE_EXCEL.border } },
        right: { style: 'thin', color: { argb: VANPE_EXCEL.border } },
    };
    cell.border = border;
}

function triggerDownload(buffer: ArrayBuffer, filename: string): void {
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Genera y descarga un .xlsx con cabecera azul VanPe, filas alternas y tipografía compacta.
 */
export async function downloadXlsx<T>(
    filename: string,
    sheetName: string,
    rows: T[],
    columns: XlsxColumn<T>[],
    meta?: XlsxExportMeta,
): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'VanPe';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(sheetName, {
        properties: { defaultRowHeight: 18 },
    });

    let headerRowIndex = 1;

    if (meta?.title) {
        sheet.mergeCells(1, 1, 1, columns.length);
        const titleCell = sheet.getCell(1, 1);
        titleCell.value = meta.title;
        titleCell.font = {
            bold: true,
            size: VANPE_EXCEL.titleSize,
            color: { argb: VANPE_EXCEL.titleFg },
        };
        titleCell.alignment = { vertical: 'middle' };

        if (meta.subtitle) {
            sheet.mergeCells(2, 1, 2, columns.length);
            const subCell = sheet.getCell(2, 1);
            subCell.value = meta.subtitle;
            subCell.font = {
                size: VANPE_EXCEL.bodySize,
                color: { argb: VANPE_EXCEL.mutedFg },
            };
            headerRowIndex = 3;
        } else {
            headerRowIndex = 2;
        }
    }

    columns.forEach((col, index) => {
        sheet.getColumn(index + 1).width = col.width ?? 16;
    });

    const headerRow = sheet.getRow(headerRowIndex);
    headerRow.height = 22;

    columns.forEach((col, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = col.header;
        cell.font = {
            bold: true,
            size: VANPE_EXCEL.headerSize,
            color: { argb: VANPE_EXCEL.headerFg },
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: VANPE_EXCEL.headerBg },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        applyThinBorder(cell);
    });

    rows.forEach((row, rowIndex) => {
        const excelRow = sheet.getRow(headerRowIndex + 1 + rowIndex);
        const isAlt = rowIndex % 2 === 1;

        columns.forEach((col, colIndex) => {
            const cell = excelRow.getCell(colIndex + 1);
            const raw = col.value(row);
            cell.value = raw === null || raw === undefined ? '' : raw;
            cell.font = {
                size: VANPE_EXCEL.bodySize,
                color: { argb: VANPE_EXCEL.bodyFg },
            };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };

            if (isAlt) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: VANPE_EXCEL.altRowBg },
                };
            }

            applyThinBorder(cell);
        });
    });

    const lastRow = headerRowIndex + rows.length;
    sheet.autoFilter = {
        from: { row: headerRowIndex, column: 1 },
        to: { row: Math.max(headerRowIndex, lastRow), column: columns.length },
    };

    sheet.views = [
        {
            state: 'frozen',
            ySplit: headerRowIndex,
            activeCell: `A${headerRowIndex + 1}`,
        },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    triggerDownload(buffer, filename);
}
