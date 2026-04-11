import * as XLSX from 'xlsx'

type FilaExcel = Record<string, string | number | boolean | null | undefined>

type OpcionesExportarExcel = {
    nombreArchivo: string
    nombreHoja: string
    filas: FilaExcel[]
}

export function exportarExcel({
    nombreArchivo,
    nombreHoja,
    filas,
}: OpcionesExportarExcel) {
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(filas)

    const rango = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    const anchos = new Array(rango.e.c + 1).fill(0).map((_, columnIndex) => {
        let max = 14

        for (let rowIndex = rango.s.r; rowIndex <= rango.e.r; rowIndex += 1) {
            const cellAddress = XLSX.utils.encode_cell({
                c: columnIndex,
                r: rowIndex,
            })
            const cell = worksheet[cellAddress]
            const valor = String(cell?.v ?? '')
            max = Math.max(max, Math.min(valor.length + 2, 40))
        }

        return { wch: max }
    })

    worksheet['!cols'] = anchos

    XLSX.utils.book_append_sheet(workbook, worksheet, nombreHoja)
    XLSX.writeFile(workbook, nombreArchivo.endsWith('.xlsx') ? nombreArchivo : `${nombreArchivo}.xlsx`)
}
