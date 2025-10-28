# Política de Seguridad

## Resumen

Este documento describe las mejores prácticas de seguridad para el proyecto y cómo reportar vulnerabilidades.

## Manejo de Datos Sensibles

### Variables de Entorno

**NUNCA** commitees datos sensibles en el repositorio:

- ❌ Tokens de acceso
- ❌ Claves API
- ❌ URLs de webhooks privados
- ❌ Client IDs
- ❌ Contraseñas o credenciales

**SIEMPRE** usa variables de entorno:

```env
# ✅ Correcto: Usar variables de entorno
VITE_AUTH_BASE_URL=https://aiauth.e3stores.cloud
VITE_AUTH_CLIENT_ID=<valor-privado>

# ❌ Incorrecto: Hardcodear en el código
const CLIENT_ID = "019986ed-5fea-7886-a2b6-e35968f8ef17";
```

### Archivos a Mantener Privados

Los siguientes archivos **NO** deben ser commiteados:

- `.env`
- `.env.local`
- `.env.*.local`
- Cualquier archivo con credenciales o tokens

Estos archivos ya están en `.gitignore`.

## Logging Seguro

### Sistema de Logging

El proyecto utiliza un sistema de logging seguro (`src/utils/logger.ts`) que:

- ✅ Solo muestra logs detallados en **desarrollo**
- ✅ Oculta datos sensibles en **producción**
- ✅ Sanitiza automáticamente tokens, contraseñas y claves

### Reglas de Logging

**En Desarrollo:**
```typescript
import logger from '@/utils/logger';

// ✅ Correcto: Usar logger
logger.debug('Datos de usuario:', userData);
logger.info('Proceso completado');

// ❌ Incorrecto: console.log directo
console.log('Token:', accessToken); // Expone datos sensibles
```

**En Producción:**
```typescript
// ✅ Solo errores críticos sin datos sensibles
logger.error('Error al procesar solicitud');

// ❌ NO exponer tokens o datos completos
logger.error('Error:', { token: '...', userData: {...} });
```

### Datos que NO Deben Loggearse

- Tokens (accessToken, refreshToken)
- Contraseñas
- Cookies completas
- Headers con Authorization
- Respuestas completas del backend con datos sensibles

## Seguridad en el Frontend

### Cliente HTTP

El cliente HTTP (`src/services/apiClient.ts`) implementa:

- ✅ Tokens en memoria (no en localStorage)
- ✅ RefreshToken en sessionStorage (más seguro que localStorage)
- ✅ Headers Authorization solo cuando es necesario
- ✅ Validación de HTTPS en producción
- ✅ Sanitización de logs

### Buenas Prácticas

1. **Tokens en Memoria**: Los accessTokens se almacenan en memoria y se pierden al recargar (más seguro)

2. **HTTPS Obligatorio**: En producción, todas las URLs deben usar HTTPS

3. **Validación de Variables**: El sistema valida que las variables de entorno estén configuradas

4. **No Exponer Variables**: El componente `EnvDiagnostic` fue eliminado para no exponer variables en la UI

## Configuración en Vercel

### Variables de Entorno en Producción

1. Ve a **Vercel Dashboard** → **Settings** → **Environment Variables**
2. Configura todas las variables requeridas (ver `INSTRUCCIONES_VERCEL.md`)
3. Marca: ✅ Production, ✅ Preview, ✅ Development
4. Haz **Redeploy** después de cambiar variables

### Checklist de Seguridad en Vercel

- [ ] Todas las variables `VITE_*` configuradas
- [ ] Ninguna variable tiene valores hardcodeados visibles en el código
- [ ] VITE_AUTH_BASE_URL usa HTTPS
- [ ] Las URLs de webhooks no están expuestas en logs
- [ ] El CLIENT_ID no está hardcodeado

## Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad:

1. **NO** abras un issue público en GitHub
2. Contacta directamente al equipo de desarrollo
3. Proporciona:
   - Descripción detallada de la vulnerabilidad
   - Pasos para reproducir
   - Impacto potencial
   - Sugerencias de solución (si las tienes)

## Auditoría de Seguridad

### Cambios Implementados

Este documento fue creado como parte de una auditoría de seguridad que incluyó:

✅ Eliminación de sistema de autenticación mock con credenciales hardcodeadas
✅ Implementación de sistema de logging seguro
✅ Migración de URLs hardcodeadas a variables de entorno
✅ Eliminación de componente que exponía variables en UI
✅ Sanitización de logs que exponían tokens y datos sensibles
✅ Eliminación de documentación con información sensible
✅ Validación obligatoria de CLIENT_ID (sin fallback hardcodeado)

### Archivos Eliminados

Los siguientes archivos fueron eliminados por contener información sensible:

- `src/utils/authSecurity.ts` - Sistema mock con credenciales
- `src/hooks/useAuth.ts` - Hook legacy deprecado
- `src/components/EnvDiagnostic.tsx` - Exponía variables de entorno
- `DEBUG_AUTENTICACION.md` - Información de debugging
- `TESTING_AUTH.md` - Datos de pruebas
- `MIGRACION_AUTH_COMPLETADA.md` - Histórico con datos sensibles

## Mantenimiento Continuo

### Revisiones Periódicas

Realiza revisiones de seguridad periódicas:

1. **Mensualmente**: Revisar logs de producción
2. **Trimestralmente**: Auditar variables de entorno
3. **Antes de cada release**: Verificar que no se commiteen datos sensibles

### Herramientas Recomendadas

- **git-secrets**: Previene commits con datos sensibles
- **ESLint security plugins**: Detecta patrones inseguros
- **Dependabot**: Actualiza dependencias con vulnerabilidades

## Recursos Adicionales

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Última actualización**: Octubre 2025  
**Versión**: 1.0.0

