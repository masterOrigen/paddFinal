import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Breadcrumbs,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { supabase } from '../../config/supabase';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Link as RouterLink } from 'react-router-dom';

export default function EfectividadProveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodoAnalisis, setPeriodoAnalisis] = useState('mes');

  useEffect(() => {
    fetchProveedoresData();
  }, [periodoAnalisis]);

  const fetchProveedoresData = async () => {
    try {
      const { data: proveedoresData, error: proveedoresError } = await supabase
        .from('Proveedores')
        .select('*');

      if (proveedoresError) throw proveedoresError;

      // Obtener datos de órdenes para análisis
      const { data: ordenesData, error: ordenesError } = await supabase
        .from('Ordenes')
        .select('*');

      if (ordenesError) throw ordenesError;

      const proveedoresConMetricas = proveedoresData.map(proveedor => ({
        ...proveedor,
        cumplimientoPlazos: calcularCumplimientoPlazos(proveedor, ordenesData),
        calidadServicio: calcularCalidadServicio(proveedor, ordenesData),
        volumenNegocios: calcularVolumenNegocios(proveedor, ordenesData),
        satisfaccionCliente: calcularSatisfaccionCliente(proveedor, ordenesData)
      }));

      setProveedores(proveedoresConMetricas);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar datos de proveedores:', error);
      setLoading(false);
    }
  };

  const calcularCumplimientoPlazos = (proveedor, ordenes) => {
    // Implementar cálculo de cumplimiento de plazos
    return (Math.random() * 100).toFixed(2); // Placeholder
  };

  const calcularCalidadServicio = (proveedor, ordenes) => {
    // Implementar cálculo de calidad de servicio
    return (Math.random() * 5).toFixed(1); // Placeholder (escala 0-5)
  };

  const calcularVolumenNegocios = (proveedor, ordenes) => {
    // Implementar cálculo de volumen de negocios
    return Math.floor(Math.random() * 1000000); // Placeholder
  };

  const calcularSatisfaccionCliente = (proveedor, ordenes) => {
    // Implementar cálculo de satisfacción del cliente
    return (Math.random() * 100).toFixed(2); // Placeholder
  };

  const columns = [
    { field: 'nombre', headerName: 'Proveedor', width: 200 },
    {
      field: 'cumplimientoPlazos',
      headerName: 'Cumplimiento',
      width: 130,
      renderCell: (params) => `${params.value}%`
    },
    {
      field: 'calidadServicio',
      headerName: 'Calidad',
      width: 150,
      renderCell: (params) => (
        <Rating
          value={parseFloat(params.value)}
          precision={0.1}
          readOnly
          size="small"
        />
      )
    },
    {
      field: 'volumenNegocios',
      headerName: 'Volumen de Negocios',
      width: 180,
      renderCell: (params) => `$${params.value.toLocaleString()}`
    },
    {
      field: 'satisfaccionCliente',
      headerName: 'Satisfacción',
      width: 130,
      renderCell: (params) => `${params.value}%`
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/dashboard" color="inherit">
          Inicio
        </Link>
        <Link component={RouterLink} to="/reportes" color="inherit">
          Reportes
        </Link>
        <Typography color="textPrimary">Efectividad de Proveedores</Typography>
      </Breadcrumbs>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Typography variant="h5">
              Análisis de Efectividad de Proveedores
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Periodo de Análisis</InputLabel>
              <Select
                value={periodoAnalisis}
                label="Periodo de Análisis"
                onChange={(e) => setPeriodoAnalisis(e.target.value)}
              >
                <MenuItem value="mes">Último Mes</MenuItem>
                <MenuItem value="trimestre">Último Trimestre</MenuItem>
                <MenuItem value="ano">Último Año</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Cumplimiento Promedio
                    </Typography>
                    <Typography variant="h4">
                      {(proveedores.reduce((acc, curr) => acc + parseFloat(curr.cumplimientoPlazos), 0) / proveedores.length).toFixed(2)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Calidad Promedio
                    </Typography>
                    <Typography variant="h4">
                      {(proveedores.reduce((acc, curr) => acc + parseFloat(curr.calidadServicio), 0) / proveedores.length).toFixed(1)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Volumen Total
                    </Typography>
                    <Typography variant="h4">
                      ${proveedores.reduce((acc, curr) => acc + curr.volumenNegocios, 0).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Satisfacción Promedio
                    </Typography>
                    <Typography variant="h4">
                      {(proveedores.reduce((acc, curr) => acc + parseFloat(curr.satisfaccionCliente), 0) / proveedores.length).toFixed(2)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <div style={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={proveedores}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5]}
                disableSelectionOnClick
              />
            </div>
          </>
        )}
      </Paper>
    </Container>
  );
}