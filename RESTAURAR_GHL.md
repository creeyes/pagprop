# 🔐 Restaurar Bloqueo de GHL (Autenticación SSO)

Actualmente la app está en **MODO DESARROLLO** y usa un `location_id` fijo para funcionar sin estar dentro de Go High Level.

---

## 📍 Archivo a modificar

```
src/App.tsx
```

---

## ✅ Pasos para restaurar el modo producción (GHL)

### Paso 1: Comenta o borra el bloque MODO DEV

Busca estas líneas y **comenta o elimínalas**:

```tsx
// -------- MODO DEV (inicio) --------
const DEV_LOCATION_ID = 'Qqg3dS8LsYYc0QQGEfVZ';
console.log("🛠️ MODO DEV: Usando location_id fijo:", DEV_LOCATION_ID);
setLocationId(DEV_LOCATION_ID);
setDebugInfo('Método: DEV hardcoded');
fetchProperties(DEV_LOCATION_ID).finally(() => setLoading(false));
// -------- MODO DEV (fin) -----------
```

### Paso 2: Descomenta el bloque MODO PRODUCCIÓN

Busca el bloque que empieza con `/*` y quita los delimitadores de comentario:

- **Quita** el `/*` justo antes de `// -------- MODO PRODUCCIÓN (GHL) (inicio) --------`
- **Quita** el `*/` justo después de `// -------- MODO PRODUCCIÓN (GHL) (fin) --------`

---

## 📋 Código original completo del `useEffect` (para copiar y pegar si lo necesitas)

Si prefieres reemplazar todo el `useEffect` de golpe, copia esto:

```tsx
  useEffect(() => {
    // PASO 1: Intentar leer location_id de la URL (para compatibilidad)
    const urlParams = new URLSearchParams(window.location.search);
    const locationFromUrl = urlParams.get('location_id') || urlParams.get('locationId');

    if (locationFromUrl) {
      console.log("✅ location_id recibido por URL:", locationFromUrl);
      setLocationId(locationFromUrl);
      setDebugInfo('Método: URL params');
      fetchProperties(locationFromUrl).finally(() => setLoading(false));
      return;
    }

    // PASO 2: Usar postMessage SSO de GHL (método oficial del Marketplace)
    let isResolved = false;

    const messageHandler = async (event: MessageEvent) => {
      if (event.data.message === 'REQUEST_USER_DATA_RESPONSE' && !isResolved) {
        isResolved = true;
        const encryptedPayload = event.data.payload;
        console.log("🔐 GHL respondió con payload encriptado");
        setDebugInfo('Método: postMessage SSO');

        try {
          // Enviar payload encriptado a Django para desencriptarlo
          const userData = await decryptSSO(encryptedPayload);
          console.log("✅ SSO desencriptado:", userData);

          const activeLocation = userData.activeLocation || userData.companyId;

          if (!activeLocation) {
            throw new Error('No se encontró activeLocation ni companyId en el SSO');
          }

          setLocationId(activeLocation);
          setUserName(userData.userName || null);

          // Cargar propiedades con el location_id obtenido
          await fetchProperties(activeLocation);

        } catch (err: any) {
          console.error("❌ Error con SSO:", err);
          setApiError(`Error SSO: ${err.message}`);
        } finally {
          setLoading(false);
        }
      }
    };

    window.addEventListener('message', messageHandler);
    window.parent.postMessage({ message: 'REQUEST_USER_DATA' }, '*');

    const timer = setTimeout(() => {
      if (!isResolved) {
        setError("No se pudo obtener el contexto de usuario de GHL.");
        setLoading(false);
      }
    }, 5000); // 5 segundos de timeout

    return () => {
      window.removeEventListener('message', messageHandler);
      clearTimeout(timer);
    };
  }, []);
```

---

## 🧪 Resumen de cambios DEV vs Producción

| Archivo | Cambio DEV (actual) | Restaurar a Producción |
|---|---|---|
| `src/App.tsx` | `useEffect` usa `location_id` fijo | Descomentar bloque GHL SSO |
| `src/App.tsx` | `API_BASE_URL = ''` | Cambiar a `'https://web-production-2573f.up.railway.app'` |
| `src/App.tsx` | Fetch usa `/api/properties/` | Cambiar a `/front/api/properties/` |
| `src/App.tsx` | Fetch usa `/api/decrypt-sso/` | Cambiar a `/front/api/decrypt-sso/` |
| `vite.config.ts` | Tiene bloque `proxy` | Quitar el bloque `proxy` |

---

## 🌐 Cambio 2: Proxy de Vite y URL de la API (para evitar CORS en local)

### Archivos modificados

- `src/App.tsx` — URL de la API
- `vite.config.ts` — Proxy del servidor Vite

### Paso 3: Restaurar `API_BASE_URL` en `src/App.tsx`

Busca estas líneas:

```tsx
// URL base: en DEV usa el proxy de Vite, en producción la URL directa de Railway
// Para producción, cambia esto de vuelta a: 'https://web-production-2573f.up.railway.app'
const API_BASE_URL = '';
```

Y cámbialas por:

```tsx
// URL base de tu API Django en Railway
const API_BASE_URL = 'https://web-production-2573f.up.railway.app';
```

### Paso 4: Restaurar rutas de fetch en `src/App.tsx`

Busca estas dos líneas y cámbialas:

**Línea 1** — en `fetchProperties`:
```diff
- const url = `${API_BASE_URL}/api/properties/?agency_id=${agencyId}`;
+ const url = `${API_BASE_URL}/front/api/properties/?agency_id=${agencyId}`;
```

**Línea 2** — en `decryptSSO`:
```diff
- const response = await fetch(`${API_BASE_URL}/api/decrypt-sso/`, {
+ const response = await fetch(`${API_BASE_URL}/front/api/decrypt-sso/`, {
```

### Paso 5: Quitar el proxy de `vite.config.ts`

El archivo actual tiene un bloque `proxy`. Reemplaza todo `vite.config.ts` por el original:

```ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
```

