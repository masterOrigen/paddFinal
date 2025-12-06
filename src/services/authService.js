import { supabase } from '../config/supabase';

export const authService = {
  login: async (email, password) => {
    const { data, error } = await supabase
      .from('Usuarios')
      .select(`
        id_usuario, 
        Email, 
        Nombre, 
        Apellido, 
        Avatar, 
        Estado, 
        Password,
        Perfiles:id_perfil (
          id,
          NombrePerfil,
          Codigo
        ),
        Grupos:id_grupo (
          id_grupo,
          nombre_grupo
        )
      `)
      .eq('Email', email)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Usuario no encontrado');
    if (data.Password !== password) throw new Error('Contraseña incorrecta');
    if (!data.Estado) throw new Error('Su cuenta no está habilitada para acceder. Por favor, contacte al administrador.');

    return data;
  },

  logout: async () => {
    // Limpiar el estado de la sesión
    localStorage.removeItem('user');
    return true;
  }
};