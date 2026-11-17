// Antes de las pruebas: si se reutiliza un backend que ya estaba corriendo con el límite
// normal de /api/auth (20 intentos cada 15 min), las pruebas fallarían en cadena con 429.
// Se detiene todo de inmediato con un mensaje claro.
const MINIMO = 1000;

export default async function globalSetup(config) {
  const baseURL = config.projects[0].use.baseURL;
  const res = await fetch(new URL('/api/auth/login', baseURL), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  });
  // Cabecera estándar de express-rate-limit: "limit=20, remaining=19, reset=900".
  const limite = Number(/limit=(\d+)/.exec(res.headers.get('ratelimit') ?? '')?.[1]);
  if (res.status === 429 || (limite && limite < MINIMO)) {
    throw new Error(
      `\n\nEl backend que ya estaba corriendo tiene un límite de ${limite || '?'} intentos en /api/auth ` +
        `(respuesta ${res.status}). Las pruebas crean muchas cuentas y fallarían con 429.\n` +
        'Solución: cierra el backend y el frontend (ventanas de terminal o Iniciar-MenteConecta) y vuelve a ' +
        'ejecutar las pruebas; Playwright los inicia solo con el límite adecuado.\n' +
        'Otra opción: pon AUTH_RATE_LIMIT_MAX=10000 en backend/.env y reinicia el backend.\n'
    );
  }
}
