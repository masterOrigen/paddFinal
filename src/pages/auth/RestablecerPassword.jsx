import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import Swal from 'sweetalert2';
import './Login.css';

const RestablecerPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    if (!token) {
      setChecking(false);
      return;
    }

    // Buscar usuario con ese token y que no haya expirado
    const { data, error } = await supabase
      .from('Usuarios')
      .select('id_usuario')
      .eq('reset_token', token)
      .gt('reset_token_expires', new Date().toISOString()) // Token debe expirar en el futuro
      .single();

    if (data && !error) {
      setValidToken(true);
    }
    setChecking(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
    }
    
    setLoading(true);

    try {
      // Actualizar contraseña y limpiar el token
      const { error } = await supabase
        .from('Usuarios')
        .update({ 
            Password: password, // NOTA: Considera encriptar esto a futuro
            reset_token: null,
            reset_token_expires: null
        })
        .eq('reset_token', token);

      if (error) throw error;

      await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Tu contraseña ha sido actualizada correctamente.'
      });
      
      navigate('/login');

    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo actualizar la contraseña', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <div className="login-container">Verificando enlace...</div>;

  if (!validToken) {
    return (
      <div className="login-container">
        <div className="login-box" style={{textAlign: 'center', padding: '40px'}}>
          <h3>Enlace inválido o expirado</h3>
          <p>El enlace de recuperación ya no es válido.</p>
          <button onClick={() => navigate('/recuperar-password')} className="login-button">
            Solicitar nuevo enlace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-form">
          <h2>NUEVA CONTRASEÑA</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nueva Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label>Confirmar Contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Guardando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RestablecerPassword;