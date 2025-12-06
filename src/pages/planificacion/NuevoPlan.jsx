import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  FormControl,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Card,
  CardContent,
  Autocomplete,
  TextField,
  CircularProgress,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { supabase } from '../../config/supabase';
import './NuevoPlan.css';

const steps = ['Seleccionar Cliente', 'Seleccionar Campaña', 'Alternativas'];

const NuevoPlan = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [clientes, setClientes] = useState([]);
  const [searchCliente, setSearchCliente] = useState('');
  const [campanas, setCampanas] = useState([]);
  const [temas, setTemas] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedCampana, setSelectedCampana] = useState('');
  const [selectedTemas, setSelectedTemas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [anios, setAnios] = useState([]);
  const [meses, setMeses] = useState([]);
  const [planData, setPlanData] = useState({
    nombre_plan: '',
    anio: '',
    mes: '',
  });

  useEffect(() => {
    fetchClientes();
    fetchAnios();
    fetchMeses();
  }, []);

  useEffect(() => {
    if (selectedCliente) {
      fetchCampanas(selectedCliente.id_cliente);
    }
  }, [selectedCliente]);

  useEffect(() => {
    if (selectedCampana) {
      fetchTemas(selectedCampana);
    }
  }, [selectedCampana]);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Clientes')
        .select('*')
        .order('nombreCliente');

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampanas = async (clienteId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Campania')
        .select(`
          *,
          Clientes!id_Cliente (
            id_cliente,
            nombreCliente
          ),
          Productos!id_Producto (
            id,
            NombreDelProducto
          ),
          Anios!Anio (
            id,
            years
          )
        `)
        .eq('id_Cliente', clienteId)
        .order('NombreCampania');

      if (error) {
        console.error('Error detallado:', error);
        throw error;
      }
      console.log('Datos de campañas:', data);
      setCampanas(data || []);
    } catch (error) {
      console.error('Error al cargar campañas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemas = async (campanaId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campania_temas')
        .select(`
          id_temas,
          Temas!inner (
            id_tema,
            NombreTema,
            Duracion,
            CodigoMegatime,
            color,
            cooperado,
            rubro,
            estado,
            Medios:id_medio (
              id,
              NombredelMedio
            ),
            Calidad:id_Calidad (
              id,
              NombreCalidad
            )
          )
        `)
        .eq('id_campania', campanaId);

      if (error) throw error;

      // Transformar la estructura de datos
      const temasTransformados = data?.map(item => ({
        ...item.Temas,
        id_tema: item.id_temas,
        Calidad: item.Temas.Calidad ? {
          id_calidad: item.Temas.Calidad.id,
          NombreCalidad: item.Temas.Calidad.NombreCalidad
        } : null,
        Medios: item.Temas.Medios ? {
          id_medio: item.Temas.Medios.id,
          NombredelMedio: item.Temas.Medios.NombredelMedio
        } : null
      })) || [];

      setTemas(temasTransformados);
    } catch (error) {
      console.error('Error al cargar temas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnios = async () => {
    try {
      const { data, error } = await supabase
        .from('Anios')
        .select('id, years')
        .order('years', { ascending: false });

      if (error) throw error;
      setAnios(data || []);
    } catch (error) {
      console.error('Error al cargar años:', error);
    }
  };

  const fetchMeses = async () => {
    try {
      const { data, error } = await supabase
        .from('Meses')
        .select('Id, Nombre')
        .order('Id');

      if (error) throw error;
      setMeses(data || []);
    } catch (error) {
      console.error('Error al cargar meses:', error);
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSearchChange = (event) => {
    setSearchCliente(event.target.value);
  };

  const handleClienteChange = (event, newValue) => {
    setSelectedCliente(newValue);
    setSelectedCampana('');
    setSelectedTemas([]);
    setCampanas([]);
    setTemas([]);
    if (newValue) {
      fetchCampanas(newValue.id_cliente);
    }
  };

  const handleCampanaChange = (event) => {
    setSelectedCampana(event.target.value);
    setSelectedTemas([]);
    setTemas([]);
  };

  const handleTemaSelect = (temaId) => {
    setSelectedTemas(prev => {
      if (prev.includes(temaId)) {
        return prev.filter(id => id !== temaId);
      }
      return [...prev, temaId];
    });
  };

  const handlePlanDataChange = (field) => (event) => {
    setPlanData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleCreatePlan = async () => {
    try {
      setLoading(true);

      // Insertar en la tabla plan
      const { data: planInsertData, error: planError } = await supabase
        .from('plan')
        .insert([
          {
            id_campania: selectedCampana,
            anio: planData.anio,
            mes: planData.mes,
            nombre_plan: planData.nombre_plan,
            estado: 'P',
            estado2: 'Pendiente',
            num_correlativo: 0
          }
        ])
        .select()
        .single();

      if (planError) throw planError;

      // Insertar en la tabla campana_planes
      const { error: relError } = await supabase
        .from('campana_planes')
        .insert([
          {
            id_plan: planInsertData.id,
            id_campania: selectedCampana
          }
        ]);

      if (relError) throw relError;

      setOpenModal(false);
      // Navegar a la vista de alternativas
      navigate(`/planificacion/alternativas/${planInsertData.id}`);
    } catch (error) {
      console.error('Error al crear el plan:', error);
      alert('Error al crear el plan. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Autocomplete
              fullWidth
              options={clientes}
              getOptionLabel={(option) => option.nombreCliente}
              value={selectedCliente}
              onChange={handleClienteChange}
              loading={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar y Seleccionar Cliente"
                  variant="outlined"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                    endAdornment: (
                      <>
                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              filterOptions={(options, { inputValue }) => {
                const inputValueLower = inputValue.toLowerCase();
                return options.filter(option =>
                  option.nombreCliente.toLowerCase().includes(inputValueLower)
                );
              }}
              isOptionEqualToValue={(option, value) => option.id_cliente === value?.id_cliente}
              noOptionsText="No se encontraron clientes"
              loadingText="Cargando..."
            />
          </Box>
        );
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Card variant="outlined" className="campaign-card">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Campañas Disponibles
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Campaña</TableCell>
                          <TableCell>Año</TableCell>
                          <TableCell>Cliente</TableCell>
                          <TableCell>Producto</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {campanas.map((campana) => (
                          <TableRow
                            key={campana.id_campania}
                            hover
                            selected={selectedCampana === campana.id_campania}
                            onClick={() => handleCampanaChange({ target: { value: campana.id_campania } })}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell>{campana.NombreCampania}</TableCell>
                            <TableCell>{campana.Anios?.years}</TableCell>
                            <TableCell>{campana.Clientes?.nombreCliente}</TableCell>
                            <TableCell>{campana.Productos?.NombreDelProducto}</TableCell>
                            <TableCell>
                              {selectedCampana === campana.id_campania && (
                                <CheckCircleIcon color="primary" fontSize="small" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card variant="outlined" className="themes-card">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Temas de la Campaña
                  </Typography>
                  {temas.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Tema</TableCell>
                            <TableCell>Duración</TableCell>
                            <TableCell>Medio</TableCell>
                            <TableCell>Calidad</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {temas.map((tema) => (
                            <TableRow
                              key={tema.id_tema}
                              hover
                              selected={selectedTemas.includes(tema.id_tema)}
                              onClick={() => handleTemaSelect(tema.id_tema)}
                              sx={{ cursor: 'pointer' }}
                            >
                              <TableCell>{tema.NombreTema}</TableCell>
                              <TableCell>{tema.Duracion}</TableCell>
                              <TableCell>{tema.Medios?.NombredelMedio}</TableCell>
                              <TableCell>{tema.Calidad?.NombreCalidad}</TableCell>
                              <TableCell>
                                {tema.cooperado && "Cooperado"}
                                {tema.cooperado && tema.rubro && " - "}
                                {tema.rubro}
                              </TableCell>
                              <TableCell>
                                {selectedTemas.includes(tema.id_tema) && (
                                  <CheckCircleIcon color="primary" fontSize="small" />
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      minHeight: 200,
                      bgcolor: '#f5f5f5',
                      borderRadius: 1,
                      p: 2
                    }}>
                      <Typography variant="body1" color="text.secondary" align="center">
                        {selectedCampana ? 
                          "Esta campaña no tiene temas asociados" : 
                          "Seleccione una campaña para ver sus temas"}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      case 2:
        const campanaSeleccionada = campanas.find(c => c.id_campania === selectedCampana);
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        
        const selectedAnioObj = anios.find(a => a.id === planData.anio);
        const isCurrentYear = selectedAnioObj && Number(selectedAnioObj.years) === currentYear;

        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Alternativas de Plan
            </Typography>
            
            <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Campaña Seleccionada
              </Typography>
              <Typography variant="body1">
                {campanaSeleccionada?.NombreCampania}
              </Typography>
            </Card>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setOpenModal(true)}
                startIcon={<AddIcon />}
              >
                Crear Nuevo Plan
              </Button>
            </Box>

            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
              <DialogTitle>Crear Nuevo Plan</DialogTitle>
              <DialogContent>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label="Nombre del Plan"
                      value={planData.nombre_plan}
                      onChange={handlePlanDataChange('nombre_plan')}
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Año</InputLabel>
                      <Select
                        value={planData.anio}
                        onChange={handlePlanDataChange('anio')}
                        label="Año"
                      >
                        {anios
                          .filter(anio => Number(anio.years) >= currentYear)
                          .map((anio) => (
                          <MenuItem key={anio.id} value={anio.id}>
                            {anio.years}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Mes</InputLabel>
                      <Select
                        value={planData.mes}
                        onChange={handlePlanDataChange('mes')}
                        label="Mes"
                      >
                        {meses
                          .filter(mes => {
                            if (isCurrentYear) {
                                return Number(mes.Id) >= currentMonth;
                            }
                            return true;
                          })
                          .map((mes) => (
                          <MenuItem key={mes.Id} value={mes.Id}>
                            {mes.Nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
                <Button
                  variant="contained"
                  onClick={handleCreatePlan}
                  disabled={loading || !planData.nombre_plan || !planData.anio || !planData.mes}
                >
                  {loading ? <CircularProgress size={24} /> : 'Crear Plan'}
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" className="nuevo-plan-container">
      <Paper elevation={3} className="plan-paper">
        <Typography variant="h5" gutterBottom>
          Nuevo Plan de Medios
        </Typography>
        
        <Stepper activeStep={activeStep} className="stepper">
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box className="step-content">
          {renderStepContent(activeStep)}
        </Box>

        <Box className="step-actions">
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<NavigateBeforeIcon />}
          >
            Atrás
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<NavigateNextIcon />}
            disabled={
              (activeStep === 0 && !selectedCliente) ||
              (activeStep === 1 && !selectedCampana) ||
              activeStep === steps.length - 1
            }
          >
            {activeStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NuevoPlan;
