/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Globe, Phone, Wand2, Megaphone, Bell, HelpCircle, 
  MoreVertical, List, Plus, Filter, ArrowUpDown, 
  Search, Settings, ChevronsUpDown 
} from 'lucide-react';

const columns = [
  { key: 'id', label: 'Id' },
  { key: 'precio', label: 'Prec...' },
  { key: 'habitaciones', label: 'Habi...' },
  { key: 'imagenes', label: 'Imagene...' },
  { key: 'metros', label: 'Metr...' },
  { key: 'aLaVenta', label: '¿La ...' },
  { key: 'tiene1', label: '¿Tie...' },
  { key: 'tiene2', label: '¿Tie...' },
  { key: 'deja', label: '¿Dej...' },
  { key: 'tiene3', label: '¿Tie...' },
  { key: 'christian', label: 'christian' },
  { key: 'zona', label: 'Zona' },
];

export default function App() {
  // 1. Estados para manejar los datos, la carga y los errores
  const [propertiesData, setPropertiesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Efecto para leer GHL y llamar a Django al cargar la página
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const locationId = urlParams.get('locationId');
    const sessionKey = urlParams.get('sessionKey');

    if (locationId) {
      // AQUÍ DEBERÁS PONER LA URL REAL DE TU SERVIDOR DJANGO MÁS ADELANTE
      // Por ahora, he puesto una URL de ejemplo.
      const apiUrl = `https://api.tu-django.com/obtener-propiedades/?locationId=${locationId}`;
      
      fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionKey}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Error en la respuesta del servidor');
        }
        return response.json();
      })
      .then(data => {
        setPropertiesData(data); // Guardamos los datos reales
        setLoading(false); // Quitamos la pantalla de carga
      })
      .catch(err => {
        console.error("Error conectando con Django:", err);
        // Si falla la API (como ahora que aún no existe), para que puedas seguir viendo 
        // tu diseño, inyectaremos unos datos de prueba temporalmente.
        setPropertiesData([
          { id: 1, precio: '$5', habitaciones: 5, imagenes: '', metros: 6, aLaVenta: 'A la venta', tiene1: 'Si', tiene2: 'Si', deja: 'Si', tiene3: 'Si', christian: 'web, foto...', zona: 'Centro' },
          { id: 2, precio: '$4', habitaciones: 6, imagenes: '', metros: 5, aLaVenta: 'A la venta', tiene1: 'No', tiene2: 'No', deja: 'No', tiene3: 'No', christian: 'web', zona: 'Norte' },
        ]);
        setLoading(false);
      });

    } else {
      // Seguridad: Si se abre fuera de GHL, bloqueamos la vista
      setError("Acceso denegado. Esta página solo funciona dentro de Go High Level.");
      setLoading(false);
    }
  }, []);

  // 3. Pantallas de Carga y Error
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Cargando datos de la agencia...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center border-t-4 border-red-500">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error de Autenticación</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // 4. Tu interfaz original (Renderizado cuando ya hay datos)
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
              {propertiesData.length} Propiedades
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
                    <td className="border-r border-gray-200 p-3 text-sm text-gray-800">{row.id}</td>
                    <td className="border-r border-gray-200 p-3 text-sm text-gray-800">{row.precio}</td>
                    <td className="border-r border-gray-200 p-3 text-sm text-gray-800">{row.habitaciones}</td>
                    <td className="border-r border-gray-200 p-3 text-sm text-gray-800">
                      {row.imagenes && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs border border-gray-200">
                          {row.imagenes}
                        </span>
                      )}
                    </td>
                    <td className="border-r border-gray-200 p-3 text-sm text-gray-800">{row.metros}</td>
                    <td className="border-r border-gray-200 p-3 text-sm text-gray-800">{row.aLaVenta}</td>
                    <td className="border-r border-gray-200 p-3 text-sm text-gray-800">{row.tiene1}</td>
                    <td className="border-r border-gray-200 p-3 text-sm text-gray-800">{row.tiene2}</td>
                    <td className="border-r border-gray-200 p-3 text-sm text-gray-800">{row.deja}</td>
                    <td className="border-r border-gray-200 p-3 text-sm text-gray-800">{row.tiene3}</td>
                    <td className="border-r border-gray-200 p-3 text-sm text-gray-800">{row.christian}</td>
                    <td className="border-r border-gray-200 p-3 text-sm text-gray-800">{row.zona}</td>
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
