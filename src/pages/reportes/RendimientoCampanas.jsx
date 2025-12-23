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
  Link
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { supabase } from '../../config/supabase';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Link as RouterLink } from 'react-router-dom';

export default function RendimientoCampanas() {
  const [campanas, setCampanas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampanas();
  }, []);

  const fetchCampanas = async () => {
    try {
      const { data, error } = await supabase
        .from('Campania')
        .select('*');

      if (error) throw error;

      const campanasConMetricas = data.map(campana => ({
        ...campana,
        id: campana.id_campania,
        nombre: campana.NombreCampania,
        fechaInicio: campana.fechaCreacion,
        fechaFin: campana.fechaCreacion,
        rendimiento: calcularRendimiento(campana),
        impactoEstimado: calcularImpactoEstimado(campana),
        roi: calcularROI(campana)
      }));

      setCampanas(campanasConMetricas);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar campañas:', error);
      setLoading(false);
    }
  };

  const calcularRendimiento = (campana) => {
    // Aquí implementar la lógica de cálculo de rendimiento
    return Math.random() * 100; // Placeholder
  };

  const calcularImpactoEstimado = (campana) => {
    // Aquí implementar la lógica de cálculo de impacto
    return Math.floor(Math.random() * 1000000); // Placeholder
  };

  const calcularROI = (campana) => {
    // Aquí implementar la lógica de cálculo de ROI
    return (Math.random() * 200 - 100).toFixed(2); // Placeholder
  };

  const columns = [
    { field: 'nombre', headerName: 'Nombre de Campaña', width: 200 },
    { field: 'fechaInicio', headerName: 'Fecha Inicio', width: 120 },
    { field: 'fechaFin', headerName: 'Fecha Fin', width: 120 },
    {
      field: 'rendimiento',
      headerName: 'Rendimiento',
      width: 130,
      renderCell: (params) => `${params.value.toFixed(2)}%`
    },
    {
      field: 'impactoEstimado',
      headerName: 'Impacto Estimado',
      width: 150,
      renderCell: (params) => params.value.toLocaleString()
    },
    {
      field: 'roi',
      headerName: 'ROI',
      width: 120,
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
        <Typography color="textPrimary">Rendimiento de Campañas</Typography>
      </Breadcrumbs>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Análisis de Rendimiento de Campañas
        </Typography>

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Rendimiento Promedio
                    </Typography>
                    <Typography variant="h4">
                      {(campanas.reduce((acc, curr) => acc + curr.rendimiento, 0) / campanas.length).toFixed(2)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Impacto Total
                    </Typography>
                    <Typography variant="h4">
                      {campanas.reduce((acc, curr) => acc + curr.impactoEstimado, 0).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      ROI Promedio
                    </Typography>
                    <Typography variant="h4">
                      {(campanas.reduce((acc, curr) => acc + parseFloat(curr.roi), 0) / campanas.length).toFixed(2)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <div style={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={campanas}
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