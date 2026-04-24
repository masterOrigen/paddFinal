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
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { supabase } from '../../config/supabase';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Link as RouterLink } from 'react-router-dom';

export default function AnalisisMedios() {
  const [medios, setMedios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('mes');

  useEffect(() => {
    fetchMediosData();
  }, [periodoSeleccionado]);

  const fetchMediosData = async () => {
    try {
      const { data: mediosData, error: mediosError } = await supabase
        .from('Medios')
        .select('*');

      if (mediosError) throw mediosError;

      // Obtener datos de órdenes para análisis
      const { data: ordenesData, error: ordenesError } = await supabase
        .from('OrdenesDePublicidad')
        .select('*');

      if (ordenesError) throw ordenesError;

      const mediosConMetricas = mediosData.map(medio => ({
        ...medio,
        alcance: calcularAlcance(medio, ordenesData),
        efectividad: calcularEfectividad(medio, ordenesData),
        inversionTotal: calcularInversion(medio, ordenesData),
        frecuenciaUso: calcularFrecuenciaUso(medio, ordenesData)
      }));

      setMedios(mediosConMetricas);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar datos de medios:', error);
      setLoading(false);
    }
  };

  const calcularAlcance = (medio, ordenes) => {
    // Implementar cálculo de alcance basado en datos históricos
    return Math.floor(Math.random() * 1000000); // Placeholder
  };

  const calcularEfectividad = (medio, ordenes) => {
    // Implementar cálculo de efectividad
    return (Math.random() * 100).toFixed(2); // Placeholder
  };

  const calcularInversion = (medio, ordenes) => {
    // Implementar cálculo de inversión total
    return Math.floor(Math.random() * 1000000); // Placeholder
  };

  const calcularFrecuenciaUso = (medio, ordenes) => {
    // Implementar cálculo de frecuencia de uso
    return Math.floor(Math.random() * 100); // Placeholder
  };

  const columns = [
    { field: 'NombredelMedio', headerName: 'Medio', width: 200 },
    {
      field: 'alcance',
      headerName: 'Alcance',
      width: 150,
      renderCell: (params) => params.value.toLocaleString()
    },
    {
      field: 'efectividad',
      headerName: 'Efectividad',
      width: 130,
      renderCell: (params) => `${params.value}%`
    },
    {
      field: 'inversionTotal',
      headerName: 'Inversión Total',
      width: 150,
      renderCell: (params) => `$${params.value.toLocaleString()}`
    },
    {
      field: 'frecuenciaUso',
      headerName: 'Frecuencia de Uso',
      width: 150,
      renderCell: (params) => `${params.value} veces`
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
        <Typography color="textPrimary">Análisis de Medios</Typography>
      </Breadcrumbs>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Typography variant="h5">
              Análisis de Rendimiento de Medios
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Periodo</InputLabel>
              <Select
                value={periodoSeleccionado}
                label="Periodo"
                onChange={(e) => setPeriodoSeleccionado(e.target.value)}
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
                      Alcance Total
                    </Typography>
                    <Typography variant="h4">
                      {medios.reduce((acc, curr) => acc + curr.alcance, 0).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Efectividad Promedio
                    </Typography>
                    <Typography variant="h4">
                      {(medios.reduce((acc, curr) => acc + parseFloat(curr.efectividad), 0) / medios.length).toFixed(2)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Inversión Total
                    </Typography>
                    <Typography variant="h4">
                      ${medios.reduce((acc, curr) => acc + curr.inversionTotal, 0).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Medios Activos
                    </Typography>
                    <Typography variant="h4">
                      {medios.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <div style={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={medios}
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