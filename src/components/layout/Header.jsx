import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClickOutside } from '../../hooks/useClickOutside';
import { supabase } from '../../config/supabase';
import './Header.css';

const Header = ({ setIsAuthenticated }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useClickOutside(menuRef, () => {
    if (showMenu) setShowMenu(false);
  });

  const handleLogout = async () => {
    try {
      localStorage.clear();
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      window.dispatchEvent(new Event('auth-change'));
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className="main-header">
      <div className="header-left">
        <img 
          src="https://www.origenmedios.cl/wp-content/uploads/2023/10/logo-origen-2023-sm2.png" 
          alt="Origen" 
          className="header-logo"
        />
        <h1>ADMINISTRACIÓN</h1>
      </div>
      <div className="header-right">
        <span>Bienvenid@ - {user ? `${user.Nombre} ${user.Apellido} ${user.Email}` : 'Usuario'}</span>
        <div className="user-menu-container" ref={menuRef}>
          <div 
            className="user-avatar"
            onClick={() => setShowMenu(!showMenu)}
          >
            {user?.Avatar ? (
              <img 
                src={user.Avatar} 
                alt={`${user.Nombre} ${user.Apellido}`}
                className="user-avatar-image"
              />
            ) : (
              <i className="fas fa-user-circle"></i>
            )}
          </div>
          {showMenu && (
            <div className="user-menu">
              <div className="menu-item">
                <i className="fas fa-user"></i>
                <span>Mi Perfil</span>
              </div>
              <div className="menu-item">
                <i className="fas fa-envelope"></i>
                <span>Publicar Mensajes</span>
              </div>
              <div className="menu-item">
                <i className="fas fa-comments"></i>
                <span>Muro de Mensajes</span>
              </div>
              <div className="menu-item" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i>
                <span style={{ color: '#EF4D36' }}>Salir de Padd</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;