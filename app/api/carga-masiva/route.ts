import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ success: false, message: 'No se adjuntó ningún archivo Excel.' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(arrayBuffer)

    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      return NextResponse.json({ success: false, message: 'El archivo Excel no contiene hojas válidas.' }, { status: 400 })
    }

    // 1. Mapear imágenes por número de fila en el Excel
    const rowImageMap = new Map<number, { buffer: Buffer; extension: string }>()

    worksheet.getImages().forEach((img) => {
      const imageObj = workbook.getImage(Number(img.imageId))
      if (imageObj && img.range && img.range.tl) {
        const excelRowNumber = Math.floor(img.range.tl.row) + 1
        if (excelRowNumber >= 6) {
          rowImageMap.set(excelRowNumber, {
            buffer: Buffer.from(imageObj.buffer as any),
            extension: imageObj.extension || 'png',
          })
        }
      }
    })

    // 2. Columnas por defecto según tu plantilla de Bienestar
    let colConsecutivo = 1
    let colNombre = 2
    let colCategoria = 3
    let colCantidad = 7
    let colEstado = 8

    const headerRow = worksheet.getRow(5)
    headerRow.eachCell((cell, colNumber) => {
      const val = String(cell.value || '').toLowerCase().trim()
      if (val.includes('consecutivo')) colConsecutivo = colNumber
      if (val.includes('nombre')) colNombre = colNumber
      if (val.includes('categor')) colCategoria = colNumber
      if (val.includes('disponible') || val.includes('cantidad')) colCantidad = colNumber
      if (val.includes('estado')) colEstado = colNumber
    })

    const items: any[] = []

    // 3. Extraer elementos a partir de la fila 6
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 5) return

      const nombreVal = row.getCell(colNombre).text?.trim()
      if (!nombreVal || nombreVal.toLowerCase().includes('nombre del elemento') || nombreVal.toLowerCase().includes('sena')) {
        return
      }

      const consecutivoVal = row.getCell(colConsecutivo).text?.trim() || rowNumber
      const categoriaVal = row.getCell(colCategoria).text?.trim() || 'General'
      const cantidadVal = parseInt(row.getCell(colCantidad).text?.trim() || '1')
      const estadoVal = row.getCell(colEstado).text?.trim() || 'Bueno'

      const imageData = rowImageMap.get(rowNumber)

      items.push({
        consecutivo: consecutivoVal,
        nombre: nombreVal,
        categoria: categoriaVal,
        cantidad: isNaN(cantidadVal) ? 1 : cantidadVal,
        estadoFisico: estadoVal,
        tieneImagen: !!imageData,
        imageBufferBase64: imageData ? imageData.buffer.toString('base64') : undefined,
        extensionImagen: imageData ? imageData.extension : undefined,
      })
    })

    return NextResponse.json({
      success: true,
      message: `Se detectaron ${items.length} elementos y ${items.filter(i => i.tieneImagen).length} imágenes.`,
      items,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: `Error en el servidor: ${error.message}` }, { status: 500 })
  }
}