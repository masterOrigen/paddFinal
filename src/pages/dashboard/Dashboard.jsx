import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { supabase } from '../../config/supabase';
import {
  Box,
  Pagination,
  Typography,
  CircularProgress,
  IconButton
} from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const [stats, setStats] = useState({
    agencias: 0,
    clientes: 0,
    campanas: 0,
    medios: 0
  });
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [clientesConMasCampanas, setClientesConMasCampanas] = useState([]);
  const [page, setPage] = useState(1);
  const [messagePage, setMessagePage] = useState(1);
  const clientesPerPage = 5;
  const mensajesPerPage = 5;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchStats(),
          fetchClientes(),
          fetchMensajes(),
          fetchClientesConMasCampanas()
        ]);
      } catch (error) {
        // Silent error
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const fetchStats = async () => {
    try {
      const [agenciasResult, clientesResult, campanasResult, mediosResult] = await Promise.all([
        supabase.from('Agencias').select('*', { count: 'exact', head: true }),
        supabase.from('Clientes').select('*', { count: 'exact', head: true }),
        supabase.from('Campania').select('*', { count: 'exact', head: true }),
        supabase.from('Medios').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        agencias: agenciasResult.count || 0,
        clientes: clientesResult.count || 0,
        campanas: campanasResult.count || 0,
        medios: mediosResult.count || 0
      });
    } catch (error) {
      // Silent error
    }
  };

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('Clientes')
        .select('*')
        .order('nombreCliente');

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      // Silent error
    }
  };

  const fetchMensajes = async () => {
    try {
      const { data, error } = await supabase
        .from('aviso')
        .select(`
          *,
          Usuarios:id_usuario (
            id_usuario,
            Nombre,
            Apellido
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMensajes(data || []);
    } catch (error) {
      // Silent error
    }
  };

  const fetchClientesConMasCampanas = async () => {
    try {
      const { data, error } = await supabase
        .from('Campania')
        .select(`
          id_campania,
          id_Cliente,
          Clientes!inner (
            id_cliente,
            nombreCliente
          )
        `);

      if (error) throw error;

      // Contar campañas por cliente
      const conteoPorCliente = data.reduce((acc, campaña) => {
        const clienteId = campaña.id_Cliente;
        const clienteNombre = campaña.Clientes.nombreCliente;
        
        if (!acc[clienteId]) {
          acc[clienteId] = {
            id: clienteId,
            nombre: clienteNombre,
            count: 0
          };
        }
        
        acc[clienteId].count++;
        return acc;
      }, {});

      // Convertir a array y ordenar por cantidad de campañas (descendente)
      const clientesOrdenados = Object.values(conteoPorCliente)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Tomar solo los 5 principales

      setClientesConMasCampanas(clientesOrdenados);
    } catch (error) {
      // Silent error
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleMessagePageChange = (event, newPage) => {
    setMessagePage(newPage);
  };

  const indexOfLastCliente = page * clientesPerPage;
  const indexOfFirstCliente = indexOfLastCliente - clientesPerPage;
  const currentClientes = clientes.slice(indexOfFirstCliente, indexOfLastCliente);

  const indexOfLastMensaje = messagePage * mensajesPerPage;
  const indexOfFirstMensaje = indexOfLastMensaje - mensajesPerPage;
  const currentMensajes = mensajes.slice(indexOfFirstMensaje, indexOfLastMensaje);
  const pieData = {
    labels: clientesConMasCampanas.length > 0
      ? clientesConMasCampanas.map(cliente => cliente.nombre)
      : ['Sin datos'],
    datasets: [
      {
        data: clientesConMasCampanas.length > 0
          ? clientesConMasCampanas.map(cliente => cliente.count)
          : [1],
        backgroundColor: [
          '#4F46E5',
          '#EF4D36',
          '#FDB022',
          '#34D399',
          '#10B981'
        ],
        borderWidth: 0,
      },
    ],
  };

  const pieOptions = {
    plugins: {
      legend: {
        display: false // Ocultamos la leyenda ya que la información está debajo del gráfico
      }
    }
  };

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-text">
              <h3>N° Agencias</h3>
              <p className="stat-number">{loading ? '...' : stats.agencias}</p>
            </div>
            <div className="stat-icon">
              <i className="fas fa-users"></i>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-text">
              <h3>N° de Clientes</h3>
              <p className="stat-number">{loading ? '...' : stats.clientes}</p>
            </div>
            <div className="stat-icon">
              <i className="fas fa-user-group"></i>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-text">
              <h3>N° campañas</h3>
              <p className="stat-number">{loading ? '...' : stats.campanas}</p>
            </div>
            <div className="stat-icon">
              <i className="fas fa-chart-line"></i>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-text">
              <h3>N° de medios</h3>
              <p className="stat-number">{loading ? '...' : stats.medios}</p>
            </div>
            <div className="stat-icon">
              <i className="fas fa-image"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Top 5 clientes con mayor número de campañas activas</h2>
          <div className="chart-container" style={{ height: '300px' }}>
            <Pie data={pieData} options={pieOptions} />
          </div>
          <Box mt={2}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Detalle de campañas por cliente:
            </Typography>
            {clientesConMasCampanas.length > 0 ? (
              clientesConMasCampanas.map((cliente, index) => (
                <Box key={cliente.id} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                  <Box display="flex" alignItems="center">
                    <Box
                      width={12}
                      height={12}
                      borderRadius="50%"
                      bgcolor={['#4F46E5', '#EF4D36', '#FDB022', '#34D399', '#10B981'][index]}
                      mr={1}
                    />
                    <Typography variant="body2">
                      {cliente.nombre} ({cliente.count}) campañas
                    </Typography>
                  </Box>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary" align="center">
                No hay datos disponibles
              </Typography>
            )}
          </Box>
        </div>

        <div className="dashboard-card">
          <h2>Listado de Clientes</h2>
          <div className="clients-list">
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : currentClientes.length > 0 ? (
              <>
                {currentClientes.map((cliente) => (
                  <div key={cliente.id_cliente} className="client-item">
                    <i className="fas fa-user"></i>
                    <div className="client-info">
                      <h4>{cliente.nombreCliente}</h4>
                      <p>Dirección Empresa: {cliente.direccionEmpresa || 'No especificada'}</p>
                      <p>Teléfono Fijo: {cliente.telFijo || 'No especificado'}</p>
                    </div>
                    <IconButton
                      size="small"
                      component={Link}
                      to={`/clientes/view/${cliente.id_cliente}`}
                      style={{ color: '#1976d2' }}
                    >
                      <ViewIcon />
                    </IconButton>
                  </div>
                ))}
                {clientes.length > clientesPerPage && (
                  <Box display="flex" justifyContent="center" mt={2}>
                    <Pagination
                      count={Math.ceil(clientes.length / clientesPerPage)}
                      page={page}
                      onChange={handleChangePage}
                      color="primary"
                      size="small"
                    />
                  </Box>
                )}
              </>
            ) : (
              <Typography variant="body2" align="center" p={2}>
                No hay clientes registrados
              </Typography>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Mensajes</h2>
          <div className="messages-list">
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : currentMensajes.length > 0 ? (
              <>
                {currentMensajes.map((mensaje) => (
                  <div key={mensaje.id} className="message-item">
                    <i className="fas fa-envelope"></i>
                    <div className="message-info">
                      <h4>{mensaje.titulo || 'Sin título'}</h4>
                      <p>
                        Escrito por: {mensaje.Usuarios ? `${mensaje.Usuarios.Nombre} ${mensaje.Usuarios.Apellido}` : 'Usuario no identificado'}
                      </p>
                      <p>
                        Fecha: {mensaje.created_at
                          ? new Date(mensaje.created_at).toLocaleDateString('es-CL', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })
                          : 'Fecha no disponible'
                        }
                      </p>
                    </div>
                  </div>
                ))}
                {mensajes.length > mensajesPerPage && (
                  <Box display="flex" justifyContent="center" mt={2}>
                    <Pagination
                      count={Math.ceil(mensajes.length / mensajesPerPage)}
                      page={messagePage}
                      onChange={handleMessagePageChange}
                      color="primary"
                      size="small"
                    />
                  </Box>
                )}
              </>
            ) : (
              <Typography variant="body2" align="center" p={2}>
                No hay mensajes registrados
              </Typography>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;