import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import Swal from 'sweetalert2';
import './Login.css'; // Reutilizamos estilos del login

const RecuperarPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Verificar si el usuario existe
      const { data: user, error: searchError } = await supabase
        .from('Usuarios')
        .select('id_usuario, Nombre')
        .eq('Email', email)
        .single();

      if (searchError || !user) {
        // Por seguridad, no decimos si el correo existe o no, pero mostramos éxito
        await Swal.fire({
            icon: 'success',
            title: 'Correo enviado',
            text: 'Si el correo existe en nuestros registros, recibirás las instrucciones.'
        });
        setLoading(false);
        return;
      }

      // 2. Generar un token único y fecha de expiración (1 hora)
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // 3. Guardar el token en la base de datos
      const { error: updateError } = await supabase
        .from('Usuarios')
        .update({ 
            reset_token: token, 
            reset_token_expires: expiresAt.toISOString() 
        })
        .eq('id_usuario', user.id_usuario);

      if (updateError) throw updateError;

      // 4. Enviar el correo (Aquí necesitas un servicio de email)
      // Como no tienes backend, puedes usar EmailJS o simplemente mostrar el link por ahora para probar.
      const resetLink = `${window.location.origin}/restablecer-password?token=${token}`;
      
      console.log('--- LINK DE RECUPERACIÓN (En producción esto se envía por email) ---');
      console.log(resetLink);

      // TODO: Integrar EmailJS aquí para enviar el correo real
      
      await Swal.fire({
        icon: 'success',
        title: 'Instrucciones enviadas',
        text: 'Revisa tu correo (y la consola del navegador para probar) para restablecer tu contraseña.'
      });

    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al procesar la solicitud.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img 
          src="https://www.origenmedios.cl/wp-content/uploads/2023/10/logo-origen-2023-sm2.png" 
          alt="Origen Medios" 
          className="login-logo"
        />
        <div className="login-form">
          <h2>RECUPERAR CONTRASEÑA</h2>
          <p style={{textAlign: 'center', marginBottom: '20px', color: '#666'}}>
            Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
              />
            </div>
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Enlace'}
            </button>
          </form>
          
          <div style={{ marginTop: '20px' }} className="login-footer">
            <Link to="/login">Volver al inicio de sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecuperarPassword;