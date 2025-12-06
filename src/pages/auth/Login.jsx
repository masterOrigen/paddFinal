import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { authService } from '../../services/authService';
import Loading from '../../components/Loading/Loading';
import 'react-toastify/dist/ReactToastify.css';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Si ya está autenticado, redirige inmediatamente
  if (localStorage.getItem('user')) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleError = (error) => {
    let message = 'Error al iniciar sesión';
    
    if (error.message.includes('JSON object')) {
      message = 'Usuario o contraseña incorrectos';
    } else if (error.message.includes('network')) {
      message = 'Error de conexión. Por favor, verifica tu internet';
    } else if (error.message.includes('timeout')) {
      message = 'La conexión tardó demasiado. Intenta de nuevo';
    }

    toast.error(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIsSubmitting(true);

    try {
      const user = await authService.login(email, password);
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('auth-change'));
      setLoading(true); // Mantener loading mientras se redirige
      navigate('/dashboard', { replace: true });
    } catch (err) {
      handleError(err);
      setLoading(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      {loading && <Loading />}
      <div className="login-box">
        <img 
          src="https://www.origenmedios.cl/wp-content/uploads/2023/10/logo-origen-2023-sm2.png" 
          alt="Origen Medios" 
          className="login-logo"
        />
        
        <div className="login-form">
          <h2>ACCESO A LA PLATAFORMA</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            
            <div className="forgot-password-link" style={{ textAlign: 'left', marginBottom: '15px' }}>
              <a 
                href="/recuperar-password" 
                style={{ color: '#666', textDecoration: 'none', fontSize: '14px' }}
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/recuperar-password');
                }}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <div className="form-group checkbox">
              <label>
                <input 
                  type="checkbox" 
                  disabled={isSubmitting}
                /> Recuérdame
              </label>
            </div>

            <button 
              type="submit" 
              className={`login-button ${isSubmitting ? 'submitting' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="button-content">
                  <img src="/loading-white.gif" alt="" className="button-spinner" />
                  INGRESANDO...
                </span>
              ) : (
                'INGRESAR'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;