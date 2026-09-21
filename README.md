# Skipfee Domiciliarios

Formulario público de registro de domiciliarios para Skipfee (operado por MAMACITA Cacao SAS).
Sitio estático (`index.html`) + una función serverless (`api/apply.js`) que valida la solicitud,
la guarda en Supabase y envía una notificación por correo con cada registro nuevo.

## Puesta en marcha (una sola vez)

### 1. Base de datos (Supabase)

Usa el proyecto de Supabase que ya tienes (el de la tienda de bikinis) o uno nuevo — es indistinto,
la tabla está aislada con el prefijo `skipfee_`.

1. Entra a tu proyecto → **SQL Editor** → pega el contenido de [`schema.sql`](./schema.sql) → **Run**.
2. Ve a **Project Settings → API** y copia:
   - `Project URL` → variable `SUPABASE_URL`
   - `service_role` **secret** key (no la `anon` key) → variable `SUPABASE_SERVICE_ROLE_KEY`

La tabla queda con Row Level Security activado y sin políticas públicas: solo la función serverless
(que usa la `service_role` key desde el servidor) puede leer o escribir ahí. La `anon` key que ya usa
la tienda de bikinis no tiene ningún acceso a `skipfee_applications`.

### 2. Notificación por correo (Web3Forms)

1. Entra a [web3forms.com](https://web3forms.com), escribe `leoneltelesmeneses@gmail.com` y genera un
   Access Key — llega al instante a ese correo, sin necesidad de crear cuenta.
2. Guarda esa clave como variable `WEB3FORMS_KEY`.

Cada solicitud enviada dispara un correo a `leoneltelesmeneses@gmail.com` con el resumen completo del
domiciliario, además de quedar guardada en Supabase.

### 3. Despliegue (Vercel)

1. En [vercel.com](https://vercel.com) → **Add New… → Project** → importa el repo `skipfeedomiciliarios`.
2. En **Environment Variables**, agrega las tres:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `WEB3FORMS_KEY`
3. **Deploy**. No hay build step ni dependencias — es HTML estático + una función Node, Vercel lo detecta solo.

Cuando termine, el link público que da Vercel (o el dominio que le conectes) ya queda operativo:
cualquiera puede llenar el formulario, cada envío se guarda en `skipfee_applications` y tú recibes el
correo en el acto.

## Ver las solicitudes

Directamente en Supabase → **Table Editor → skipfee_applications**. Ordénala por `created_at` para ver
las más recientes primero (el índice ya viene creado).

## Archivos

- `index.html` — formulario público (datos personales, vehículo, disponibilidad, salud, pago, acuerdo
  de colaboración con firma electrónica).
- `api/apply.js` — valida el envío, calcula el radicado (`SKF-XXXXXX`), inserta en Supabase y notifica
  por correo vía Web3Forms.
- `schema.sql` — tabla `skipfee_applications` con RLS activado.
