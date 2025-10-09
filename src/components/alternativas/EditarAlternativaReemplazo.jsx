import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Button, CircularProgress } from '@mui/material';

// Editor ligero para reemplazos de alternativas.
// Usa initialData para edición directa y retorna el objeto modificado vía onSave.
const EditarAlternativaReemplazo = ({
  alternativaId,
  isCreatingNew = false,
  initialData = {},
  onSave,
  onCancel,
  useProvidedDataOnly = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    try {
      setJsonText(JSON.stringify(initialData || {}, null, 2));
    } catch (e) {
      setJsonText('{}');
    }
  }, [initialData, alternativaId]);

  const handleSave = () => {
    try {
      setLoading(true);
      setJsonError('');
      const parsed = JSON.parse(jsonText || '{}');
      if (onSave) onSave(parsed);
    } catch (e) {
      setJsonError('JSON inválido: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Editar alternativa (reemplazo)
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={160}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Edita los campos de la alternativa en formato JSON y presiona Guardar.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={16}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            error={!!jsonError}
            helperText={jsonError || 'Asegúrate de mantener el formato correcto.'}
            sx={{ fontFamily: 'monospace' }}
          />

          <Box mt={2} display="flex" gap={2}>
            <Button variant="contained" color="primary" onClick={handleSave}>
              Guardar
            </Button>
            <Button variant="text" onClick={onCancel}>
              Cancelar
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default EditarAlternativaReemplazo;