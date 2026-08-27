import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json()

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, message: 'Formato de datos inválido.' }, { status: 400 })
    }

    const supabase = await createClient()
    let insertados = 0
    let errores = 0

    for (const item of items) {
      let imagenPublicUrl: string | null = null

      // Subir la imagen individualmente a Supabase Storage
      if (item.tieneImagen && item.imageBufferBase64) {
        try {
          const buffer = Buffer.from(item.imageBufferBase64, 'base64')
          const fileName = `item-${Date.now()}-${Math.random().toString(36).substring(7)}.${item.extensionImagen || 'png'}`

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
          } else if (storageError) {
            console.error('Error al subir a Supabase Storage:', storageError.message)
          }
        } catch (imgErr) {
          console.error('Error convirtiendo/subiendo imagen:', imgErr)
        }
      }

      const placaSena = `SENA-BIENESTAR-${item.consecutivo}`

      const { error: insertError } = await supabase.from('elementos').insert({
        nombre: item.nombre,
        descripcion: `Stock inicial: ${item.cantidad} unidad(es). Estado físico: ${item.estadoFisico}`,
        categoria: item.categoria,
        placa_sena: placaSena,
        imagen_url: imagenPublicUrl,
        estado: 'disponible',
        ubication: 'Almacén Bienestar al Aprendiz',
      })

      if (insertError) {
        errores++
      } else {
        insertados++
      }
    }

    return NextResponse.json({
      success: true,
      message: `¡Carga completada! Se registraron ${insertados} elementos (${errores} fallidos).`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: `Error en el servidor: ${error.message}` }, { status: 500 })
  }
}