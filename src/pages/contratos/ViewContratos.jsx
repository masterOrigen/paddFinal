import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Button,
  Breadcrumbs,
  CircularProgress,
  IconButton
} from '@mui/material';
import './ViewContratos.css';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import BusinessIcon from '@mui/icons-material/Business';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CategoryIcon from '@mui/icons-material/Category';
import PaymentIcon from '@mui/icons-material/Payment';
import EventIcon from '@mui/icons-material/Event';
import CircleIcon from '@mui/icons-material/Circle';
import DescriptionIcon from '@mui/icons-material/Description';
import ModalEditarContrato from './ModalEditarContrato';
import Swal from 'sweetalert2';
import '@fortawesome/fontawesome-free/css/all.min.css';

function ViewContrato() {
  const { id } = useParams();
  const [contrato, setContrato] = useState({});
  const [loading, setLoading] = useState(true);
  const [openModalEditar, setOpenModalEditar] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState(null);
  const navigate = useNavigate();

  const fetchContrato = async () => {
    try {
      setLoading(true);
      const { data: contratoData, error } = await supabase
        .from('Contratos')
        .select(`
          *,
          cliente:Clientes(*),
          proveedor:Proveedores(*),
          medio:Medios(*),
          formaPago:FormaDePago(*),
          tipoOrden:TipoGeneracionDeOrden(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (contratoData) {
        setContrato(contratoData);
        setSelectedContrato({
          id: contratoData.id,
          NombreContrato: contratoData.NombreContrato,
          IdCliente: contratoData.IdCliente,
          IdProveedor: contratoData.IdProveedor,
          IdMedios: contratoData.IdMedios,
          id_FormadePago: contratoData.id_FormadePago,
          id_GeneraracionOrdenTipo: contratoData.id_GeneraracionOrdenTipo,
          FechaInicio: contratoData.FechaInicio,
          FechaTermino: contratoData.FechaTermino,
          Estado: contratoData.Estado
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching contrato:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar la información del contrato'
      });
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setOpenModalEditar(true);
  };

  const handleCloseModalEditar = () => {
    setOpenModalEditar(false);
    setSelectedContrato(null);
    fetchContrato(); // Recargar los datos después de editar
  };

  useEffect(() => {
    fetchContrato();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth={false} className="view-contrato-container">
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link color="inherit" to="/" style={{ textDecoration: 'none' }}>
            Inicio
          </Link>
          <Link color="inherit" to="/contratos" style={{ textDecoration: 'none' }}>
            Contratos
          </Link>
          <Typography color="text.primary">{contrato.NombreContrato}</Typography>
        </Breadcrumbs>
      </Box>

      <Grid container spacing={3}>
        {/* Contenedor Izquierdo - Información del Contrato */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                Información del Contrato
              </Typography>
              <Box>
                <IconButton 
                  onClick={handleEdit} 
                  className="edit-button"
                  size="small"
                >
                  <i className="fas fa-edit" style={{ color: '#1976d2' }}></i>
                </IconButton>
              </Box>
            </Box>

            <Box className="info-section">
              <Typography variant="subtitle1" gutterBottom>
                <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Nombre del Contrato
              </Typography>
              <Typography className="info-item">
                <strong>Nombre:</strong> {contrato.NombreContrato}
              </Typography>
            </Box>

            <Box className="info-section">
              <Typography variant="subtitle1" gutterBottom>
                <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Información del Cliente
              </Typography>
              <Typography className="info-item">
                <strong>Cliente:</strong> {contrato.cliente?.nombreCliente}
              </Typography>
            </Box>

            <Box className="info-section">
              <Typography variant="subtitle1" gutterBottom>
                <StorefrontIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Información del Proveedor
              </Typography>
              <Typography className="info-item">
                <strong>Proveedor:</strong> {contrato.proveedor?.nombreProveedor}
              </Typography>
            </Box>

            <Box className="info-section">
              <Typography variant="subtitle1" gutterBottom>
                <CategoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Información del Medio
              </Typography>
              <Typography className="info-item">
                <strong>Medio:</strong> {contrato.medio?.NombredelMedio}
              </Typography>
              <Typography className="info-item">
                <strong>Tipo de Orden:</strong> {contrato.tipoOrden?.NombreTipoOrden}
              </Typography>
            </Box>

            <Box className="info-section">
              <Typography variant="subtitle1" gutterBottom>
                <PaymentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Forma de Pago
              </Typography>
              <Typography className="info-item">
                <strong>Forma de Pago:</strong> {contrato.formaPago?.NombreFormadePago}
              </Typography>
            </Box>

            <Box className="info-section">
              <Typography variant="subtitle1" gutterBottom>
                <EventIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Fechas
              </Typography>
              <Typography className="info-item">
                <strong>Fecha de Inicio:</strong> {new Date(contrato.FechaInicio).toLocaleDateString('es-CL')}
              </Typography>
              <Typography className="info-item">
                <strong>Fecha de Término:</strong> {new Date(contrato.FechaTermino).toLocaleDateString('es-CL')}
              </Typography>
            </Box>

            <Box className="info-section">
              <Typography variant="subtitle1" gutterBottom>
                <CircleIcon sx={{ 
                  mr: 1, 
                  verticalAlign: 'middle',
                  color: contrato.Estado ? 'success.main' : 'error.main' 
                }} />
                Estado
              </Typography>
              <Typography className={`estado-badge ${contrato.Estado ? 'estado-vigente' : 'estado-no-vigente'}`}>
                {contrato.Estado ? 'Vigente' : 'No Vigente'}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Contenedor Derecho - Por ahora sin tabla */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
              Detalles Adicionales
            </Typography>
            {/* Aquí puedes agregar más información o componentes en el futuro */}
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/contratos')}
        >
          Volver
        </Button>
      </Box>

      {/* Modal de Edición */}
      {selectedContrato && (
        <ModalEditarContrato
          open={openModalEditar}
          onClose={handleCloseModalEditar}
          contrato={selectedContrato}
          onContratoUpdated={() => {
            handleCloseModalEditar();
            Swal.fire({
              icon: 'success',
              title: '¡Éxito!',
              text: 'Contrato actualizado correctamente'
            });
            fetchContrato();
          }}
        />
      )}
    </Container>
  );
}

export default ViewContrato;
