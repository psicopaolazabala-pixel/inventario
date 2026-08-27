'use server'

import ExcelJS from 'exceljs'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ItemPreview {
  filaerrores?: string
  consecutivo: string | number
  nombre: string
  categoria: string
  cantidad: number
  estadoFisico: string
  tieneImagen: boolean
  imageBufferBase64?: string
  extensionImagen?: string
}

export async function procesarExcelCargaMasiva(formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file) {
      return { success: false, message: 'No se ha adjuntado ningún archivo Excel.' }
    }

    const arrayBuffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(arrayBuffer)

    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      return { success: false, message: 'El archivo Excel no contiene hojas válidas.' }
    }

    // 1. Extraer imágenes por número de fila
    const rowImageMap = new Map<number, { buffer: Buffer; extension: string }>()

    worksheet.getImages().forEach((img) => {
      const imageObj = workbook.getImage(Number(img.imageId))

      if (imageObj && img.range && img.range.tl) {
        const rowNumber = Math.floor(img.range.tl.row) + 1

        if (rowNumber > 3) {
          let imgBuffer: Buffer
          if (imageObj.buffer) {
            imgBuffer = Buffer.from(imageObj.buffer as ArrayBuffer)
          } else if ((imageObj as any).base64) {
            imgBuffer = Buffer.from((imageObj as any).base64, 'base64')
          } else {
            imgBuffer = Buffer.alloc(0)
          }

          rowImageMap.set(rowNumber, {
            buffer: imgBuffer,
            extension: imageObj.extension || 'png',
          })
        }
      }
    })

    // 2. Localizar fila de encabezados
    let headerRowIndex = -1
    let colNombre = -1
    let colCategoria = -1
    let colConsecutivo = -1
    let colCantidad = -1
    let colEstado = -1

    worksheet.eachRow((row, rowNumber) => {
      if (headerRowIndex !== -1) return

      row.eachCell((cell, colNumber) => {
        const val = String(cell.value || '').toLowerCase().trim()
        if (val.includes('nombre') || val.includes('elemento')) {
          headerRowIndex = rowNumber
          colNombre = colNumber
        }
      })

      if (headerRowIndex === rowNumber) {
        row.eachCell((cell, colNumber) => {
          const val = String(cell.value || '').toLowerCase().trim()
          if (val.includes('categor') || val.includes('tipo')) colCategoria = colNumber
          if (val.includes('consecutivo') || val.includes('item') || val.includes('n°')) colConsecutivo = colNumber
          if (val.includes('disponible') || val.includes('cantidad')) colCantidad = colNumber
          if (val.includes('estado')) colEstado = colNumber
        })
      }
    })

    if (headerRowIndex === -1 || colNombre === -1) {
      return {
        success: false,
        message: 'No se identificó la columna de "Nombre del elemento" en el Excel.',
      }
    }

    // 3. Extraer filas con datos
    const items: ItemPreview[] = []

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowIndex) return

      const nombreVal = row.getCell(colNombre).text?.trim()
      if (!nombreVal || nombreVal.toLowerCase().includes('nombre del elemento')) return

      const consecutivoVal = colConsecutivo !== -1 ? row.getCell(colConsecutivo).text?.trim() : rowNumber
      const categoriaVal = colCategoria !== -1 ? row.getCell(colCategoria).text?.trim() : 'Vestuario para danza'
      const cantidadVal = colCantidad !== -1 ? parseInt(row.getCell(colCantidad).text?.trim() || '1') : 1
      const estadoVal = colEstado !== -1 ? row.getCell(colEstado).text?.trim() : 'Bueno'

      const imageData = rowImageMap.get(rowNumber)

      items.push({
        consecutivo: consecutivoVal || rowNumber,
        nombre: nombreVal,
        categoria: categoriaVal || 'Vestuario para danza',
        cantidad: isNaN(cantidadVal) ? 1 : cantidadVal,
        estadoFisico: estadoVal || 'Bueno',
        tieneImagen: !!imageData,
        imageBufferBase64: imageData ? imageData.buffer.toString('base64') : undefined,
        extensionImagen: imageData ? imageData.extension : undefined,
      })
    })

    return {
      success: true,
      message: `Se detectaron ${items.length} elementos y ${items.filter((i) => i.tieneImagen).length} imágenes.`,
      items,
    }
  } catch (error: any) {
    return { success: false, message: `Error al procesar el Excel: ${error.message}` }
  }
}

export async function guardarCargaMasiva(items: ItemPreview[]) {
  try {
    const supabase = await createClient()

    let procesados = 0
    let errores = 0

    for (const item of items) {
      let imagenPublicUrl: string | null = null

      // 1. Subir la imagen si existe
      if (item.tieneImagen && item.imageBufferBase64) {
        try {
          const buffer = Buffer.from(item.imageBufferBase64, 'base64')
          const fileName = `item-${item.consecutivo}-${Date.now()}.${item.extensionImagen || 'png'}`

          const { data: storageData, error: storageError } = await supabase.storage
            .from('elementos')
            .upload(fileName, buffer, {
              contentType: `image/${item.extensionImagen || 'png'}`,
              upsert: true,
            })

          if (!storageError && storageData) {
            const { data: publicUrlData } = supabase.storage
              .from('elementos')
              .getPublicUrl(storageData.path)

            imagenPublicUrl = publicUrlData.publicUrl
          }
        } catch (imgErr) {
          console.error('Error al subir imagen:', imgErr)
        }
      }

      // 2. Placa asociada al consecutivo de la celda
      const placaSena = `SENA-BIENESTAR-${item.consecutivo}`

      // 3. Objeto base para actualizar o insertar
      const registroElemento: Record<string, any> = {
        nombre: item.nombre,
        descripcion: `Stock inicial: ${item.cantidad} unidad(es). Estado físico: ${item.estadoFisico || 'Bueno'}`,
        categoria: item.categoria || 'Vestuario para danza',
        placa_sena: placaSena,
        estado: 'disponible',
      }

      // Solo sobrescribir la imagen si el Excel trae una imagen nueva
      if (imagenPublicUrl) {
        registroElemento.imagen_url = imagenPublicUrl
      }

      // 4. UPSERT: Inserta nuevo o reemplaza los datos si la placa ya existe
      const { error: upsertError } = await supabase
        .from('elementos')
        .upsert(registroElemento, { onConflict: 'placa_sena' })

      if (upsertError) {
        console.error(`Error procesando placa ${placaSena}:`, upsertError.message)
        errores++
      } else {
        procesados++
      }
    }

    revalidatePath('/catalogo')
    revalidatePath('/carga-masiva')

    return {
      success: procesados > 0,
      insertados: procesados,
      message: `¡Carga Masiva Exitosa! Se actualizaron/registraron ${procesados} elementos en el catálogo (${errores} errores).`,
    }
  } catch (error: any) {
    return { success: false, message: `Error general en la carga masiva: ${error.message}` }
  }
}