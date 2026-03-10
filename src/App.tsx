/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Globe, Phone, Wand2, Megaphone, Bell, HelpCircle,
  MoreVertical, List, Plus, Filter, ArrowUpDown,
  Search, Settings, ChevronsUpDown, Star, ImageIcon
} from 'lucide-react';

// URL base de tu API Django en Railway
const API_BASE_URL = 'https://web-production-2573f.up.railway.app';

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Título' },
  { key: 'price', label: 'Precio' },
  { key: 'beds', label: 'Habitaciones' },
  { key: 'sqm', label: 'Metros²' },
  { key: 'location', label: 'Zona' },
  { key: 'type', label: 'Tipo' },
  { key: 'features', label: 'Características' },
  { key: 'images', label: 'Imágenes' },
  { key: 'isFeatured', label: 'Destacada' },
];

export default function App() {
  const [propertiesData, setPropertiesData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Función para cargar propiedades desde la API de Django
  const fetchProperties = async (agencyId: string) => {
    try {
      const url = `${API_BASE_URL}/front/api/properties/?agency_id=${agencyId}`;
      console.log("📡 Llamando a API:", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Datos recibidos de la API:", data);

      // La API usa paginación, los resultados vienen en "results"
      const properties = data.results || data;
      setPropertiesData(Array.isArray(properties) ? properties : []);
      setTotalCount(data.count || properties.length || 0);

    } catch (err: any) {
      console.error("❌ Error al llamar a la API:", err);
      setApiError(err.message);
      setPropertiesData([]);
    }
  };

  useEffect(() => {
    // PASO 1: Leer location_id de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const locationFromUrl = urlParams.get('location_id') || urlParams.get('locationId');

    if (locationFromUrl) {
      console.log("✅ location_id recibido por URL:", locationFromUrl);
      setLocationId(locationFromUrl);
      fetchProperties(locationFromUrl).finally(() => setLoading(false));
      return;
    }

    // PASO 2: Fallback → postMessage con GHL
    let isResolved = false;

    const messageHandler = (event: MessageEvent) => {
      if (event.data.message === 'REQUEST_USER_DATA_RESPONSE') {
        console.log("✅ GHL respondió por postMessage:", event.data.payload);
        isResolved = true;
        // TODO: extraer location_id del payload de GHL
        setLoading(false);
      }
    };

    window.addEventListener('message', messageHandler);
    window.parent.postMessage({ message: 'REQUEST_USER_DATA' }, '*');

    const timer = setTimeout(() => {
      if (!isResolved) {
        setError("No se recibió el location_id.");
        setLoading(false);
      }
    }, 3000);

    return () => {
      window.removeEventListener('message', messageHandler);
      clearTimeout(timer);
    };
  }, []);

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Cargando propiedades...</p>
      </div>
    );
  }

  // Pantalla de error (sin location_id)
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center border-t-4 border-red-500">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Modo Diagnóstico</h2>
          <p className="text-gray-600 mb-4">No se recibió el <code className="bg-gray-100 px-1 rounded">location_id</code>.</p>

          <div className="bg-gray-100 p-4 rounded text-left text-sm font-mono break-all mb-4 border border-gray-300">
            <span className="text-blue-600 font-bold">URL actual:</span><br />
            {window.location.href}
            <br /><br />
            <span className="text-purple-600 font-bold">Parámetros detectados:</span><br />
            {window.location.search === "" ? "❌ Ningún parámetro recibido" : window.location.search}
          </div>

          <div className="bg-yellow-50 p-4 rounded text-left text-sm border border-yellow-300">
            <span className="text-yellow-700 font-bold">💡 Solución:</span><br />
            <p className="text-yellow-800 mt-1">Configura la URL con tu location_id real:</p>
            <code className="block bg-white mt-2 p-2 rounded border border-yellow-200 text-xs">
              https://pagprop.vercel.app/?location_id=TU_LOCATION_ID
            </code>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard principal
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="flex justify-end items-center px-4 py-2 border-b border-gray-200 gap-3">
        <button className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity">
          <Globe size={16} />
        </button>
        <button className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity">
          <Phone size={16} />
        </button>
        <button className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity">
          <Wand2 size={16} />
        </button>
        <button className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center relative hover:opacity-90 transition-opacity">
          <Megaphone size={16} />
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <button className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity">
          <Bell size={16} />
        </button>
        <button className="w-8 h-8 rounded-full bg-blue-400 text-white flex items-center justify-center hover:opacity-90 transition-opacity">
          <HelpCircle size={16} />
        </button>
        <button className="w-8 h-8 rounded-full bg-purple-400 text-white flex items-center justify-center font-medium text-sm hover:opacity-90 transition-opacity">
          FT
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Header Section */}
        <div className="flex justify-between items-center px-6 py-5">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-gray-900">Propiedades</h1>
            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
              {totalCount} Propiedades
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors text-sm">
              <Plus size={18} />
              Añadir Propiedad
            </button>
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-200 flex gap-6">
          <button className="flex items-center gap-2 pb-3 border-b-2 border-blue-600 text-blue-600 font-medium text-sm">
            <List size={18} />
            Todo
          </button>
          <button className="flex items-center gap-2 pb-3 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors">
            <List size={18} />
            Lista V1
          </button>
          <button className="flex items-center gap-2 pb-3 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors">
            <Plus size={18} />
            Lista
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Filter size={16} />
              Filtros avanzados
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 border border-blue-200 bg-blue-50 rounded-full text-sm font-medium text-blue-600 hover:bg-blue-100 transition-colors">
              <ArrowUpDown size={16} />
              Ordenar (1)
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar"
                className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            <button className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <Settings size={16} />
              Gestionar campos
            </button>
          </div>
        </div>

        {/* Error de API */}
        {apiError && (
          <div className="mx-6 mb-4 bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
            ⚠️ Error al conectar con la API: {apiError}
          </div>
        )}

        {/* Data Table */}
        <div className="flex-1 overflow-x-auto px-6 pb-6">
          <table className="w-full border-collapse min-w-max border border-gray-200">
            <thead>
              <tr className="border-b border-gray-200">
                {columns.map((col) => (
                  <th key={col.key} className="border-r border-gray-200 last:border-r-0 p-3 text-left text-sm font-semibold text-gray-700 bg-white whitespace-nowrap">
                    <div className="flex items-center justify-between gap-4">
                      {col.label}
                      <ChevronsUpDown size={14} className="text-gray-400 cursor-pointer hover:text-gray-600" />
                    </div>
                  </th>
                ))}
                <th className="p-3 bg-white w-full"></th>
              </tr>
            </thead>
            <tbody>
              {propertiesData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center py-8 text-gray-500">
                    No se encontraron propiedades para esta agencia.
                  </td>
                </tr>
              ) : (
                propertiesData.map((row, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    {/* ID */}
                    <td className="border-r border-gray-200 p-3 text-sm text-gray-800 font-mono">
                      {row.id ? row.id.substring(0, 8) + '...' : '-'}
                    </td>
                    {/* Título */}
                    <td className="border-r border-gray-200 p-3 text-sm text-gray-800 max-w-xs truncate">
                      {row.title || '-'}
                    </td>
                    {/* Precio */}
                    <td className="border-r border-gray-200 p-3 text-sm text-gray-800 font-medium">
                      {row.price ? `${Number(row.price).toLocaleString('es-ES')} €` : '-'}
                    </td>
                    {/* Habitaciones */}
                    <td className="border-r border-gray-200 p-3 text-sm text-gray-800 text-center">
                      {row.beds ?? '-'}
                    </td>
                    {/* Metros */}
                    <td className="border-r border-gray-200 p-3 text-sm text-gray-800">
                      {row.sqm ? `${row.sqm} m²` : '-'}
                    </td>
                    {/* Zona */}
                    <td className="border-r border-gray-200 p-3 text-sm text-gray-800">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                        {row.location || 'Sin zona'}
                      </span>
                    </td>
                    {/* Tipo */}
                    <td className="border-r border-gray-200 p-3 text-sm text-gray-800">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.type === 'Villa' ? 'bg-purple-50 text-purple-700' :
                          row.type === 'Studio' ? 'bg-orange-50 text-orange-700' :
                            'bg-green-50 text-green-700'
                        }`}>
                        {row.type || '-'}
                      </span>
                    </td>
                    {/* Características */}
                    <td className="border-r border-gray-200 p-3 text-sm text-gray-800">
                      <div className="flex flex-wrap gap-1">
                        {row.features && row.features.length > 0 ? (
                          row.features.map((f: string, i: number) => (
                            <span key={i} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                              {f}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    {/* Imágenes */}
                    <td className="border-r border-gray-200 p-3 text-sm text-gray-800 text-center">
                      {row.images && row.images.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <ImageIcon size={14} className="text-green-500" />
                          <span className="text-xs">{row.images.length}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">0</span>
                      )}
                    </td>
                    {/* Destacada */}
                    <td className="border-r border-gray-200 p-3 text-sm text-center">
                      {row.isFeatured ? (
                        <Star size={16} className="text-yellow-500 fill-yellow-500 inline" />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="p-3 text-sm text-gray-800"></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
