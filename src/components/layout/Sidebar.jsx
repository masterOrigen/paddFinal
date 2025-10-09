import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';
import logoO from '../../assets/img/logo-origen-O.png';
import logoText from '../../assets/img/logo-origen-O3.png';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import UserDataPopup from '../UserDataPopup';

const Sidebar = () => {
  const [expandedMenus, setExpandedMenus] = useState({});
  const [userDataOpen, setUserDataOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    {
    id: 'inicio',
    icon: 'fas fa-desktop',
    text: 'Panel de Inicio',
    link: '/dashboard',
    submenu: []
    },
    {
    id: 'comercial',
    icon: 'fas fa-briefcase',
    text: 'Área Comercial',
    submenu: [
    { text: 'Clientes', link: '/clientes' },
    //{ text: 'Productos', link: '/productos' },
    { text: 'Medios', link: '/medios' },
    { text: 'Grupos', link: '/grupos' },
    { text: 'Agencias', link: '/agencias' },
    { text: 'Proveedores', link: '/proveedores' },
    { text: 'Soportes', link: '/soportes' }
    ]
    },
    {
    id: 'planificacion',
    icon: 'fas fa-chart-pie',
    text: 'Planificación de Medios',
    submenu: [
    { text: 'Contratos', link: '/contratos' },
    { text: 'Campañas', link: '/campanas' },
    { text: 'Planes de Medios', link: '/planificacion' },
    { 
    id: 'ordenes',
    text: 'Órdenes de Publicidad', 
    link: null, 
    submenu: [
    { text: 'Crear Orden', link: '/ordenes/crear' },
    { text: 'Revisar Orden', link: '/ordenes/revisar' }
    ] 
    }
    ]
    },
    {
    id: 'informaciones',
    icon: 'fas fa-copy',
    text: 'Informaciones',
    submenu: [
    { text: 'Mensajes', link: '/mensajes' }
    ]
    },
    {
    id: 'usuarios',
    icon: 'fas fa-user-check',
    text: 'Usuarios',
    submenu: [
    { text: 'Listado de Usuarios', link: '/usuarios' }
    ]
    },
    {
    id: 'perfil',
    icon: 'fas fa-image',
    text: 'Mi Perfíl',
    submenu: [
    { text: 'Mis Datos', onClick: () => setUserDataOpen(true) }
    ]
    }
  ];

  const toggleSubmenu = (menuId) => {
    setExpandedMenus(prev => ({
    ...prev,
    [menuId]: !prev[menuId]
    }));
  };

  const pathMatches = (basePath, currentPath) => {
    if (!basePath) return false;
    return currentPath === basePath || currentPath.startsWith(basePath + '/');
  };

  useEffect(() => {
    const updates = {};
    menuItems.forEach(item => {
      if (item.submenu && item.submenu.length) {
        const matches = item.submenu.some(subItem => (
          (subItem.link && pathMatches(subItem.link, location.pathname)) ||
          (subItem.submenu && subItem.submenu.some(subSubItem => subSubItem.link && pathMatches(subSubItem.link, location.pathname)))
        ));
        updates[item.id] = matches;

        // Sincroniza el estado de submenús anidados (p.ej., Órdenes de Publicidad)
        item.submenu.forEach(subItem => {
          if (subItem.submenu && subItem.submenu.length) {
            const nestedMatches = subItem.submenu.some(subSubItem => (
              subSubItem.link && pathMatches(subSubItem.link, location.pathname)
            ));
            updates[subItem.id || subItem.text] = nestedMatches;
          }
        });
      }
    });
    setExpandedMenus(prev => ({ ...prev, ...updates }));
  }, [location.pathname]);

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <img 
          src={logoO}
          alt="Origen" 
          className="brand-logo"
        />
        <img 
          src={logoText}
          alt="Origen" 
          className="brand-logo-text"
        />
      </div>

      <div className="sidebar-header">
        <div className="menu-title">MENÚ PADD</div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const isGroupActive = item.submenu && item.submenu.length ? item.submenu.some(subItem => (
            (subItem.link && pathMatches(subItem.link, location.pathname)) ||
            (subItem.submenu && subItem.submenu.some(subSubItem => subSubItem.link && pathMatches(subSubItem.link, location.pathname)))
          )) : false;
          return (
            <div key={item.id} className="menu-item">
              {item.submenu.length === 0 ? (
                <NavLink 
                  to={item.link} 
                  className={({ isActive }) => `menu-link${isActive ? ' active' : ''}`}
                >
                  <div className="menu-content">
                    <i className={`${item.icon} menu-icon`}></i>
                    <span className="menu-text">{item.text}</span>
                  </div>
                </NavLink>
              ) : (
                <>
                  <div 
                    className={`menu-link ${expandedMenus[item.id] ? 'active' : ''} ${isGroupActive ? 'active' : ''}`}
                    onClick={() => toggleSubmenu(item.id)}
                  >
                    <div className="menu-content">
                      <i className={`${item.icon} menu-icon`}></i>
                      <span className="menu-text">{item.text}</span>
                    </div>
                    <i className={`fas fa-chevron-right submenu-icon ${expandedMenus[item.id] ? 'expanded' : ''}`}></i>
                  </div>
                  <div className={`submenu ${expandedMenus[item.id] ? 'expanded' : ''}`}>
                    {item.submenu.map((subItem, index) => (
                      subItem.submenu ? (
                        <div key={index} className="nested-submenu-container">
                          <div 
                            className={`submenu-link nested-parent ${expandedMenus[subItem.id || subItem.text] ? 'active' : ''}`}
                            onClick={() => toggleSubmenu(subItem.id || subItem.text)}
                            style={{ cursor: 'pointer' }}
                          >
                            {subItem.text}
                            <i className={`fas fa-chevron-right submenu-icon ${expandedMenus[subItem.id || subItem.text] ? 'expanded' : ''}`}></i>
                          </div>
                          <div className={`nested-submenu ${expandedMenus[subItem.id || subItem.text] ? 'expanded' : ''}`}>
                            {subItem.submenu.map((subSubItem, subIndex) => (
                              <NavLink 
                                key={subIndex} 
                                to={subSubItem.link}
                                className={({ isActive }) => `nested-submenu-link${isActive ? ' active' : ''}`}
                              >
                                {subSubItem.text}
                              </NavLink>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div key={index} className="submenu-item">
                          {subItem.onClick ? (
                            <div onClick={subItem.onClick} style={{ cursor: 'pointer' }} className="submenu-link">
                              {subItem.text}
                            </div>
                          ) : (
                            <NavLink 
                              to={subItem.link}
                              className={({ isActive }) => `submenu-link${isActive ? ' active' : ''}`}
                            >
                              {subItem.text}
                            </NavLink>
                          )}
                        </div>
                      )
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </nav>
      <UserDataPopup open={userDataOpen} onClose={() => setUserDataOpen(false)} />
    </div>
  );
};

export default Sidebar;