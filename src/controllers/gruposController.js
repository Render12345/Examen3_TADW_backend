// src/controllers/gruposController.js
import supabase from '../config/db.js';

/**
 * GET /api/movil/estudiante/grupos/:id_grupo/maestro
 * Devuelve el maestro_id del grupo indicado.
 */
export const getMaestroDeGrupo = async (req, res) => {
  const { id_grupo } = req.params;

  try {
    const { data, error } = await supabase
      .from('grupos')
      .select('maestro_id')
      .eq('id_grupo', id_grupo)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: 'Grupo no encontrado' });
    }

    return res.status(200).json({ maestro_id: data.maestro_id });
  } catch (error) {
    console.error('Error en getMaestroDeGrupo:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};