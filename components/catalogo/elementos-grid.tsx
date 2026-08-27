'use client'

import { useState, useMemo } from 'react'
import { Elemento } from '@/types'
import { ItemCard } from '@/components/catalogo/item-card'
import { RequestModal } from '@/components/catalogo/request-modal'
import { RequestModalMultiple } from '@/components/catalogo/request-modal-multiple'
import { Search, Filter, ShoppingBag, X, RotateCcw } from 'lucide-react'

interface ElementosGridProps {
  elementos: Elemento[]
  isAdmin?: boolean
}

export function ElementosGrid({ elementos, isAdmin = false }: ElementosGridProps) {
  // Estados para modales y carrito múltiple
  const [selectedSingleItem, setSelectedSingleItem] = useState<Elemento | null>(null)
  const [selectedItems, setSelectedItems] = useState<Elemento[]>([])
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false)
  const [isMultipleModalOpen, setIsMultipleModalOpen] = useState(false)

  // Estados para Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS')
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS')

  // Extraer las categorías únicas disponibles en el inventario actual
  const categoriasDisponibles = useMemo(() => {
    const cats = elementos.map((el) => el.categoria || 'General')
    return ['TODAS', ...Array.from(new Set(cats))]
  }, [elementos])

  // Lógica de Filtrado en Tiempo Real
  const elementosFiltrados = useMemo(() => {
    return elementos.filter((item) => {
      // 1. Filtro por término de búsqueda (Nombre, Placa SENA o Descripción)
      const matchesSearch =
        searchTerm === '' ||
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.placa_sena.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))

      // 2. Filtro por Categoría
      const matchesCategoria =
        selectedCategoria === 'TODAS' ||
        item.categoria.toLowerCase() === selectedCategoria.toLowerCase()

      // 3. Filtro por Estado
      const matchesEstado =
        selectedEstado === 'TODOS' ||
        item.estado.toLowerCase() === selectedEstado.toLowerCase()

      return matchesSearch && matchesCategoria && matchesEstado
    })
  }, [elementos, searchTerm, selectedCategoria, selectedEstado])

  // Limpiar todos los filtros
  const handleResetFilters = () => {
    setSearchTerm('')
    setSelectedCategoria('TODAS')
    setSelectedEstado('TODOS')
  }

  // Alternar selección en carrito múltiple
  const handleToggleSelect = (elemento: Elemento) => {
    if (selectedItems.some((e) => e.id === elemento.id)) {
      setSelectedItems(selectedItems.filter((e) => e.id !== elemento.id))
    } else {
      setSelectedItems([...selectedItems, elemento])
    }
  }

  const handleRemoveItem = (id: string) => {
    setSelectedItems(selectedItems.filter((e) => e.id !== id))
  }

  const hayFiltrosActivos = searchTerm !== '' || selectedCategoria !== 'TODAS' || selectedEstado !== 'TODOS'

  return (
    <>
      {/* Barra de Búsqueda y Filtros */}
      <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* 1. Buscador por texto */}
          <div className="relative col-span-1 sm:col-span-2 lg:col-span-2">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, placa SENA o palabras clave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-900 transition-colors"
            />
          </div>

          {/* 2. Selector de Categoría */}
          <div>
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              {categoriasDisponibles.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'TODAS' ? 'Todas las Categorías' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Selector de Estado */}
          <div>
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="disponible">Disponibles</option>
              <option value="prestado">En Préstamo</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="baja">Fuera de Servicio</option>
            </select>
          </div>
        </div>

        {/* Resumen de Resultados y Botón para Limpiar */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/80">
          <span className="text-xs font-medium text-slate-500">
            Mostrando <strong className="text-emerald-500">{elementosFiltrados.length}</strong> de {elementos.length} elementos
          </span>

          {hayFiltrosActivos && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Limpiar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid de Tarjetas de Activos */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {elementosFiltrados.length > 0 ? (
          elementosFiltrados.map((item) => (
            <ItemCard
              key={item.id}
              elemento={item}
              onSelect={(el) => {
                setSelectedSingleItem(el)
                setIsSingleModalOpen(true)
              }}
              isSelected={selectedItems.some((e) => e.id === item.id)}
              onToggleSelect={handleToggleSelect}
              isAdmin={isAdmin}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-slate-800">
            <Filter className="h-8 w-8 text-slate-400 mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No se encontraron elementos con los filtros seleccionados
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Prueba cambiando el término de búsqueda o seleccionando otra categoría.
            </p>
            {hayFiltrosActivos && (
              <button
                onClick={handleResetFilters}
                className="mt-4 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Restablecer Filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Barra flotante inferior para Préstamo Múltiple */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/95 px-5 py-3 shadow-2xl backdrop-blur-md text-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-emerald-400" />
            <span className="text-xs font-bold">
              {selectedItems.length} elemento(s) seleccionado(s)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMultipleModalOpen(true)}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-500"
            >
              Tramitar Préstamo Múltiple
            </button>
            <button
              onClick={() => setSelectedItems([])}
              className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:text-white"
              title="Limpiar selección"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Préstamo Individual */}
      <RequestModal
        elemento={selectedSingleItem}
        isOpen={isSingleModalOpen}
        onClose={() => {
          setIsSingleModalOpen(false)
          setSelectedSingleItem(null)
        }}
      />

      {/* Modal de Préstamo Múltiple */}
      <RequestModalMultiple
        elementos={selectedItems}
        isOpen={isMultipleModalOpen}
        onClose={() => setIsMultipleModalOpen(false)}
        onRemoveItem={handleRemoveItem}
        onSuccess={() => setSelectedItems([])}
      />
    </>
  )
}