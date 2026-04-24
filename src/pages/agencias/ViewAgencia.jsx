import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import {
  Box,
  Tab,
  Tabs,
  Typography,
  Container,
  Paper,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Breadcrumbs,
  FormControlLabel,
  Switch,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import './ViewAgencia.css';
import Swal from 'sweetalert2';
import BusinessIcon from '@mui/icons-material/Business';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import LocationOnIcon from '@mui/icons-material/LocationOn';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function ViewAgencia() {
  const { id } = useParams();
  const [agencia, setAgencia] = useState({});
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState({
    NombreIdentificador: '',
    RazonSocial: '',
    NombreDeFantasia: '',
    RutAgencia: '',
    Giro: '',
    NombreRepresentanteLegal: '',
    rutRepresentante: '',
    DireccionAgencia: '',
    Region: '',
    Comuna: '',
    telCelular: '',
    telFijo: '',
    Email: '',
    codigo_megatime: '',
    estado: true
  });
  const [regiones, setRegiones] = useState({});
  const [comunas, setComunas] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);

        const [
          { data: agenciaData, error: agenciaError },
          { data: regionesData, error: regionesError },
          { data: comunasData, error: comunasError }
        ] = await Promise.all([
          supabase
            .from('Agencias')
            .select('*')
            .eq('id', id)
            .single(),
          supabase.from('Region').select('*'),
          supabase.from('Comunas').select('*')
        ]);

        if (agenciaError) throw agenciaError;
        if (regionesError) throw regionesError;
        if (comunasError) throw comunasError;

        if (agenciaData) {
          setAgencia(agenciaData);
        }

        const regionesObj = regionesData.reduce((acc, region) => {
          acc[region.id] = region.nombreRegion;
          return acc;
        }, {});

        const comunasObj = comunasData.reduce((acc, comuna) => {
          acc[comuna.id_comuna] = {
            nombreComuna: comuna.nombreComuna,
            id_region: comuna.id_region
          };
          return acc;
        }, {});

        setRegiones(regionesObj);
        setComunas(comunasObj);
      } catch (error) {
        console.error('Error cargando datos de la agencia:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadInitialData();
    }
  }, [id]);

  const validarRut = (rut) => {
    if (!rut || rut.trim() === '') return false;
    
    // Limpiar el RUT de puntos y guión
    let valor = rut.replace(/\./g, '').replace(/-/g, '');
    
    // Aislar Cuerpo y Dígito Verificador
    let cuerpo = valor.slice(0, -1);
    let dv = valor.slice(-1).toUpperCase();
    
    // Si no cumple con el mínimo de dígitos, es inválido
    if (cuerpo.length < 7) return false;
    
    // Calcular Dígito Verificador esperado
    let suma = 0;
    let multiplo = 2;
    
    // Para cada dígito del Cuerpo
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += Number(cuerpo[i]) * multiplo;
      multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }
    
    // Calcular Dígito Verificador
    let dvEsperado = 11 - (suma % 11);
    
    // Casos Especiales
    if (dvEsperado === 11) dvEsperado = '0';
    if (dvEsperado === 10) dvEsperado = 'K';
    else dvEsperado = String(dvEsperado);
    
    // Validar que el Dígito Verificador ingresado sea igual al esperado
    return dv === dvEsperado;
  };

  const validarEmail = (email) => {
    if (!email || email.trim() === '') return false;
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(email);
  };

  const validarTelefonoCelular = (telefono) => {
    if (!telefono || telefono.trim() === '') return true;
    const re = /^(\+?56)?(\s?)(0?9)(\s?)[98765432]\d{7}$/;
    return re.test(telefono);
  };

  const validarTelefonoFijo = (telefono) => {
    if (!telefono || telefono.trim() === '') return true;
    const re = /^(\+?56)?(\s?)([2-9]\d{7,8})$/;
    return re.test(telefono);
  };

  const validarFormulario = (data) => {
    const newErrors = {};
    let isValid = true;

    // Validar campos requeridos
    if (!data.NombreIdentificador?.trim()) {
      newErrors.NombreIdentificador = 'El nombre es requerido';
      isValid = false;
    }

    // Validar RUT
    if (!data.RutAgencia || !validarRut(data.RutAgencia)) {
      newErrors.RutAgencia = 'RUT inválido';
      isValid = false;
    }

    // Validar dirección
    if (!data.DireccionAgencia?.trim()) {
      newErrors.DireccionAgencia = 'La dirección es requerida';
      isValid = false;
    }

    // Validar Email
    if (!data.Email || !validarEmail(data.Email)) {
      newErrors.Email = 'Correo electrónico inválido';
      isValid = false;
    }

    // Validar teléfonos
    const celularValido = data.telCelular && validarTelefonoCelular(data.telCelular);
    const fijoValido = data.telFijo && validarTelefonoFijo(data.telFijo);

    if (!celularValido && !fijoValido) {
      newErrors.telefono = 'Se requiere al menos un teléfono válido';
      isValid = false;
    }

    if (data.telCelular && !validarTelefonoCelular(data.telCelular)) {
      newErrors.telCelular = 'Formato inválido para celular chileno (+569XXXXXXXX)';
      isValid = false;
    }

    if (data.telFijo && !validarTelefonoFijo(data.telFijo)) {
      newErrors.telFijo = 'Formato inválido para teléfono fijo chileno (+562XXXXXXX)';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedData = {
      ...editData,
      [name]: value
    };
    setEditData(updatedData);
    validarFormulario(updatedData);
  };

  const handleSave = async () => {
    try {
      // Validar antes de guardar
      if (!validarFormulario(editData)) {
        Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          text: 'Por favor, complete todos los campos requeridos y corrija los errores',
          customClass: {
            container: 'swal-container-class'
          }
        });
        return;
      }

      setIsSaving(true);

      const { error } = await supabase
        .from('Agencias')
        .update({
          NombreIdentificador: editData.NombreIdentificador.trim(),
          RazonSocial: editData.RazonSocial.trim(),
          NombreDeFantasia: editData.NombreDeFantasia.trim(),
          RutAgencia: editData.RutAgencia.trim(),
          Giro: editData.Giro.trim(),
          NombreRepresentanteLegal: editData.NombreRepresentanteLegal.trim(),
          rutRepresentante: editData.rutRepresentante.trim(),
          DireccionAgencia: editData.DireccionAgencia.trim(),
          Region: editData.Region,
          Comuna: editData.Comuna,
          telCelular: editData.telCelular?.trim() || null,
          telFijo: editData.telFijo?.trim() || null,
          Email: editData.Email.trim(),
          codigo_megatime: editData.codigo_megatime.trim(),
          estado: editData.estado
        })
        .eq('id', id);

      if (error) throw error;

      // Primero cerramos el modal
      setOpenModal(false);
      
      // Luego mostramos el mensaje de éxito
      await Swal.fire({
        icon: 'success',
        title: 'Agencia actualizada',
        showConfirmButton: false,
        timer: 1500,
        customClass: {
          container: 'swal-container-class'
        }
      });

      // Actualizar datos en memoria sin una nueva consulta
      setAgencia(prev => ({
        ...prev,
        ...editData
      }));

    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar la agencia',
        customClass: {
          container: 'swal-container-class'
        }
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!agencia) {
    return <div>No se pudo cargar la información de la agencia</div>;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Breadcrumb */}
        <Box sx={{ mb: 3, mt: 2 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
          <Link
            to="/agencias"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <GroupIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Agencias
          </Link>
          <Typography
            color="text.primary"
            sx={{
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <PersonIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            {agencia?.NombreIdentificador}
          </Typography>
        </Breadcrumbs>
      </Box>
      <Grid container spacing={3}>
        {/* Contenedor izquierdo */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2,
              width: '100%',
              position: 'relative'
            }}
          >
            <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
              <IconButton
                size="small"
                color="primary"
                onClick={() => {
                  setEditData({
                    NombreIdentificador: agencia.NombreIdentificador || '',
                    RazonSocial: agencia.RazonSocial || '',
                    NombreDeFantasia: agencia.NombreDeFantasia || '',
                    RutAgencia: agencia.RutAgencia || '',
                    Giro: agencia.Giro || '',
                    NombreRepresentanteLegal: agencia.NombreRepresentanteLegal || '',
                    rutRepresentante: agencia.rutRepresentante || '',
                    DireccionAgencia: agencia.DireccionAgencia || '',
                    Region: agencia.Region || '',
                    Comuna: agencia.Comuna || '',
                    telCelular: agencia.telCelular || '',
                    telFijo: agencia.telFijo || '',
                    Email: agencia.Email || '',
                    codigo_megatime: agencia.codigo_megatime || '',
                    estado: agencia.estado || false
                  });
                  setOpenModal(true);
                }}
              >
                <i className="fas fa-edit"></i>
              </IconButton>
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#4F46E5',
                textAlign: 'center',
                mb: 1
              }}
            >
              {agencia.NombreDeFantasia}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#6B7280',
                textAlign: 'center',
                mb: 0.5
              }}
            >
              Registrado el: {new Date(agencia.created_at).toLocaleDateString()}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#6B7280',
                textAlign: 'center'
              }}
            >
              Nombre Identificador: {agencia.NombreIdentificador}
            </Typography>
          </Paper>
        </Grid>

        {/* Contenedor derecho */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3}>
            <Box sx={{ padding:1, width: '100%' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab label="Datos Generales" />
                  <Tab label="Datos de Facturación" />
                </Tabs>
              </Box>

              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <div className="mb-4">
                      <Typography variant="subtitle2" color="textSecondary">
                        Razón Social
                      </Typography>
                      <Typography variant="body1">{agencia.RazonSocial || '-'}</Typography>
                    </div>
                  </Grid>
                  <Grid item xs={6}>
                    <div className="mb-4">
                      <Typography variant="subtitle2" color="textSecondary">
                        RUT Agencia
                      </Typography>
                      <Typography variant="body1">{agencia.RutAgencia || '-'}</Typography>
                    </div>
                  </Grid>
                  <Grid item xs={6}>
                    <div className="mb-4">
                      <Typography variant="subtitle2" color="textSecondary">
                        Nombre de Fantasía
                      </Typography>
                      <Typography variant="body1">{agencia.NombreDeFantasia || '-'}</Typography>
                    </div>
                  </Grid>
                  <Grid item xs={6}>
                    <div className="mb-4">
                      <Typography variant="subtitle2" color="textSecondary">
                        Giro
                      </Typography>
                      <Typography variant="body1">{agencia.Giro || '-'}</Typography>
                    </div>
                  </Grid>
                  <Grid item xs={6}>
                    <div className="mb-4">
                      <Typography variant="subtitle2" color="textSecondary">
                        Nombre Representante Legal
                      </Typography>
                      <Typography variant="body1">{agencia.NombreRepresentanteLegal || '-'}</Typography>
                    </div>
                  </Grid>
                  <Grid item xs={6}>
                    <div className="mb-4">
                      <Typography variant="subtitle2" color="textSecondary">
                        RUT Representante
                      </Typography>
                      <Typography variant="body1">{agencia.rutRepresentante || '-'}</Typography>
                    </div>
                  </Grid>
                  <Grid item xs={6}>
                    <div className="mb-4">
                      <Typography variant="subtitle2" color="textSecondary">
                        Código Megatime
                      </Typography>
                      <Typography variant="body1">{agencia.codigo_megatime || '-'}</Typography>
                    </div>
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <div className="mb-4">
                      <Typography variant="subtitle2" color="textSecondary">
                        Dirección
                      </Typography>
                      <Typography variant="body1">{agencia.DireccionAgencia || '-'}</Typography>
                    </div>
                  </Grid>
                  <Grid item xs={6}>
                    <div className="mb-4">
                      <Typography variant="subtitle2" color="textSecondary">
                        Teléfono Celular
                      </Typography>
                      <Typography variant="body1">{agencia.telCelular || '-'}</Typography>
                    </div>
                  </Grid>
                  <Grid item xs={6}>
                    <div className="mb-4">
                      <Typography variant="subtitle2" color="textSecondary">
                        Teléfono Fijo
                      </Typography>
                      <Typography variant="body1">{agencia.telFijo || '-'}</Typography>
                    </div>
                  </Grid>
                  <Grid item xs={6}>
                    <div className="mb-4">
                      <Typography variant="subtitle2" color="textSecondary">
                        Email
                      </Typography>
                      <Typography variant="body1">{agencia.Email || '-'}</Typography>
                    </div>
                  </Grid>
                  <Grid item xs={6}>
                    <div className="mb-4">
                      <Typography variant="subtitle2" color="textSecondary">
                        Región
                      </Typography>
                      <Typography variant="body1">{regiones[agencia.Region] || '-'}</Typography>
                    </div>
                  </Grid>
                  <Grid item xs={6}>
                    <div className="mb-4">
                      <Typography variant="subtitle2" color="textSecondary">
                        Comuna
                      </Typography>
                      <Typography variant="body1">{comunas[agencia.Comuna]?.nombreComuna || '-'}</Typography>
                    </div>
                  </Grid>
                </Grid>
              </TabPanel>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      {/* Modal de Edición */}
      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Editar Agencia</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Nombre Identificador"
                name="NombreIdentificador"
                value={editData.NombreIdentificador || ''}
                onChange={handleInputChange}
                error={!!errors.NombreIdentificador}
                helperText={errors.NombreIdentificador}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="RUT"
                name="RutAgencia"
                value={editData.RutAgencia || ''}
                onChange={handleInputChange}
                error={!!errors.RutAgencia}
                helperText={errors.RutAgencia}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="fas fa-id-card" style={{ color: 'black' }}></i>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Razón Social"
                name="RazonSocial"
                value={editData.RazonSocial || ''}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="fas fa-building" style={{ color: 'black' }}></i>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Nombre de Fantasía"
                name="NombreDeFantasia"
                value={editData.NombreDeFantasia || ''}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="fas fa-store" style={{ color: 'black' }}></i>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Giro"
                name="Giro"
                value={editData.Giro || ''}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="fas fa-briefcase" style={{ color: 'black' }}></i>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Nombre Representante Legal"
                name="NombreRepresentanteLegal"
                value={editData.NombreRepresentanteLegal || ''}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="fas fa-user-tie" style={{ color: 'black' }}></i>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="RUT Representante"
                name="rutRepresentante"
                value={editData.rutRepresentante || ''}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="fas fa-id-badge" style={{ color: 'black' }}></i>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Código Megatime"
                name="codigo_megatime"
                value={editData.codigo_megatime || ''}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="fas fa-barcode" style={{ color: 'black' }}></i>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Dirección"
                name="DireccionAgencia"
                value={editData.DireccionAgencia || ''}
                onChange={handleInputChange}
                error={!!errors.DireccionAgencia}
                helperText={errors.DireccionAgencia}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Región</InputLabel>
                <Select
                  value={editData.Region}
                  label="Región"
                  onChange={(e) => setEditData({ ...editData, Region: e.target.value })}
                  startAdornment={
                    <InputAdornment position="start">
                      <i className="fas fa-map" style={{ color: 'black' }}></i>
                    </InputAdornment>
                  }
                >
                  {Object.entries(regiones).map(([id, nombre]) => (
                    <MenuItem key={id} value={id}>{nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Comuna</InputLabel>
                <Select
                  value={editData.Comuna}
                  label="Comuna"
                  onChange={(e) => setEditData({ ...editData, Comuna: e.target.value })}
                  disabled={!editData.Region}
                  startAdornment={
                    <InputAdornment position="start">
                      <i className="fas fa-city" style={{ color: 'black' }}></i>
                    </InputAdornment>
                  }
                >
                  {Object.entries(comunas)
                    .filter(([_, comuna]) => comuna.id_region === parseInt(editData.Region))
                    .map(([id, comuna]) => (
                      <MenuItem key={id} value={id}>{comuna.nombreComuna}</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono Celular"
                name="telCelular"
                value={editData.telCelular || ''}
                onChange={handleInputChange}
                error={!!errors.telCelular}
                helperText={errors.telCelular || 'Formato: +569XXXXXXXX'}
                sx={{ mt: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="fas fa-phone" style={{ color: 'black' }}></i>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono Fijo"
                name="telFijo"
                value={editData.telFijo || ''}
                onChange={handleInputChange}
                error={!!errors.telFijo}
                helperText={errors.telFijo || 'Formato: +562XXXXXXX'}
                sx={{ mt: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="fas fa-phone-alt" style={{ color: 'black' }}></i>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Email"
                name="Email"
                type="email"
                value={editData.Email || ''}
                onChange={handleInputChange}
                error={!!errors.Email}
                helperText={errors.Email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="fas fa-envelope" style={{ color: 'black' }}></i>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editData.estado}
                    onChange={(e) => setEditData({ ...editData, estado: e.target.checked })}
                    color="primary"
                  />
                }
                label="Activo"
              />
            </Grid>
            {errors.telefono && (
              <Grid item xs={12}>
                <Typography color="error" variant="caption">
                  {errors.telefono}
                </Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} /> : null}
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ViewAgencia;
