/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Globe, Phone, Wand2, Megaphone, Bell, HelpCircle,
  MoreVertical, List, Plus, Filter, ArrowUpDown,
  Search, Settings, ChevronsUpDown, Star, ImageIcon,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  LayoutGrid, Table, CheckSquare, Square, X, Minus,
  Info, Link2, CheckSquare2, Trash2, RotateCcw,
  ArrowUp, ArrowDown, GripVertical, Lock,
  FileText, Edit3, Save
} from 'lucide-react';
import { useMemo } from 'react';

// URL base: en DEV usa el proxy de Vite, en producción la URL directa de Railway
// Para producción, cambia esto de vuelta a: 'https://web-production-2573f.up.railway.app'
const API_BASE_URL = '';

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
];

export default function App() {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [propertiesData, setPropertiesData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table');
  const [cardImageIndex, setCardImageIndex] = useState<Record<number, number>>({});
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const [editingProperty, setEditingProperty] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const originalEditFormRef = React.useRef<any>({});
  const [infoOpen, setInfoOpen] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; index: number } | null>(null);
  const [panelTab, setPanelTab] = useState<'info' | 'associations' | 'notes'>('info');

  // --- Notas ---
  type Note = { id: string; title: string; content: string; createdAt: string; updatedAt: string };
  const [propertyNotes, setPropertyNotes] = useState<Note[]>([]);
  const [noteForm, setNoteForm] = useState({ title: '', content: '' });
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteForm, setEditNoteForm] = useState({ title: '', content: '' });
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [contactsOpen, setContactsOpen] = useState(true);
  const [trabajadoresOpen, setTrabajadoresOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const defaultFilters = {
    priceMin: '',
    priceMax: '',
    beds: null as number | null,
    sqmMin: '',
    sqmMax: '',
    location: '',
    types: [] as string[],
    isFeatured: null as boolean | null,
  };

  const loadSavedFilters = () => {
    try {
      const saved = localStorage.getItem('propertyFilters');
      if (saved) return JSON.parse(saved);
    } catch { }
    return defaultFilters;
  };

  const loadSavedSort = () => {
    try {
      const saved = localStorage.getItem('propertySort');
      if (saved) return saved;
    } catch { }
    return 'default';
  };

  const loadSavedColumns = () => {
    try {
      const saved = localStorage.getItem('propertyColumns');
      if (saved) return JSON.parse(saved);
    } catch { }
    return columns.map(c => c.key);
  };

  const loadSavedColumnOrder = () => {
    try {
      const saved = localStorage.getItem('propertyColumnOrder');
      if (saved) return JSON.parse(saved);
    } catch { }
    return columns.map(c => c.key);
  };

  const [filters, setFilters] = useState(loadSavedFilters);
  const [activeFilters, setActiveFilters] = useState(loadSavedFilters);
  const [sortOption, setSortOption] = useState<string>(loadSavedSort);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [visibleColumns, setVisibleColumns] = useState<string[]>(loadSavedColumns);
  const [columnOrder, setColumnOrder] = useState<string[]>(loadSavedColumnOrder);
  const [showFieldsPanel, setShowFieldsPanel] = useState(false);
  const [tempVisibleColumns, setTempVisibleColumns] = useState<string[]>([]);
  const [tempColumnOrder, setTempColumnOrder] = useState<string[]>([]);
  const [fieldsSearchQuery, setFieldsSearchQuery] = useState('');
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [availableLocations, setAvailableLocations] = useState<any[]>([]);

  // Obtener zonas y tipos únicos de los datos
  const uniqueLocations = useMemo(() => {
    const locs = propertiesData.map(p => p.location).filter(Boolean);
    return [...new Set(locs)].sort();
  }, [propertiesData]);

  const uniqueTypes = useMemo(() => {
    const types = propertiesData.map(p => p.type).filter(Boolean);
    return [...new Set(types)].sort();
  }, [propertiesData]);

  // Datos filtrados y ordenados
  const filteredData = useMemo(() => {
    let result = propertiesData.filter(row => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          (row.id && String(row.id).toLowerCase().includes(query)) ||
          (row.title && String(row.title).toLowerCase().includes(query)) ||
          (row.location && String(row.location).toLowerCase().includes(query)) ||
          (row.type && String(row.type).toLowerCase().includes(query)) ||
          (row.features && Array.isArray(row.features) && row.features.some((f: string) => f.toLowerCase().includes(query)));

        if (!matchesQuery) return false;
      }

      if (activeFilters.priceMin && Number(row.price) < Number(activeFilters.priceMin)) return false;
      if (activeFilters.priceMax && Number(row.price) > Number(activeFilters.priceMax)) return false;
      if (activeFilters.beds !== null && row.beds !== activeFilters.beds) return false;
      if (activeFilters.sqmMin && Number(row.sqm) < Number(activeFilters.sqmMin)) return false;
      if (activeFilters.sqmMax && Number(row.sqm) > Number(activeFilters.sqmMax)) return false;
      if (activeFilters.location && row.location !== activeFilters.location) return false;
      if (activeFilters.types.length > 0 && !activeFilters.types.includes(row.type)) return false;
      if (activeFilters.isFeatured !== null && row.isFeatured !== activeFilters.isFeatured) return false;
      return true;
    });

    if (sortOption !== 'default') {
      result.sort((a, b) => {
        const valA = Number(a[sortOption.split('_')[0]]) || 0;
        const valB = Number(b[sortOption.split('_')[0]]) || 0;
        return sortOption.endsWith('_asc') ? valA - valB : valB - valA;
      });
    }

    return result;
  }, [propertiesData, activeFilters, sortOption, searchQuery]);

  // Resetear página cuando cambian filtros, búsqueda u orden
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilters, sortOption, searchQuery]);

  // Hacer scroll hacia arriba cuando se cambia de página
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeFilters.priceMin || activeFilters.priceMax) count++;
    if (activeFilters.beds !== null) count++;
    if (activeFilters.sqmMin || activeFilters.sqmMax) count++;
    if (activeFilters.location) count++;
    if (activeFilters.types.length > 0) count++;
    if (activeFilters.isFeatured !== null) count++;
    return count;
  }, [activeFilters]);

  const applyFilters = (f: typeof defaultFilters) => {
    setActiveFilters(f);
    localStorage.setItem('propertyFilters', JSON.stringify(f));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setActiveFilters(defaultFilters);
    localStorage.removeItem('propertyFilters');
  };

  const applySort = (option: string) => {
    setSortOption(option);
    localStorage.setItem('propertySort', option);
    setShowSortMenu(false);
  };

  const openFieldsPanel = () => {
    setTempVisibleColumns(visibleColumns);
    setTempColumnOrder(columnOrder);
    setFieldsSearchQuery('');
    setDraggedColumnIndex(null);
    setShowFieldsPanel(true);
  };

  const applyFieldsConfig = () => {
    // Si ID fue desmarcado por error, asegurar que esté
    const finalVisible = tempVisibleColumns.includes('id') ? tempVisibleColumns : ['id', ...tempVisibleColumns];
    setVisibleColumns(finalVisible);
    setColumnOrder(tempColumnOrder);
    localStorage.setItem('propertyColumns', JSON.stringify(finalVisible));
    localStorage.setItem('propertyColumnOrder', JSON.stringify(tempColumnOrder));
    setShowFieldsPanel(false);
  };

  const toggleTempColumn = (key: string) => {
    if (key === 'id') return; // no se puede desmarcar
    const newCols = tempVisibleColumns.includes(key)
      ? tempVisibleColumns.filter(c => c !== key)
      : [...tempVisibleColumns, key];
    setTempVisibleColumns(newCols);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColumnIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedColumnIndex === null || draggedColumnIndex === index) return;
    const newOrder = [...tempColumnOrder];
    const draggedKey = newOrder[draggedColumnIndex];
    newOrder.splice(draggedColumnIndex, 1);
    newOrder.splice(index, 0, draggedKey);
    setTempColumnOrder(newOrder);
    setDraggedColumnIndex(index);
  };

  // --- Notas: persistencia en localStorage ---
  const loadNotes = (propertyId: string) => {
    try {
      const saved = localStorage.getItem(`propertyNotes_${propertyId}`);
      if (saved) {
        setPropertyNotes(JSON.parse(saved));
      } else {
        setPropertyNotes([]);
      }
    } catch {
      setPropertyNotes([]);
    }
    setIsAddingNote(false);
    setEditingNoteId(null);
    setNoteSearchQuery('');
  };

  const saveNotes = (propertyId: string, notes: Note[]) => {
    localStorage.setItem(`propertyNotes_${propertyId}`, JSON.stringify(notes));
  };

  const toggleFeaturedStatus = async (property: any) => {
    if (!property.id) return;

    const newValue = !property.isFeatured;

    // Actualización optimista local
    setPropertiesData(prev =>
      prev.map(p => p.id === property.id ? { ...p, isFeatured: newValue } : p)
    );

    try {
      const url = `${API_BASE_URL}/api/properties/${property.id}/`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: newValue }),
      });

      if (!response.ok) {
        console.warn(`No se pudo guardar en el servidor (${response.status}), pero el cambio se mantiene localmente.`);
      }
    } catch (err: any) {
      console.warn("Error al guardar destacada en el servidor:", err.message);
    }
  };

  const openEditPanel = (row: any) => {
    setEditingProperty(row);
    const form = {
      id: row.id || '',
      title: row.title || '',
      price: row.price || 0,
      beds: row.beds || 0,
      sqm: row.sqm || 0,
      location: row.location || '',
      type: row.type || '',
      features: row.features ? (Array.isArray(row.features) ? row.features.join(', ') : row.features) : '',
      isFeatured: row.isFeatured || false,
      images: row.images ? [...row.images] : [],
      estado: row.estado || 'Activo',
      animales: row.animales || 'No',
      balcon: row.balcon || 'No',
      garaje: row.garaje || 'No',
      patioInterior: row.patioInterior || 'No',
    };
    setEditForm(form);
    originalEditFormRef.current = form;
    setInfoOpen(true);
    setLightboxImage(null);
    setPanelTab('info');
    // Cargar notas de esta propiedad
    if (row.id) loadNotes(row.id);
  };

  const openAddPanel = () => {
    setEditingProperty({ isNew: true });
    const form = {
      id: '',
      title: '',
      price: 0,
      beds: 0,
      sqm: 0,
      location: '',
      type: '',
      features: '',
      isFeatured: false,
      images: [],
      estado: 'Activo',
      animales: 'No',
      balcon: 'No',
      garaje: 'No',
      patioInterior: 'No',
    };
    setEditForm(form);
    originalEditFormRef.current = form;
    setInfoOpen(true);
    setLightboxImage(null);
    setPanelTab('info');
    setPropertyNotes([]);
  };

  const closeEditPanel = (force = false) => {
    if (!force) {
      const isDirty = JSON.stringify(editForm) !== JSON.stringify(originalEditFormRef.current);
      if (isDirty && !window.confirm('Tienes cambios sin guardar. ¿Seguro que quieres salir?')) return;
    }
    setEditingProperty(null);
    setEditForm({});
  };

  const handleSaveProperty = async () => {
    setIsSaving(true);
    try {
      let formPriceStr = String(editForm.price).trim();
      if (!formPriceStr.startsWith('€') && !formPriceStr.startsWith('$')) {
        formPriceStr = '€' + formPriceStr;
      }

      const payload = {
        agencia: locationId,
        ghl_contact_id: '',
        precio: formPriceStr,
        habitaciones: editForm.beds,
        estado: editForm.estado,
        animales: editForm.animales,
        metros: editForm.sqm,
        balcon: editForm.balcon,
        garaje: editForm.garaje,
        patioInterior: editForm.patioInterior,
        imagenesUrl: editForm.images || [],

        // Enviamos también los campos estandar
        title: editForm.title,
        location: editForm.location,
        type: editForm.type,
        features: editForm.features ? editForm.features.split(',').map((f: string) => f.trim()) : [],
        isFeatured: editForm.isFeatured
      };

      const esNuevo = editingProperty?.isNew;
      let url = `${API_BASE_URL}/api/properties/`;
      let method = 'POST';

      if (!esNuevo && editForm.id) {
        url = `${API_BASE_URL}/api/properties/${editForm.id}/`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      closeEditPanel(true);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (locationId) {
        await fetchProperties(locationId);
      }
    } catch (err: any) {
      console.error(err);
      alert("No se pudo guardar la propiedad: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Función para cargar propiedades desde la API de Django
  const fetchProperties = async (agencyId: string) => {
    try {
      const url = `${API_BASE_URL}/api/properties/?agency_id=${agencyId}`;
      console.log("📡 Llamando a API:", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Datos recibidos de la API:", data);

      const properties = data.results || data;
      setPropertiesData(Array.isArray(properties) ? properties : []);
      setTotalCount(data.count || properties.length || 0);

    } catch (err: any) {
      console.error("❌ Error al llamar a la API:", err);
      setApiError(err.message);
      setPropertiesData([]);
    }
  };

  // Función para cargar zonas disponibles de la agencia
  const fetchLocations = async (agencyId: string) => {
    try {
      const url = `${API_BASE_URL}/api/locations/?agency_id=${agencyId}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAvailableLocations(data.locations || []);
      }
    } catch (err) {
      console.error("❌ Error al cargar zonas:", err);
    }
  };

  // Función para desencriptar el payload SSO via Django
  const decryptSSO = async (encryptedPayload: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/api/decrypt-sso/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encryptedData: encryptedPayload }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Error HTTP ${response.status}`);
    }

    return response.json();
  };

  useEffect(() => {
    const FALLBACK_LOCATION_ID = 'Qqg3dS8LsYYc0QQGEfVZ';

    const loadWithId = (id: string) => {
      setLocationId(id);
      fetchLocations(id);
      fetchProperties(id).finally(() => setLoading(false));
    };

    // PASO 1: location_id por URL (máxima prioridad)
    const urlParams = new URLSearchParams(window.location.search);
    const locationFromUrl = urlParams.get('location_id') || urlParams.get('locationId');
    if (locationFromUrl) {
      console.log("✅ location_id por URL:", locationFromUrl);
      loadWithId(locationFromUrl);
      return;
    }

    // PASO 2: Si estamos dentro de un iframe (GHL), intentar SSO
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      let isResolved = false;

      const messageHandler = async (event: MessageEvent) => {
        if (event.data.message === 'REQUEST_USER_DATA_RESPONSE' && !isResolved) {
          isResolved = true;
          try {
            const userData = await decryptSSO(event.data.payload);
            const activeLocation = userData.activeLocation || userData.companyId;
            if (!activeLocation) throw new Error('No se encontró activeLocation en el SSO');
            console.log("✅ SSO GHL OK:", activeLocation);
            loadWithId(activeLocation);
          } catch (err: any) {
            console.warn("⚠️ SSO falló, usando fallback:", err.message);
            loadWithId(FALLBACK_LOCATION_ID);
          }
        }
      };

      window.addEventListener('message', messageHandler);
      window.parent.postMessage({ message: 'REQUEST_USER_DATA' }, '*');

      const timer = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          console.warn("⚠️ SSO timeout, usando fallback");
          loadWithId(FALLBACK_LOCATION_ID);
        }
      }, 4000);

      return () => {
        window.removeEventListener('message', messageHandler);
        clearTimeout(timer);
      };
    }

    // PASO 3: Navegador directo (fuera de GHL) → usar ID fijo
    console.log("🌐 Navegador externo, usando location_id fijo:", FALLBACK_LOCATION_ID);
    loadWithId(FALLBACK_LOCATION_ID);
  }, []);

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Conectando con Go High Level...</p>
      </div>
    );
  }

  // Pantalla de error (sin location_id)
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center border-t-4 border-red-500">
          <h2 className="text-xl font-bold text-gray-900 mb-2">No se pudo conectar</h2>
          <p className="text-gray-600 mb-4">{error}</p>

          <div className="bg-gray-100 p-4 rounded text-left text-sm font-mono break-all mb-4 border border-gray-300">
            <span className="text-blue-600 font-bold">URL actual:</span><br />
            {window.location.href}
            <br /><br />
            <span className="text-purple-600 font-bold">Parámetros:</span><br />
            {window.location.search === "" ? "❌ Ningún parámetro" : window.location.search}
          </div>

          <div className="bg-yellow-50 p-4 rounded text-left text-sm border border-yellow-300">
            <span className="text-yellow-700 font-bold">💡 Posibles soluciones:</span>
            <ul className="text-yellow-800 mt-2 list-disc pl-4 space-y-1">
              <li>Verifica que la app esté instalada desde el Marketplace</li>
              <li>Verifica que el <strong>Shared Secret</strong> esté configurado en Railway</li>
              <li>Como alternativa, usa: <code className="bg-white px-1 rounded text-xs">?location_id=TU_ID</code></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard principal
  return (
    <div className="h-screen overflow-hidden bg-white font-sans text-gray-900 flex flex-col">


      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Section */}
        <div className="flex justify-between items-center px-6 py-5">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-gray-900">Propiedades</h1>
            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
              {activeFilterCount > 0 ? `${filteredData.length} / ${totalCount}` : totalCount} Propiedades
            </span>
            
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openAddPanel}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors text-sm cursor-pointer"
            >
              <Plus size={18} />
              Añadir Propiedad
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-200 flex gap-6">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 pb-3 font-medium text-sm transition-colors cursor-pointer ${viewMode === 'table'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <Table size={18} />
            Tabla
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 pb-3 font-medium text-sm transition-colors cursor-pointer ${viewMode === 'list'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <LayoutGrid size={18} />
            Lista
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-full text-sm font-medium transition-colors cursor-pointer ${activeFilterCount > 0
                  ? 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              <Filter size={16} />
              Filtros avanzados{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-full text-sm font-medium transition-colors cursor-pointer ${sortOption !== 'default'
                    ? 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <ArrowUpDown size={16} />
                Ordenar {sortOption !== 'default' && '(1)'}
              </button>

              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)}></div>
                  <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-2">
                    <div className="px-4 py-2 border-b border-gray-100 font-medium text-sm text-gray-900">
                      Ordenar propiedades por
                    </div>

                    <button
                      onClick={() => applySort('default')}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer ${sortOption === 'default' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <span>Por defecto</span>
                    </button>

                    <div className="px-4 py-1.5 mt-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Precio</div>
                    <button
                      onClick={() => applySort('price_asc')}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors cursor-pointer ${sortOption === 'price_asc' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <span className="flex items-center gap-2">De menor a mayor</span>
                      <ArrowUp size={14} className={sortOption === 'price_asc' ? 'text-blue-600' : 'text-gray-400'} />
                    </button>
                    <button
                      onClick={() => applySort('price_desc')}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors cursor-pointer ${sortOption === 'price_desc' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <span className="flex items-center gap-2">De mayor a menor</span>
                      <ArrowDown size={14} className={sortOption === 'price_desc' ? 'text-blue-600' : 'text-gray-400'} />
                    </button>

                    <div className="px-4 py-1.5 mt-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Habitaciones</div>
                    <button
                      onClick={() => applySort('beds_asc')}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors cursor-pointer ${sortOption === 'beds_asc' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <span className="flex items-center gap-2">De menor a mayor</span>
                      <ArrowUp size={14} className={sortOption === 'beds_asc' ? 'text-blue-600' : 'text-gray-400'} />
                    </button>
                    <button
                      onClick={() => applySort('beds_desc')}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors cursor-pointer ${sortOption === 'beds_desc' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <span className="flex items-center gap-2">De mayor a menor</span>
                      <ArrowDown size={14} className={sortOption === 'beds_desc' ? 'text-blue-600' : 'text-gray-400'} />
                    </button>

                    <div className="px-4 py-1.5 mt-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Metros²</div>
                    <button
                      onClick={() => applySort('sqm_asc')}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors cursor-pointer ${sortOption === 'sqm_asc' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <span className="flex items-center gap-2">De menor a mayor</span>
                      <ArrowUp size={14} className={sortOption === 'sqm_asc' ? 'text-blue-600' : 'text-gray-400'} />
                    </button>
                    <button
                      onClick={() => applySort('sqm_desc')}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors cursor-pointer ${sortOption === 'sqm_desc' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <span className="flex items-center gap-2">De mayor a menor</span>
                      <ArrowDown size={14} className={sortOption === 'sqm_desc' ? 'text-blue-600' : 'text-gray-400'} />
                    </button>
                  </div>
                </>
              )}
            </div>
            {viewMode === 'list' && (
              <button
                onClick={() => {
                  const allExpanded = filteredData.length > 0 && filteredData.every((_, i) => expandedCards[i]);
                  if (allExpanded) {
                    setExpandedCards({});
                  } else {
                    const all: Record<number, boolean> = {};
                    filteredData.forEach((_, i) => { all[i] = true; });
                    setExpandedCards(all);
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {filteredData.length > 0 && filteredData.every((_, i) => expandedCards[i])
                  ? <CheckSquare size={16} />
                  : <Square size={16} />}
                Expandir todo
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar propiedades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 py-1.5 bg-transparent text-sm focus:outline-none w-64"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={openFieldsPanel}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <Settings size={16} />
              Gestionar campos
            </button>
          </div>
        </div>

        {/* Panel de filtros avanzados */}
        {showFilters && (
          <div className="mx-6 mb-4 bg-white border border-gray-200 rounded-xl shadow-sm p-5 animate-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

              {/* Precio */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Precio (€)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Mín"
                    value={filters.priceMin}
                    onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-400 text-sm">—</span>
                  <input
                    type="number"
                    placeholder="Máx"
                    value={filters.priceMax}
                    onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Habitaciones */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Habitaciones</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setFilters({ ...filters, beds: filters.beds === n ? null : n })}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors cursor-pointer ${filters.beds === n
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {n === 5 ? '5+' : n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metros² */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Metros²</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Mín"
                    value={filters.sqmMin}
                    onChange={(e) => setFilters({ ...filters, sqmMin: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-400 text-sm">—</span>
                  <input
                    type="number"
                    placeholder="Máx"
                    value={filters.sqmMax}
                    onChange={(e) => setFilters({ ...filters, sqmMax: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Zona */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Zona</label>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                >
                  <option value="">Todas las zonas</option>
                  {uniqueLocations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
                <div className="flex flex-wrap gap-2">
                  {uniqueTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        const types = filters.types.includes(type)
                          ? filters.types.filter(t => t !== type)
                          : [...filters.types, type];
                        setFilters({ ...filters, types });
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${filters.types.includes(type)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                  {uniqueTypes.length === 0 && (
                    <span className="text-xs text-gray-400">Sin tipos disponibles</span>
                  )}
                </div>
              </div>

              {/* Destacada */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Destacada</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, isFeatured: filters.isFeatured === true ? null : true })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${filters.isFeatured === true
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <Star size={12} />
                    Sí
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, isFeatured: filters.isFeatured === false ? null : false })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${filters.isFeatured === false
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    No
                  </button>
                </div>
              </div>

            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <RotateCcw size={14} />
                Limpiar filtros
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    applyFilters(filters);
                    setShowFilters(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error de API */}
        {apiError && (
          <div className="mx-6 mb-4 bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
            ⚠️ Error al conectar con la API: {apiError}
          </div>
        )}

        {/* Data Table */}
        {viewMode === 'table' && (
          <div ref={scrollContainerRef} className="flex-1 overflow-auto px-6 pb-6">
            <table className="w-full border-collapse min-w-max border border-gray-200">
              <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#e5e7eb,0_2px_4px_0_rgba(0,0,0,0.05)]">
                <tr className="border-b border-gray-200">
                  {columnOrder.filter(key => key !== 'id' && visibleColumns.includes(key)).map(key => {
                    const col = columns.find(c => c.key === key);
                    if (!col) return null;
                    return (
                      <th key={col.key} className="border-r border-gray-200 last:border-r-0 p-3 text-left text-sm font-semibold text-gray-700 bg-white whitespace-nowrap">
                        <div className="flex items-center justify-between gap-4">
                          {col.label}
                          <ChevronsUpDown size={14} className="text-gray-400 cursor-pointer hover:text-gray-600" />
                        </div>
                      </th>
                    );
                  })}
                  <th className="p-3 bg-white w-full"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="text-center py-8 text-gray-500">
                      No se encontraron propiedades para esta agencia.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, index) => (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openEditPanel(row)}>
                      {columnOrder.filter(key => key !== 'id' && visibleColumns.includes(key)).map(key => {
                        if (key === 'title') return (
                          <td key="title" className="border-r border-gray-200 p-3 text-sm text-gray-800 max-w-xs">
                            <div className="flex items-start justify-between gap-2">
                              <span className="truncate flex-1" title={row.title || '-'}>{row.title || '-'}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFeaturedStatus(row);
                                }}
                                className="focus:outline-none cursor-pointer hover:scale-110 transition-transform shrink-0 -mt-0.5"
                                title={row.isFeatured ? "Quitar destacada" : "Marcar como destacada"}
                              >
                                {row.isFeatured ? (
                                  <Star size={16} className="text-yellow-500 fill-yellow-500 inline" />
                                ) : (
                                  <Star size={16} className="text-gray-300 hover:text-yellow-400 inline" />
                                )}
                              </button>
                            </div>
                          </td>
                        );
                        if (key === 'price') return (
                          <td key="price" className="border-r border-gray-200 p-3 text-sm text-gray-800 font-medium">
                            {row.price ? `${Number(row.price).toLocaleString('es-ES')} €` : '-'}
                          </td>
                        );
                        if (key === 'beds') return (
                          <td key="beds" className="border-r border-gray-200 p-3 text-sm text-gray-800 text-center">
                            {row.beds ?? '-'}
                          </td>
                        );
                        if (key === 'sqm') return (
                          <td key="sqm" className="border-r border-gray-200 p-3 text-sm text-gray-800">
                            {row.sqm ? `${row.sqm} m²` : '-'}
                          </td>
                        );
                        if (key === 'location') return (
                          <td key="location" className="border-r border-gray-200 p-3 text-sm text-gray-800">
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                              {row.location || 'Sin zona'}
                            </span>
                          </td>
                        );
                        if (key === 'type') return (
                          <td key="type" className="border-r border-gray-200 p-3 text-sm text-gray-800">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.type === 'Villa' ? 'bg-purple-50 text-purple-700' :
                              row.type === 'Studio' ? 'bg-orange-50 text-orange-700' :
                                'bg-green-50 text-green-700'
                              }`}>
                              {row.type || '-'}
                            </span>
                          </td>
                        );
                        if (key === 'features') return (
                          <td key="features" className="border-r border-gray-200 p-3 text-sm text-gray-800">
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
                        );
                        if (key === 'images') return (
                          <td key="images" className="border-r border-gray-200 p-3 text-sm text-gray-800 text-center">
                            {row.images && row.images.length > 0 ? (
                              <div className="flex items-center gap-1">
                                <ImageIcon size={14} className="text-green-500" />
                                <span className="text-xs">{row.images.length}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">0</span>
                            )}
                          </td>
                        );

                        return null;
                      })}
                      <td className="p-3 text-sm text-gray-800"></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Card List View */}
        {viewMode === 'list' && (
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 pb-6">
            {paginatedData.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No se encontraron propiedades para esta agencia.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
                {paginatedData.map((row, index) => {
                  const images = row.images || [];
                  const currentImg = cardImageIndex[index] || 0;
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden bg-white cursor-pointer" onClick={() => openEditPanel(row)}>
                      {/* Imagen con flechas */}
                      <div className="relative w-full h-48 bg-gray-100">
                        {images.length > 0 ? (
                          <img
                            src={images[currentImg]}
                            alt={row.title || 'Propiedad'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ImageIcon size={40} />
                          </div>
                        )}
                        {images.length > 1 && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCardImageIndex((prev) => ({
                                  ...prev,
                                  [index]: currentImg === 0 ? images.length - 1 : currentImg - 1,
                                }));
                              }}
                              className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 shadow"
                            >
                              <ChevronLeft size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCardImageIndex((prev) => ({
                                  ...prev,
                                  [index]: currentImg === images.length - 1 ? 0 : currentImg + 1,
                                }));
                              }}
                              className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 shadow"
                            >
                              <ChevronRight size={18} />
                            </button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                              {currentImg + 1} / {images.length}
                            </div>
                          </>
                        )}
                      </div>
                      {/* Precio y ubicación */}
                      <div className="p-3">
                        <p className="text-base font-semibold text-gray-900">
                          {row.price ? `${Number(row.price).toLocaleString('es-ES')} €` : 'Precio no disponible'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {row.location || 'Sin ubicación'}
                        </p>
                        {/* Botón desplegable */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCards((prev) => ({
                              ...prev,
                              [index]: !prev[index],
                            }));
                          }}
                          className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {expandedCards[index] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {expandedCards[index] ? 'Menos detalles' : 'Más detalles'}
                        </button>
                        {/* Datos desplegados */}
                        {expandedCards[index] && (
                          <div className="mt-2 pt-2 border-t border-gray-100 space-y-1 text-sm">
                            <p className="text-gray-700"><span className="font-medium">Título:</span> {row.title || '-'}</p>
                            <p className="text-gray-700"><span className="font-medium">Habitaciones:</span> {row.beds ?? '-'}</p>
                            <p className="text-gray-700"><span className="font-medium">Metros²:</span> {row.sqm ? `${row.sqm} m²` : '-'}</p>
                            <p className="text-gray-700"><span className="font-medium">Tipo:</span> {row.type || '-'}</p>
                            <div className="text-gray-700">
                              <span className="font-medium">Características:</span>{' '}
                              {row.features && row.features.length > 0
                                ? row.features.join(', ')
                                : '—'}
                            </div>
                            <div className="text-gray-700 flex items-center gap-2">
                              <span className="font-medium">Destacada:</span>{' '}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFeaturedStatus(row);
                                }}
                                className="flex items-center gap-1.5 focus:outline-none cursor-pointer hover:scale-105 transition-transform"
                              >
                                {row.isFeatured ? (
                                  <><Star size={14} className="text-yellow-500 fill-yellow-500" /> Sí</>
                                ) : (
                                  <><Star size={14} className="text-gray-300 hover:text-yellow-400" /> No</>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {/* Paginación */}
        {filteredData.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
            <span className="text-sm text-gray-600">
              Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} de {filteredData.length} propiedades
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                .reduce<(number | string)[]>((acc, page, idx, arr) => {
                  if (idx > 0 && page - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(page);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === '...' ? (
                    <span key={`dots-${idx}`} className="px-2 text-gray-400 text-sm">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item as number)}
                      className={`w-8 h-8 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                        currentPage === item
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Panel lateral de edición */}
      {editingProperty && (
        <>
          {/* Fondo oscuro */}
          <div className="fixed inset-0 bg-black/30 z-40" onClick={closeEditPanel}></div>
          {/* Panel */}
          <div className="fixed top-0 right-0 h-full z-50 flex">
            {/* Contenido principal del panel */}
            <div className="w-full max-w-md bg-white shadow-2xl flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900">
                  {editingProperty?.isNew ? 'Añadir Nueva Propiedad' : `Editar Los Detalles De ${editForm.id ? editForm.id.substring(0, 8) : ''}`}
                </h2>
                <div className="flex items-center gap-2">
                  {/* Menu de opciones extra */}
                  {!editingProperty?.isNew && (
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors cursor-pointer"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {menuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)}></div>
                          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[180px]">
                            <button
                              onClick={() => {
                                setMenuOpen(false);
                                // Aquí iría la lógica de eliminar
                                if (confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) {
                                  closeEditPanel();
                                }
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 size={16} />
                              Eliminar propiedad
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  <button onClick={closeEditPanel} className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Contenido scrollable */}
              <div className="flex-1 overflow-y-auto">
                {/* ID grande o Título para nueva propiedad */}
                <div className="px-5 pt-5 pb-3">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {editingProperty?.isNew ? 'Nueva Propiedad' : (editForm.id ? editForm.id.substring(0, 8) : '')}
                  </h3>
                </div>

                {/* ====== TAB INFO ====== */}
                {panelTab === 'info' && (
                  <>
                    {/* Todos los campos tab */}
                    <div className="px-5 border-b border-gray-200">
                      <span className="inline-block pb-2 border-b-2 border-blue-600 text-blue-600 text-sm font-medium">Todos los campos</span>
                    </div>

                    {/* Propiedad Info sección collapsible */}
                    <div className="px-5 pt-4">
                      <button
                        onClick={() => setInfoOpen(!infoOpen)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-900 w-full"
                      >
                        {infoOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        Propiedad Info
                      </button>

                      {infoOpen && (
                        <div className="mt-4 space-y-4">
                          {/* Id */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Id <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={editForm.id}
                              readOnly
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500"
                            />
                          </div>

                          {/* Título */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          {/* Precio propiedad */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Precio propiedad</label>
                            <div className="flex items-center border border-gray-300 rounded-md">
                              <span className="px-3 text-sm text-gray-500">€</span>
                              <input
                                type="number"
                                value={editForm.price}
                                onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                                className="flex-1 px-2 py-2 text-sm focus:outline-none"
                              />
                              <button
                                onClick={() => setEditForm({ ...editForm, price: Math.max(0, editForm.price - 1) })}
                                className="px-3 py-2 text-gray-500 hover:bg-gray-100 border-l border-gray-300 transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <button
                                onClick={() => setEditForm({ ...editForm, price: editForm.price + 1 })}
                                className="px-3 py-2 text-gray-500 hover:bg-gray-100 border-l border-gray-300 transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Habitaciones */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Habitaciones Propiedad</label>
                            <div className="flex items-center border border-gray-300 rounded-md">
                              <input
                                type="number"
                                value={editForm.beds}
                                onChange={(e) => setEditForm({ ...editForm, beds: Number(e.target.value) })}
                                className="flex-1 px-3 py-2 text-sm focus:outline-none"
                              />
                              <button
                                onClick={() => setEditForm({ ...editForm, beds: Math.max(0, editForm.beds - 1) })}
                                className="px-3 py-2 text-gray-500 hover:bg-gray-100 border-l border-gray-300 transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <button
                                onClick={() => setEditForm({ ...editForm, beds: editForm.beds + 1 })}
                                className="px-3 py-2 text-gray-500 hover:bg-gray-100 border-l border-gray-300 transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Metros² */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Metros²</label>
                            <div className="flex items-center border border-gray-300 rounded-md">
                              <input
                                type="number"
                                value={editForm.sqm}
                                onChange={(e) => setEditForm({ ...editForm, sqm: Number(e.target.value) })}
                                className="flex-1 px-3 py-2 text-sm focus:outline-none"
                              />
                              <button
                                onClick={() => setEditForm({ ...editForm, sqm: Math.max(0, editForm.sqm - 1) })}
                                className="px-3 py-2 text-gray-500 hover:bg-gray-100 border-l border-gray-300 transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <button
                                onClick={() => setEditForm({ ...editForm, sqm: editForm.sqm + 1 })}
                                className="px-3 py-2 text-gray-500 hover:bg-gray-100 border-l border-gray-300 transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Zona */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Zona</label>
                            <select
                              value={editForm.location}
                              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                              <option value="">Selecciona una zona</option>
                              {availableLocations.map((loc: any, idx: number) => (
                                <option key={idx} value={loc.zona}>
                                  {loc.zona} ({loc.municipio})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Características */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Características</label>
                            <input
                              type="text"
                              value={editForm.features}
                              onChange={(e) => setEditForm({ ...editForm, features: e.target.value })}
                              placeholder="Separadas por coma"
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          {/* Estado */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <select
                              value={editForm.estado}
                              onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                              <option value="Activo">Activo</option>
                              <option value="Vendido">Vendido</option>
                              <option value="No Oficial">No Oficial</option>
                              <option value="Alquilado">Alquilado</option>
                              <option value="Inactivo">Inactivo</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {/* Animales */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Permite Animales</label>
                              <select
                                value={editForm.animales}
                                onChange={(e) => setEditForm({ ...editForm, animales: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              >
                                <option value="Si">Sí</option>
                                <option value="No">No</option>
                              </select>
                            </div>

                            {/* Balcón */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Balcón</label>
                              <select
                                value={editForm.balcon}
                                onChange={(e) => setEditForm({ ...editForm, balcon: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              >
                                <option value="Si">Sí</option>
                                <option value="No">No</option>
                              </select>
                            </div>

                            {/* Garaje */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Garaje</label>
                              <select
                                value={editForm.garaje}
                                onChange={(e) => setEditForm({ ...editForm, garaje: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              >
                                <option value="Si">Sí</option>
                                <option value="No">No</option>
                              </select>
                            </div>

                            {/* Patio Interior */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Patio Interior</label>
                              <select
                                value={editForm.patioInterior}
                                onChange={(e) => setEditForm({ ...editForm, patioInterior: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              >
                                <option value="Si">Sí</option>
                                <option value="No">No</option>
                              </select>
                            </div>
                          </div>

                          {/* Destacada */}
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editForm.isFeatured}
                              onChange={(e) => setEditForm({ ...editForm, isFeatured: e.target.checked })}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <label className="text-sm font-medium text-gray-700">Destacada</label>
                          </div>

                          {/* Imágenes de la propiedad */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Imágenes de la propiedad</label>
                            {editForm.images && editForm.images.length > 0 ? (
                              <div className="grid grid-cols-3 gap-2">
                                {editForm.images.map((img: string, i: number) => (
                                  <div key={i} className="relative group">
                                    <img
                                      src={img}
                                      alt={`Imagen ${i + 1}`}
                                      className="w-full h-20 object-cover rounded border border-gray-200 cursor-pointer"
                                      onClick={() => setLightboxImage({ src: img, index: i })}
                                    />
                                    <button
                                      onClick={() => {
                                        const newImages = editForm.images.filter((_: string, idx: number) => idx !== i);
                                        setEditForm({ ...editForm, images: newImages });
                                      }}
                                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="w-full h-24 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-400">
                                <ImageIcon size={32} />
                              </div>
                            )}
                            {/* Botón añadir imagen */}
                            <button
                              onClick={() => {
                                const url = prompt('Introduce la URL de la imagen:');
                                if (url && url.trim()) {
                                  setEditForm({ ...editForm, images: [...(editForm.images || []), url.trim()] });
                                }
                              }}
                              className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Plus size={16} />
                              Añadir imagen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* ====== TAB ASOCIACIONES ====== */}
                {panelTab === 'associations' && (
                  <div className="px-5 pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Objetos relacionados</h3>

                    {/* Contacts */}
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setContactsOpen(!contactsOpen)}
                          className="flex items-center gap-2 text-sm font-semibold text-gray-900"
                        >
                          {contactsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          Contacts (0)
                        </button>
                        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                          <Plus size={14} />
                          Añadir
                        </button>
                      </div>
                      {contactsOpen && (
                        <div className="flex flex-col items-center py-8">
                          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                              <circle cx="24" cy="20" r="8" stroke="#d1d5db" strokeWidth="2" fill="#e5e7eb" />
                              <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#d1d5db" strokeWidth="2" fill="#e5e7eb" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-500 mb-3">No Contact asociado</p>
                          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm text-blue-600 hover:bg-blue-50 transition-colors">
                            <Plus size={14} />
                            Asociar nuevo Contact
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Trabajadores */}
                    <div className="border-t border-gray-200 pt-3 mt-2">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setTrabajadoresOpen(!trabajadoresOpen)}
                          className="flex items-center gap-2 text-sm font-semibold text-gray-900"
                        >
                          {trabajadoresOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          Trabajadores (0)
                        </button>
                        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                          <Plus size={14} />
                          Añadir
                        </button>
                      </div>
                      {trabajadoresOpen && (
                        <div className="flex flex-col items-center py-8">
                          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                              <circle cx="24" cy="20" r="8" stroke="#d1d5db" strokeWidth="2" fill="#e5e7eb" />
                              <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#d1d5db" strokeWidth="2" fill="#e5e7eb" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-500 mb-3">No Trabajador asociado</p>
                          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm text-blue-600 hover:bg-blue-50 transition-colors">
                            <Plus size={14} />
                            Asociar nuevo Trabajador
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ====== TAB NOTAS ====== */}
                {panelTab === 'notes' && (
                  <div className="px-5 pt-4 flex flex-col h-full">
                    {/* Header notas */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Notas</h3>
                    </div>

                    {/* Botón añadir nota */}
                    {!isAddingNote ? (
                      <button
                        onClick={() => { setIsAddingNote(true); setNoteForm({ title: '', content: '' }); }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-100 transition-colors mb-3 cursor-pointer"
                      >
                        <Plus size={16} />
                        Añadir nota
                      </button>
                    ) : (
                      <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-4 mb-3 space-y-3">
                        <input
                          type="text"
                          placeholder="Título de la nota"
                          value={noteForm.title}
                          onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <textarea
                          placeholder="Escribe tu nota aquí..."
                          value={noteForm.content}
                          onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setIsAddingNote(false)}
                            className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => {
                              if (!noteForm.title.trim() && !noteForm.content.trim()) return;
                              const now = new Date().toISOString();
                              const newNote: Note = {
                                id: Date.now().toString(),
                                title: noteForm.title.trim() || 'Sin título',
                                content: noteForm.content.trim(),
                                createdAt: now,
                                updatedAt: now,
                              };
                              const updated = [newNote, ...propertyNotes];
                              setPropertyNotes(updated);
                              saveNotes(editForm.id, updated);
                              setNoteForm({ title: '', content: '' });
                              setIsAddingNote(false);
                            }}
                            disabled={!noteForm.title.trim() && !noteForm.content.trim()}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Buscador */}
                    {propertyNotes.length > 0 && (
                      <div className="relative mb-4">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar notas..."
                          value={noteSearchQuery}
                          onChange={(e) => setNoteSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    {/* Lista de notas o estado vacío */}
                    {propertyNotes.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-12">
                        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-5">
                          <FileText size={28} className="text-blue-600" />
                        </div>
                        <p className="text-base font-semibold text-gray-900 mb-1">No hay notas</p>
                        <p className="text-sm text-gray-400 mb-5">Añade una nota para esta propiedad</p>
                        <button
                          onClick={() => { setIsAddingNote(true); setNoteForm({ title: '', content: '' }); }}
                          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          <Plus size={16} />
                          Añadir Primera Nota
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 flex-1 overflow-y-auto pb-4">
                        {propertyNotes
                          .filter(n => {
                            if (!noteSearchQuery) return true;
                            const q = noteSearchQuery.toLowerCase();
                            return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
                          })
                          .map(note => (
                            <div key={note.id} className="border border-gray-200 rounded-lg bg-white p-4 hover:shadow-sm transition-shadow">
                              {editingNoteId === note.id ? (
                                /* Modo edición */
                                <div className="space-y-3">
                                  <input
                                    type="text"
                                    value={editNoteForm.title}
                                    onChange={(e) => setEditNoteForm({ ...editNoteForm, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <textarea
                                    value={editNoteForm.content}
                                    onChange={(e) => setEditNoteForm({ ...editNoteForm, content: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => setEditingNoteId(null)}
                                      className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      onClick={() => {
                                        const updated = propertyNotes.map(n =>
                                          n.id === note.id
                                            ? { ...n, title: editNoteForm.title.trim() || 'Sin título', content: editNoteForm.content.trim(), updatedAt: new Date().toISOString() }
                                            : n
                                        );
                                        setPropertyNotes(updated);
                                        saveNotes(editForm.id, updated);
                                        setEditingNoteId(null);
                                      }}
                                      className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                                    >
                                      Guardar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* Modo visualización */
                                <>
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-sm font-semibold text-gray-900">{note.title}</h4>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => { setEditingNoteId(note.id); setEditNoteForm({ title: note.title, content: note.content }); }}
                                        className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                                        title="Editar"
                                      >
                                        <Edit3 size={14} />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm('¿Eliminar esta nota?')) {
                                            const updated = propertyNotes.filter(n => n.id !== note.id);
                                            setPropertyNotes(updated);
                                            saveNotes(editForm.id, updated);
                                          }
                                        }}
                                        className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                                        title="Eliminar"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                  {note.content && (
                                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{note.content}</p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-2">
                                    {new Date(note.updatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Footer con botones */}
              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200">
                <button
                  onClick={closeEditPanel}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProperty}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  {editingProperty?.isNew ? 'Añadir Propiedad' : 'Guardar Cambios'}
                </button>
              </div>
            </div>

            {/* Iconos laterales */}
            <div className="flex flex-col items-center gap-2 pt-16 px-2 border-l border-gray-200 bg-white">
              <div className="relative group">
                <button
                  onClick={() => setPanelTab('info')}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${panelTab === 'info'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <Info size={20} />
                </button>
                <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  Detalles
                  <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
                </div>
              </div>
              {!editingProperty?.isNew && (
                <>
                  <div className="relative group">
                    <button
                      onClick={() => setPanelTab('associations')}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${panelTab === 'associations'
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <Link2 size={20} />
                    </button>
                    <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                      Asociaciones
                      <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
                    </div>
                  </div>
                </>
              )}
              <div className="relative group">
                <button
                  onClick={() => setPanelTab('notes')}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${panelTab === 'notes'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <FileText size={20} />
                </button>
                <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  Notas
                  <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {/* Lightbox para ver imagen en grande */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center" onClick={() => setLightboxImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage.src}
              alt="Imagen en grande"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            {/* Botón cerrar */}
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow transition-colors"
            >
              <X size={18} />
            </button>
            {/* Botón eliminar */}
            <div className="flex justify-center mt-4">
              <button
                onClick={() => {
                  const newImages = editForm.images.filter((_: string, idx: number) => idx !== lightboxImage.index);
                  setEditForm({ ...editForm, images: newImages });
                  setLightboxImage(null);
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md flex items-center gap-2 transition-colors cursor-pointer"
              >
                <X size={14} />
                Eliminar imagen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gestionar Campos Panel */}
      {showFieldsPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/20" onClick={() => setShowFieldsPanel(false)}></div>
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col pt-safe animate-in slide-in-from-right">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Gestionar campos</h2>
              <button onClick={() => setShowFieldsPanel(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Campos de búsqueda"
                  value={fieldsSearchQuery}
                  onChange={e => setFieldsSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Campos en la tabla</h3>
              <div className="space-y-1">
                {tempColumnOrder.filter(key => {
                  if (key === 'id') return false; // No mostrar ID en el panel
                  if (!fieldsSearchQuery) return true;
                  const col = columns.find(c => c.key === key);
                  return col && col.label.toLowerCase().includes(fieldsSearchQuery.toLowerCase());
                }).map((key, index) => {
                  const col = columns.find(c => c.key === key);
                  if (!col) return null;
                  return (
                    <div
                      key={key}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnter={(e) => handleDragEnter(e, index)}
                      onDragEnd={() => setDraggedColumnIndex(null)}
                      onDragOver={(e) => e.preventDefault()}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-grab hover:bg-gray-50 transition-colors ${draggedColumnIndex === index ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical size={16} className="text-gray-300 hover:text-gray-500" />
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tempVisibleColumns.includes(key)}
                            onChange={() => toggleTempColumn(key)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm select-none text-gray-700">{col.label}</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowFieldsPanel(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors bg-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={applyFieldsConfig}
                className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de guardado correcto */}
      {saveSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Propiedad guardada correctamente
        </div>
      )}
    </div>
  );
}
