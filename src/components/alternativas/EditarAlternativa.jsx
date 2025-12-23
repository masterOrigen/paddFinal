import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Paper,
  InputAdornment
} from '@mui/material';
import { supabase } from '../../config/supabase';
import Swal from 'sweetalert2';
import CalendarioAlternativa from './CalendarioAlternativa';

const TIPO_ITEMS = [
  'PAUTA LIBRE',
  'AUSPICIO',
  'VPS',
  'CPR',
  'CPM',
  'CPC',
  'BONIF%',
  'CANJE'
];

const EditarAlternativa = ({ alternativaId, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [soportes, setSoportes] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [clasificaciones, setClasificaciones] = useState([]);
  const [temas, setTemas] = useState([]);
  
  const [selectedSoporte, setSelectedSoporte] = useState(null);
  const [selectedTema, setSelectedTema] = useState(null);
  
  const [formData, setFormData] = useState({
    // Campos de identificación
    nlinea: '',
    numerorden: '',
    anio: '',
    mes: '',
    id_campania: '',
    num_contrato: '',

    // Campos de soporte y programa
    id_soporte: '',
    soporte: '',
    medio: '',
    id_programa: '',
    programa: '',
    horario_inicio: '00:00',
    horario_fin: '22:00',

    // Campos de clasificación y tema
    tipo_item: '',
    id_clasificacion: '',
    clasificacion: '',
    detalle: '',
    id_tema: '',
    tema: '',
    segundos: '',

    // Campos de montos y descuentos
    valor_unitario: '',
    descuento_pl: '',
    recargo_plan: '',
    total_bruto: '',
    total_neto: '',
    total_general: '',

    // Campos de contrato
    contrato: '',
    forma_de_pago: '',
    formaDePago: '',
    nombreFormaPago: '',

    // Calendario
    calendar: []
  });

  // Cargar datos relacionados (soportes, programas, etc.)
  useEffect(() => {
    const loadRelatedData = async () => {
      try {
        setLoading(true);
        
        // Cargar soportes
        const { data: soportesData } = await supabase.from('Soportes').select('*');
        if (soportesData) setSoportes(soportesData);
        
        // Cargar programas
        const { data: programasData } = await supabase.from('Programas').select('*');
        if (programasData) setProgramas(programasData);
        
        // Cargar clasificaciones
        const { data: clasificacionesData } = await supabase.from('Clasificacion').select('*');
        if (clasificacionesData) setClasificaciones(clasificacionesData);
        
        // Cargar temas
        const { data: temasData } = await supabase.from('Temas').select('*');
        if (temasData) setTemas(temasData);
      } catch (error) {
        console.error('Error al cargar datos relacionados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadRelatedData();
  }, []);

  // Cargar datos de la alternativa cuando se proporciona un ID
  useEffect(() => {
    const loadAlternativa = async () => {
      if (!alternativaId) return;
      
      try {
        setLoading(true);
        
        const { data: alternativa, error } = await supabase
          .from('alternativa')
          .select(`
            *,
            Contratos:num_contrato (*,
              formaPago:id_FormadePago (
                id,
                NombreFormadePago
              )
            ),
            Soportes:id_soporte (*),
            Programas:id_programa (*),
            Temas:id_tema (
              id_tema,
              NombreTema,
              Duracion,
              id_medio,
              Medios:id_medio (
                id,
                NombredelMedio
              )
            ),
            Clasificacion:id_clasificacion (*)
          `)
          .eq('id', alternativaId)
          .single();
        
        if (error) throw error;

        if (!alternativa) {
          throw new Error('No se encontró la alternativa');
        }
        
        // Set selected values
        if (alternativa.Soportes) {
          setSelectedSoporte(alternativa.Soportes);
        }
        if (alternativa.Temas) {
          setSelectedTema(alternativa.Temas);
        }
        
        // Prepare data for editing with all necessary fields
        const alternativaParaEditar = {
          ...alternativa,
          nlinea: alternativa.nlinea || '',
          numerorden: alternativa.numerorden || '',
          anio: alternativa.anio || '',
          mes: alternativa.mes || '',
          id_campania: alternativa.id_campania || '',
          num_contrato: alternativa.num_contrato || '',
          id_soporte: alternativa.id_soporte || '',
          id_programa: alternativa.id_programa || '',
          tipo_item: alternativa.tipo_item || '',
          id_clasificacion: alternativa.id_clasificacion || '',
          detalle: alternativa.detalle || '',
          id_tema: alternativa.id_tema || '',
          segundos: alternativa.Temas?.Duracion || '',
          total_general: alternativa.total_general || '',
          total_neto: alternativa.total_neto || '',
          descuento_pl: alternativa.descuento_pl || '',
          recargo_plan: alternativa.recargo_plan || '',
          valor_unitario: alternativa.valor_unitario || '',
          medio: alternativa.Temas?.id_medio || '',
          total_bruto: alternativa.total_bruto || '',
          calendar: alternativa.calendar || [],
          horario_inicio: alternativa.horario_inicio || '00:00',
          horario_fin: alternativa.horario_fin || '22:00',
          // Related data display
          soporte: alternativa.Soportes?.nombreIdentficiador || '',
          tema: alternativa.Temas?.NombreTema || '',
          programa: alternativa.Programas?.descripcion || '',
          clasificacion: alternativa.Clasificacion?.NombreClasificacion || '',
          contrato: alternativa.Contratos?.NombreContrato || '',
          formaDePago: alternativa.Contratos?.formaPago?.id || '',
          nombreFormaPago: alternativa.Contratos?.formaPago?.NombreFormadePago || ''
        };
        
        setFormData(alternativaParaEditar);
      } catch (error) {
        console.error('Error al cargar alternativa para editar:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'No se pudo cargar la alternativa para editar'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadAlternativa();
  }, [alternativaId]);

  // Manejar cambios en los campos del formulario
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Manejar cambios en las cantidades del calendario
  const handleCantidadChange = (dia, valor) => {
    setFormData(prev => {
      let nuevasCantidades = [...(prev.calendar || [])];
      const index = nuevasCantidades.findIndex(item => item.dia === dia);
      
      if (valor && valor !== '0') {
        if (index !== -1) {
          nuevasCantidades[index] = { dia, cantidad: Number(valor) };
        } else {
          nuevasCantidades.push({ dia, cantidad: Number(valor) });
        }
      } else {
        if (index !== -1) {
          nuevasCantidades.splice(index, 1);
        }
      }

      nuevasCantidades.sort((a, b) => a.dia - b.dia);

      return {
        ...prev,
        calendar: nuevasCantidades
      };
    });
  };

  // Guardar cambios
  const handleSave = async () => {
    try {
      setLoading(true);
      
      if (!alternativaId) {
        throw new Error('ID de alternativa no válido');
      }

      // Validate required fields
      const requiredFields = {
        'Contrato': formData.num_contrato,
        'Tipo Item': formData.tipo_item,
        'Soporte': formData.id_soporte,
        'Programa': formData.id_programa,
        'Clasificación': formData.id_clasificacion,
        'Tema': formData.id_tema,
        'Horario Inicio': formData.horario_inicio,
        'Horario Fin': formData.horario_fin
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([field]) => field);

      if (missingFields.length > 0) {
        throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
      }

      // Clean numeric values
      const cleanNumericValue = (value) => {
        if (value === "" || value === null || value === undefined) return null;
        return Number(value);
      };
      
      const { error } = await supabase
        .from('alternativa')
        .update({
          nlinea: formData.nlinea,
          numerorden: formData.numerorden,
          anio: formData.anio,
          mes: formData.mes,
          id_campania: formData.id_campania,
          num_contrato: cleanNumericValue(formData.num_contrato),
          id_soporte: cleanNumericValue(formData.id_soporte),
          id_programa: cleanNumericValue(formData.id_programa),
          tipo_item: formData.tipo_item,
          id_clasificacion: cleanNumericValue(formData.id_clasificacion),
          detalle: formData.detalle || null,
          id_tema: cleanNumericValue(formData.id_tema),
          segundos: cleanNumericValue(formData.segundos),
          total_general: cleanNumericValue(formData.total_general),
          total_neto: cleanNumericValue(formData.total_neto),
          descuento_pl: cleanNumericValue(formData.descuento_pl),
          recargo_plan: cleanNumericValue(formData.recargo_plan),
          valor_unitario: cleanNumericValue(formData.valor_unitario),
          medio: cleanNumericValue(formData.medio),
          total_bruto: cleanNumericValue(formData.total_bruto),
          horario_inicio: formData.horario_inicio,
          horario_fin: formData.horario_fin,
          calendar: formData.calendar?.length > 0 ? formData.calendar : null
        })
        .eq('id', alternativaId);
      
      if (error) throw error;
      
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Alternativa actualizada correctamente'
      });
      
      if (onSave) onSave();
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo guardar los cambios'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <CircularProgress />
        </Box>
      ) : (
        <Box component="form" sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {/* Campos de identificación */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="N° Orden"
                value={formData.numerorden}
                margin="dense"
                size="small"
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            {/* Campos de contrato */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contrato"
                value={formData.contrato}
                margin="dense"
                size="small"
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Forma de Pago"
                value={formData.nombreFormaPago}
                margin="dense"
                size="small"
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            {/* Campos de soporte y programa */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="dense" size="small">
                <InputLabel>Soporte</InputLabel>
                <Select
                  value={selectedSoporte?.id_soporte || ''}
                  onChange={(e) => {
                    const soporte = soportes.find(s => s.id_soporte === e.target.value);
                    setSelectedSoporte(soporte);
                    handleFormChange('id_soporte', e.target.value);
                  }}
                  label="Soporte"
                >
                  {soportes.map((soporte) => (
                    <MenuItem key={soporte.id_soporte} value={soporte.id_soporte}>
                      {soporte.nombreIdentficiador}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="dense" size="small">
                <InputLabel>Programa</InputLabel>
                <Select
                  value={formData.id_programa || ''}
                  onChange={(e) => handleFormChange('id_programa', e.target.value)}
                  label="Programa"
                >
                  {programas.map((programa) => (
                    <MenuItem key={programa.id} value={programa.id}>
                      {programa.descripcion}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Campos de horario */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Horario Inicio"
                type="time"
                value={formData.horario_inicio}
                onChange={(e) => handleFormChange('horario_inicio', e.target.value)}
                margin="dense"
                size="small"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Horario Fin"
                type="time"
                value={formData.horario_fin}
                onChange={(e) => handleFormChange('horario_fin', e.target.value)}
                margin="dense"
                size="small"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            {/* Campos de clasificación y tema */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="dense" size="small">
                <InputLabel>Tipo Item</InputLabel>
                <Select
                  value={formData.tipo_item || ''}
                  onChange={(e) => handleFormChange('tipo_item', e.target.value)}
                  label="Tipo Item"
                >
                  {TIPO_ITEMS.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="dense" size="small">
                <InputLabel>Clasificación</InputLabel>
                <Select
                  value={formData.id_clasificacion || ''}
                  onChange={(e) => handleFormChange('id_clasificacion', e.target.value)}
                  label="Clasificación"
                >
                  {clasificaciones.map((clasificacion) => (
                    <MenuItem key={clasificacion.id} value={clasificacion.id}>
                      {clasificacion.NombreClasificacion}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Detalle"
                value={formData.detalle || ''}
                onChange={(e) => handleFormChange('detalle', e.target.value)}
                margin="dense"
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="dense" size="small">
                <InputLabel>Tema</InputLabel>
                <Select
                  value={selectedTema?.id_tema || ''}
                  onChange={(e) => {
                    const tema = temas.find(t => t.id_tema === e.target.value);
                    setSelectedTema(tema);
                    handleFormChange('id_tema', e.target.value);
                  }}
                  label="Tema"
                >
                  {temas.map((tema) => (
                    <MenuItem key={tema.id_tema} value={tema.id_tema}>
                      {tema.NombreTema}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Segundos"
                value={formData.segundos || ''}
                onChange={(e) => handleFormChange('segundos', e.target.value)}
                margin="dense"
                size="small"
                type="number"
              />
            </Grid>

            {/* Campos de montos */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Valor Unitario"
                value={formData.valor_unitario || ''}
                onChange={(e) => handleFormChange('valor_unitario', e.target.value)}
                margin="dense"
                size="small"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Descuento Plan"
                value={formData.descuento_pl || ''}
                onChange={(e) => handleFormChange('descuento_pl', e.target.value)}
                margin="dense"
                size="small"
                type="number"
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Recargo Plan"
                value={formData.recargo_plan || ''}
                onChange={(e) => handleFormChange('recargo_plan', e.target.value)}
                margin="dense"
                size="small"
                type="number"
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total Bruto"
                value={formData.total_bruto || ''}
                margin="dense"
                size="small"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  readOnly: true,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total Neto"
                value={formData.total_neto || ''}
                margin="dense"
                size="small"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  readOnly: true,
                }}
              />
            </Grid>

            {/* Calendario */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Calendario
              </Typography>
              <Box sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
                <CalendarioAlternativa
                  anio={formData.anio}
                  mes={formData.mes}
                  cantidades={formData.calendar}
                  onChange={handleCantidadChange}
                />
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
            <Button 
              onClick={onCancel} 
              color="inherit"
            >
              Cancelar
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSave}
              disabled={loading}
            >
            Actualizar Alternativa
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default EditarAlternativa;
