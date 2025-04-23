import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import RevisarOrden from './pages/ordenes/RevisarOrden';
import Clientes from './pages/clientes/Clientes';
import ViewCliente from './pages/clientes/ViewCliente';
import Medios from './pages/medios/Medios';
import Grupos from './pages/grupos/Grupos';
import Agencias from './pages/agencias/Agencias';
import ViewAgencia from './pages/agencias/ViewAgencia';
import Proveedores from './pages/proveedores/Proveedores';
import Soportes from './pages/soportes/Soportes';
import ViewProveedor from './pages/proveedores/ViewProveedor';
import ViewSoporte from './pages/soportes/ViewSoporte';
import Mensajes from './pages/mensajes/Mensajes';
import Campanas from './pages/campanas/Campanas';
import ViewCampania from './pages/campanas/ViewCampania';
import Contratos from './pages/contratos/Contratos';
import ViewContrato from './pages/contratos/ViewContratos';
import Planificacion from './pages/planificacion/Planificacion';
import NuevoPlan from './pages/planificacion/NuevoPlan';
import Alternativas from './pages/planificacion/Alternativas';
import CrearOrden from './pages/ordenes/CrearOrden';
import ListadoUsuarios from './pages/usuarios/ListadoUsuarios';
import MiPerfil from './pages/perfil/MiPerfil';
import ReporteOrdenDeCompra from './pages/reportes/ReporteOrdenDeCompra';
import InformeInversion from './pages/reportes/InformeInversion';
import ReporteInversionPorCliente from './pages/reportes/ReporteInversionPorCliente';
import RendimientoCampanas from './pages/reportes/RendimientoCampanas';
import AnalisisMedios from './pages/reportes/AnalisisMedios';
import EfectividadProveedores from './pages/reportes/EfectividadProveedores';
import ReporteDiarioOrdenes from './pages/reportes/ReporteDiarioOrdenes';
import DetallePorAlternativa from './pages/reportes/DetallePorAlternativa';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('user'));

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem('user'));
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-change', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleStorageChange);
    };
  }, []);

  return (
    <Router>
      <div className="app">
        {isAuthenticated ? (
          <>
            <Header setIsAuthenticated={setIsAuthenticated} />
            <div className="main-container">
              <Sidebar />
              <div className="content">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/planificacion" element={<Planificacion />} />
                  <Route path="/planificacion/new" element={<NuevoPlan />} />
                  <Route path="/planificacion/alternativas/:id" element={<Alternativas />} />
                  <Route path="/clientes" element={<Clientes />} />
                  <Route path="/clientes/view/:id" element={<ViewCliente />} />
                  <Route path="/medios" element={<Medios />} />
                  <Route path="/grupos" element={<Grupos />} />
                  <Route path="/agencias" element={<Agencias />} />
                  <Route path="/agencias/view/:id" element={<ViewAgencia />} />
                  <Route path="/proveedores" element={<Proveedores />} />
                  <Route path="/soportes" element={<Soportes />} />
                  <Route path="/proveedores/view/:id" element={<ViewProveedor />} />
                  <Route path="/soportes/view/:id" element={<ViewSoporte />} />
                  <Route path="/mensajes" element={<Mensajes />} />
                  <Route path="/campanas" element={<Campanas />} />
                  <Route path="/campanas/:id" element={<ViewCampania />} />
                  <Route path="/contratos" element={<Contratos />} />
                  <Route path="/contratos/view/:id" element={<ViewContrato />} />
                  <Route path="/ordenes/crear" element={<CrearOrden />} />
                  <Route path="/ordenes/revisar" element={<RevisarOrden />} />
                  <Route path="/reportes/ordendecompra" element={<ReporteOrdenDeCompra />} />
                  <Route path="/reportes/diarioordenes" element={<ReporteDiarioOrdenes />} />
                  <Route path="/reportes/informeinversion" element={<InformeInversion />} />
                  <Route path="/reportes/inversionporcliente" element={<ReporteInversionPorCliente />} />
                  <Route path="/reportes/rendimientocampanas" element={<RendimientoCampanas />} />
                  <Route path="/reportes/analisismedios" element={<AnalisisMedios />} />
                  <Route path="/reportes/efectividadproveedores" element={<EfectividadProveedores />} />
                  <Route path="/reportes/detalleporalternativa" element={<DetallePorAlternativa />} />
                  <Route path="/usuarios" element={<ListadoUsuarios />} />
                  <Route path="/perfil" element={<MiPerfil />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
            </div>
          </>
        ) : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;