import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import Swal from 'sweetalert2';
import emailjs from '@emailjs/browser';
import './Login.css'; // Reutilizamos estilos del login

// Configuración de EmailJS
// Las variables se cargan desde el archivo .env
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

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

      // 4. Enviar el correo con EmailJS
      const resetLink = `${window.location.origin}/restablecer-password?token=${token}`;
      
      const templateParams = {
        to_email: email,
        to_name: user.Nombre, // Asegúrate de que tu template use {{to_name}}
        reset_link: resetLink // Asegúrate de que tu template use {{reset_link}}
      };

      try {
        await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
        
        await Swal.fire({
          icon: 'success',
          title: 'Instrucciones enviadas',
          text: 'Revisa tu bandeja de entrada (y spam) para restablecer tu contraseña.'
        });
      } catch (emailError) {
        console.error('Error al enviar email:', emailError);
        // Aún así, el token se generó, pero el usuario no recibió el correo.
        // Podríamos revertir el token o avisar al usuario.
        throw new Error('Error al conectar con el servicio de correos.');
      }

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