import { supabase } from '../config/supabase';

/**
 * Ejecuta una query de Supabase con reintentos automáticos en caso de timeout
 * @param {Function} queryFn - Función que ejecuta la query de Supabase
 * @param {number} maxRetries - Número máximo de reintentos (default: 3)
 * @param {number} retryDelay - Delay entre reintentos en ms (default: 1000)
 */
export const executeWithRetry = async (queryFn, maxRetries = 3, retryDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await queryFn();
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`Intento ${attempt + 1} falló:`, error.message);
      
      // Si no es el último intento, esperar antes de reintentar
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }
  
  throw lastError;
};

/**
 * Verifica la conexión con Supabase
 */
export const checkConnection = async () => {
  try {
    const { error } = await supabase.from('Agencias').select('id').limit(1);
    return !error;
  } catch (error) {
    console.error('Error de conexión con Supabase:', error);
    return false;
  }
};
