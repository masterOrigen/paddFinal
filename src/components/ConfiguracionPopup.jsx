import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Typography,
    Box,
    Divider,
    Switch,
    FormControlLabel,
    CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';

const SETTINGS = [
    {
        clave: 'contratos_ocultar_anteriores',
        label: 'Contratos',
        descripcion: 'Ocultar contratos de años anteriores al año actual'
    },
    {
        clave: 'campanas_ocultar_anteriores',
        label: 'Campañas',
        descripcion: 'Ocultar campañas de años anteriores al año actual'
    },
    {
        clave: 'planes_ocultar_anteriores',
        label: 'Planes de Medios',
        descripcion: 'Ocultar planes de años anteriores al año actual'
    }
];

const ConfiguracionPopup = ({ open, onClose }) => {
    const [valores, setValores] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null); // clave que se está guardando

    useEffect(() => {
        if (open) fetchSettings();
    }, [open]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const claves = SETTINGS.map(s => s.clave);
            const { data, error } = await supabase
                .from('configuracion_settings')
                .select('clave, valor')
                .in('clave', claves);

            if (error) throw error;

            const map = {};
            (data || []).forEach(row => {
                map[row.clave] = row.valor === 'true';
            });
            setValores(map);
        } catch {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar la configuración' });
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (clave) => {
        const nuevoValor = !valores[clave];
        setValores(prev => ({ ...prev, [clave]: nuevoValor }));
        setSaving(clave);

        try {
            const { error } = await supabase
                .from('configuracion_settings')
                .update({ valor: nuevoValor.toString(), updated_at: new Date().toISOString() })
                .eq('clave', clave);

            if (error) throw error;
        } catch {
            // Revertir si falla
            setValores(prev => ({ ...prev, [clave]: !nuevoValor }));
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar la configuración' });
        } finally {
            setSaving(null);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <SettingsIcon color="primary" />
                    <Typography variant="h6">Configuración del Sistema</Typography>
                </Box>
                <IconButton
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                {loading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Controla la visibilidad de registros de años anteriores. Al activar una opción,
                            todos los usuarios solo verán registros del año {new Date().getFullYear()}.
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        {SETTINGS.map((setting, index) => (
                            <Box key={setting.clave}>
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    py={1.5}
                                >
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={500}>
                                            {setting.label}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {setting.descripcion}
                                        </Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        {saving === setting.clave && (
                                            <CircularProgress size={16} />
                                        )}
                                        <Switch
                                            checked={!!valores[setting.clave]}
                                            onChange={() => handleToggle(setting.clave)}
                                            disabled={saving === setting.clave}
                                            color="warning"
                                        />
                                    </Box>
                                </Box>
                                {index < SETTINGS.length - 1 && <Divider />}
                            </Box>
                        ))}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ConfiguracionPopup;
