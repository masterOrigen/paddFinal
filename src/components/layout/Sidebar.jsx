import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
    id: 'reportes',
    icon: 'fas fa-chart-bar',
    text: 'Reportes',
    submenu: [
    { text: 'Reporte Orden de Compra', link: '/reportes/ordendecompra' },
    { text: 'Reporte Diario de Órdenes', link: '/reportes/diarioordenes' },
    { text: 'Detalle por Alternativa', link: '/reportes/detalleporalternativa' },
    {text: 'Informe de Inversión', link: '/reportes/informeinversion' },
    // { text: 'Inversión por Cliente', link: '/reportes/inversionporcliente' },
    // { text: 'Rendimiento de Campañas', link: '/reportes/rendimientocampanas' },
    // { text: 'Análisis de Medios', link: '/reportes/analisismedios' }
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
        {menuItems.map((item) => (
          <div key={item.id} className={`menu-item ${item.id === 'inicio' ? 'active' : ''}`}>
            {item.submenu.length === 0 ? (
              <Link to={item.link} className="menu-link">
                <div className="menu-content">
                  <i className={`${item.icon} menu-icon`}></i>
                  <span className="menu-text">{item.text}</span>
                </div>
              </Link>
            ) : (
              <>
                <div 
                  className={`menu-link ${expandedMenus[item.id] ? 'active' : ''}`}
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
                            <Link 
                              key={subIndex} 
                              to={subSubItem.link}
                              className="nested-submenu-link"
                            >
                              {subSubItem.text}
                            </Link>
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
                          <Link 
                            to={subItem.link}
                            className="submenu-link"
                          >
                            {subItem.text}
                          </Link>
                        )}
                      </div>
                    )
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </nav>
      <UserDataPopup open={userDataOpen} onClose={() => setUserDataOpen(false)} />
    </div>
  );
};

export default Sidebar;