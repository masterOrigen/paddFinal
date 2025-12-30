import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    Paper,
    Radio,
    FormControlLabel,
    Chip,
    InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import TopicIcon from '@mui/icons-material/Topic';
import TimerIcon from '@mui/icons-material/Timer';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import CodeIcon from '@mui/icons-material/Code';
import VerifiedIcon from '@mui/icons-material/Verified';
import CategoryIcon from '@mui/icons-material/Category';
import { supabase } from '../../config/supabase';
import Swal from 'sweetalert2';

const CustomCheckboxList = ({ medios, selectedMedios, onChange, onMedioChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const handleToggle = () => setIsOpen(!isOpen);
    
    const handleMedioSelect = (medio) => {
        // Como solo se puede seleccionar un medio, simplemente reemplazamos la selección
        const medioId = medio.id;
        const newSelection = [medioId]; // Array con un solo medio
        onChange(newSelection);
        onMedioChange(medio);
    };

    return (
        <FormControl fullWidth>
            <Box sx={{ position: 'relative' }}>
                <Box
                    onClick={handleToggle}
                    sx={{
                        border: '1px solid #ccc',
                        borderRadius: 1,
                        p: 1,
                        minHeight: '40px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.5
                    }}
                >
                    {selectedMedios.length > 0 ? (
                        selectedMedios.map(medioId => {
                            const medio = medios.find(m => m.id === medioId);
                            return medio ? (
                                <Chip
                                    key={medio.id}
                                    label={medio.NombredelMedio}
                                    onDelete={() => {
                                        onChange([]); // Limpiar selección
                                        onMedioChange(null); // Resetear campos visibles
                                    }}
                                    size="small"
                                />
                            ) : null;
                        })
                    ) : (
                        <Typography color="text.secondary">Seleccionar medio</Typography>
                    )}
                </Box>
                {isOpen && (
                    <Paper
                        sx={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            mt: 1,
                            maxHeight: '200px',
                            overflowY: 'auto',
                            zIndex: 1000,
                            boxShadow: 3
                        }}
                    >
                        <Box sx={{ p: 1 }}>
                            {medios.map((medio) => (
                                <FormControlLabel
                                    key={medio.id}
                                    control={
                                        <Radio
                                            checked={selectedMedios.includes(medio.id)}
                                            onChange={() => handleMedioSelect(medio)}
                                        />
                                    }
                                    label={medio.NombredelMedio}
                                />
                            ))}
                        </Box>
                    </Paper>
                )}
            </Box>
        </FormControl>
    );
};

const ModalAgregarTema = ({ open, onClose, onTemaAdded, idCampania, medioId, medioNombre }) => {
    const [formData, setFormData] = useState({
        NombreTema: '',
        Duracion: '',
        color: '',
        CodigoMegatime: '',
        id_Calidad: '',
        cooperado: 'No',
        rubro: '',
        id_medio: medioId || '', // Inicializar con medioId si existe
        estado: '1'
    });

    const [loading, setLoading] = useState(false);
    const [medios, setMedios] = useState([]);
    const [calidades, setCalidades] = useState([]);
    const [visibleFields, setVisibleFields] = useState({
        duracion: false,
        color: false,
        codigo_megatime: false,
        calidad: false,
        cooperado: false,
        rubro: false
    });

    useEffect(() => {
        fetchMedios();
        fetchCalidades();
        
        // Si hay un medio predeterminado, configurar los campos visibles
        if (medioId) {
            const selectedMedio = medios.find(m => m.id === medioId);
            if (selectedMedio) {
                setVisibleFields({
                    duracion: Boolean(selectedMedio.duracion),
                    color: Boolean(selectedMedio.color),
                    codigo_megatime: Boolean(selectedMedio.codigo_megatime),
                    calidad: Boolean(selectedMedio.calidad),
                    cooperado: Boolean(selectedMedio.cooperado),
                    rubro: Boolean(selectedMedio.rubro)
                });
            }
        }
    }, [medioId, medios]);

    const fetchMedios = async () => {
        try {
            const { data, error } = await supabase
                .from('Medios')
                .select(`
                    id,
                    NombredelMedio,
                    duracion,
                    color,
                    codigo_megatime,
                    calidad,
                    cooperado,
                    rubro
                `)
                .order('NombredelMedio');

            if (error) {
                console.error('Error al cargar medios:', error);
                throw error;
            }

            console.log('Datos recibidos de medios:', data);

            // Transformar los datos según los campos booleanos de la tabla
            const mediosConCampos = data.map(medio => ({
                ...medio,
                duracion: Boolean(medio.duracion),
                color: Boolean(medio.color),
                codigo_megatime: Boolean(medio.codigo_megatime),
                calidad: Boolean(medio.calidad),
                cooperado: Boolean(medio.cooperado),
                rubro: Boolean(medio.rubro)
            }));

            console.log('Medios procesados:', mediosConCampos);
            setMedios(mediosConCampos || []);
        } catch (error) {
            console.error('Error al cargar medios:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar los medios: ' + error.message
            });
        }
    };

    const fetchCalidades = async () => {
        try {
            const { data, error } = await supabase
                .from('Calidad')
                .select('id, NombreCalidad')
                .order('NombreCalidad');

            if (error) throw error;
            console.log('Calidades cargadas:', data);
            setCalidades(data || []);
        } catch (error) {
            console.error('Error al cargar calidades:', error);
        }
    };

    const handleMedioChange = (event) => {
        const medioId = Number(event.target.value); // Convertir a número
        console.log('Medio seleccionado ID:', medioId);
        
        const selectedMedio = medios.find(m => m.id === medioId); // Buscar por id en lugar de id_medio
        console.log('Medio encontrado:', selectedMedio);

        setFormData(prev => ({
            ...prev,
            id_medio: medioId
        }));

        if (selectedMedio) {
            console.log('Campos booleanos del medio:', {
                duracion: selectedMedio.duracion,
                color: selectedMedio.color,
                codigo_megatime: selectedMedio.codigo_megatime,
                calidad: selectedMedio.calidad,
                cooperado: selectedMedio.cooperado,
                rubro: selectedMedio.rubro
            });

            setVisibleFields({
                duracion: Boolean(selectedMedio.duracion),
                color: Boolean(selectedMedio.color),
                codigo_megatime: Boolean(selectedMedio.codigo_megatime),
                calidad: Boolean(selectedMedio.calidad),
                cooperado: Boolean(selectedMedio.cooperado),
                rubro: Boolean(selectedMedio.rubro)
            });
        } else {
            setVisibleFields({
                duracion: false,
                color: false,
                codigo_megatime: false,
                calidad: false,
                cooperado: false,
                rubro: false
            });
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            // 1. Obtener el siguiente ID disponible para Temas
            const { data: maxIdData, error: maxIdError } = await supabase
                .from('Temas')
                .select('id_tema')
                .order('id_tema', { ascending: false })
                .limit(1);

            if (maxIdError) {
                console.error('Error al obtener el máximo id_tema:', maxIdError);
                throw maxIdError;
            }

            const nextId = maxIdData.length > 0 ? maxIdData[0].id_tema + 1 : 1;

            // 2. Insertar en la tabla Temas con el ID específico
            const temaDataToInsert = {
                id_tema: nextId,
                NombreTema: formData.NombreTema,
                Duracion: formData.Duracion || null,
                CodigoMegatime: formData.CodigoMegatime || null,
                id_Calidad: formData.id_Calidad || null,
                color: formData.color || null,
                cooperado: formData.cooperado || 'No',
                rubro: formData.rubro || null,
                estado: formData.estado,  // Agregar campo de estado
                id_medio: formData.id_medio || null
            };

            console.log('Datos a insertar en Temas:', temaDataToInsert);

            const { data: temaData, error: temaError } = await supabase
                .from('Temas')
                .insert([temaDataToInsert])
                .select()
                .single();

            if (temaError) {
                console.error('Error al insertar tema:', temaError);
                throw temaError;
            }

            console.log('Tema insertado:', temaData);

            // 3. Insertar en la tabla campania_temas
            const { error: campaniaTemasError } = await supabase
                .from('campania_temas')
                .insert([{
                    id_campania: idCampania,
                    id_temas: nextId
                }]);

            if (campaniaTemasError) {
                console.error('Error al insertar en campania_temas:', campaniaTemasError);
                throw campaniaTemasError;
            }

            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Tema agregado correctamente'
            });

            // Llamar a onTemaAdded para actualizar la lista de temas
            if (typeof onTemaAdded === 'function') {
                await onTemaAdded();
            }
            
            onClose();

        } catch (error) {
            console.error('Error completo:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo agregar el tema: ' + (error.message || 'Error desconocido')
            });
        } finally {
            setLoading(false);
        }
    };
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Agregar Tema
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid container spacing={2}>
                    <Grid item xs={12}>
                            {medioId ? (
                                <TextField
                                    fullWidth
                                    label="Medio"
                                    value={medioNombre || ''}
                                    disabled
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CategoryIcon sx={{ mr: 1 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            ) : (
                                <TextField
                                    select
                                    fullWidth
                                    label="Medio"
                                    value={formData.id_medio}
                                    onChange={handleMedioChange}
                                    name="id_medio"
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CategoryIcon sx={{ mr: 1 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>Seleccione un medio</em>
                                    </MenuItem>
                                    {medios.map((medio) => (
                                        <MenuItem key={medio.id} value={medio.id}>
                                            {medio.NombredelMedio}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nombre de Tema"
                                name="NombreTema"
                                value={formData.NombreTema}
                                onChange={handleChange}
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <TopicIcon sx={{ mr: 1 }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        {visibleFields.duracion && (
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Duración"
                                    name="Duracion"
                                    value={formData.Duracion}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <TimerIcon sx={{ mr: 1 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                        )}
                        {visibleFields.color && (
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Color"
                                    name="color"
                                    value={formData.color || ''}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <ColorLensIcon sx={{ mr: 1 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>Seleccione un color</em>
                                    </MenuItem>
                                    <MenuItem value="5-B/N">5-B/N</MenuItem>
                                    <MenuItem value="1 Color">1 Color</MenuItem>
                                    <MenuItem value="2 Colores">2 Colores</MenuItem>
                                    <MenuItem value="3 Colores">3 Colores</MenuItem>
                                    <MenuItem value="4 Colores">4 Colores</MenuItem>
                                </TextField>
                            </Grid>
                        )}
                        {visibleFields.codigo_megatime && (
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Código Megatime"
                                    name="CodigoMegatime"
                                    value={formData.CodigoMegatime}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CodeIcon sx={{ mr: 1 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                        )}
                        {visibleFields.calidad && (
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Calidad"
                                    name="id_Calidad"
                                    value={formData.id_Calidad || ''}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <VerifiedIcon sx={{ mr: 1 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>Ninguna</em>
                                    </MenuItem>
                                    {calidades.map((calidad) => (
                                        <MenuItem key={calidad.id} value={calidad.id}>
                                            {calidad.NombreCalidad}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        )}
                        {visibleFields.cooperado && (
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Cooperado</InputLabel>
                                    <Select
                                        value={formData.cooperado}
                                        onChange={handleChange}
                                        name="cooperado"
                                        label="Cooperado"
                                    >
                                        <MenuItem value="No">No</MenuItem>
                                        <MenuItem value="Sí">Sí</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}
                        {visibleFields.rubro && (
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Rubro"
                                    name="rubro"
                                    value={formData.rubro}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CategoryIcon sx={{ mr: 1 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                        )}
                        <Grid item xs={6} style={{ display: 'none' }}>
                            <FormControl fullWidth>
                                <TextField
                                    select
                                    name="estado"
                                    value={formData.estado}
                                    onChange={handleChange}
                                    label="Estado"
                                    SelectProps={{
                                        native: true
                                    }}
                                >
                                    <option value="1">Activo</option>
                                    <option value="0">Inactivo</option>
                                </TextField>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : 'Guardar'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ModalAgregarTema;
