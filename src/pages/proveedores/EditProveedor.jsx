import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  TextField,
  Button,
  Typography,
  Breadcrumbs,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { supabase } from '../../config/supabase';
import Swal from 'sweetalert2';

const EditProveedor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [regiones, setRegiones] = useState([]);
  const [comunas, setComunas] = useState([]);
  const [comunasFiltradas, setComunasFiltradas] = useState([]);
  const [formData, setFormData] = useState({
    RazonSocial: '',
    NombreDeFantasia: '',
    Rut: '',
    Giro: '',
    NombreRepresentanteLegal: '',
    RutRepresentanteLegal: '',
    Direccion: '',
    Region: '',
    Comuna: '',
    Telefono: '',
    Email: '',
    Estado: true
  });

  useEffect(() => {
    fetchRegiones();
    if (id) {
      fetchProveedor();
    }
  }, [id]);

  useEffect(() => {
    if (formData.Region) {
      fetchComunas(formData.Region);
    }
  }, [formData.Region]);

  const fetchProveedor = async () => {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching proveedor:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar la información del proveedor'
      });
      setLoading(false);
    }
  };

  const fetchRegiones = async () => {
    try {
      const { data, error } = await supabase
        .from('regiones')
        .select('*')
        .order('id');
      
      if (error) throw error;
      
      setRegiones(data);
    } catch (error) {
      console.error('Error fetching regiones:', error);
    }
  };

  const fetchComunas = async (regionId) => {
    try {
      const { data, error } = await supabase
        .from('comunas')
        .select('*')
        .eq('region_id', regionId)
        .order('comuna');
      
      if (error) throw error;
      
      setComunas(data);
      setComunasFiltradas(data);
    } catch (error) {
      console.error('Error fetching comunas:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('proveedores')
        .update(formData)
        .eq('id', id);

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Proveedor actualizado correctamente'
      });
      navigate('/proveedores');
    } catch (error) {
      console.error('Error updating proveedor:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el proveedor'
      });
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
            <Link component={RouterLink} to="/" color="inherit">
              Inicio
            </Link>
            <Link component={RouterLink} to="/proveedores" color="inherit">
              Proveedores
            </Link>
            <Typography color="text.primary">Editar Proveedor</Typography>
          </Breadcrumbs>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Editar Proveedor
            </Typography>

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Razón Social"
                    name="RazonSocial"
                    value={formData.RazonSocial}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre de Fantasía"
                    name="NombreDeFantasia"
                    value={formData.NombreDeFantasia}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="RUT"
                    name="Rut"
                    value={formData.Rut}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Giro"
                    name="Giro"
                    value={formData.Giro}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre Representante Legal"
                    name="NombreRepresentanteLegal"
                    value={formData.NombreRepresentanteLegal}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="RUT Representante Legal"
                    name="RutRepresentanteLegal"
                    value={formData.RutRepresentanteLegal}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Dirección"
                    name="Direccion"
                    value={formData.Direccion}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Región</InputLabel>
                    <Select
                      name="Region"
                      value={formData.Region}
                      onChange={handleChange}
                      label="Región"
                    >
                      {regiones.map((region) => (
                        <MenuItem key={region.id} value={region.id}>
                          {region.region}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Comuna</InputLabel>
                    <Select
                      name="Comuna"
                      value={formData.Comuna}
                      onChange={handleChange}
                      label="Comuna"
                      disabled={!formData.Region}
                    >
                      {comunasFiltradas.map((comuna) => (
                        <MenuItem key={comuna.id} value={comuna.id}>
                          {comuna.comuna}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    name="Telefono"
                    value={formData.Telefono}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="Email"
                    type="email"
                    value={formData.Email}
                    onChange={handleChange}
                    required
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                >
                  Guardar Cambios
                </Button>
                <Button
                  variant="outlined"
                  component={RouterLink}
                  to="/proveedores"
                >
                  Cancelar
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default EditProveedor;
