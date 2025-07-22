import { Request, Response } from 'express';
import { pool } from '../db/mysql'; // Importa el pool de conexiones

class SeatsController {
  public async getAvailableSeats(req: Request, res: Response): Promise<void> {
    // Puedes pasar parámetros por query si necesitas filtrar, ej. /availability?eventId=X&placeId=Y
    const { eventId, placeId, sectorId } = req.query;

    try {
      let query = 'SELECT * FROM seats WHERE is_available = TRUE';
      const queryParams: (string | number)[] = [];

      if (eventId) {
        query += ' AND event_id = ?';
        queryParams.push(Number(eventId));
      }
      if (placeId) {
        query += ' AND place_id = ?';
        queryParams.push(Number(placeId));
      }
      if (sectorId) {
        query += ' AND sector_id = ?';
        queryParams.push(Number(sectorId));
      }

      const [rows] = await pool.query(query, queryParams);
      res.status(200).json(rows);
    } catch (error: any) {
      console.error('Error al obtener asientos disponibles:', error);
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }

  public async updateSeatState(req: Request, res: Response): Promise<void> {
    const { idPlace, idSector, idSeat } = req.params;
    const { is_available, status } = req.body; // Asume que recibes el nuevo estado y/o disponibilidad

    try {
      // Ejemplo de actualización del estado de un asiento
      // Ajusta los campos y la tabla según tu base de datos (ej. 'seats' o 'event_seats')
      const [result] = await pool.query(
        'UPDATE seats SET is_available = ?, status = ? WHERE id_place = ? AND id_sector = ? AND id = ?',
        [is_available, status, idPlace, idSector, idSeat]
      );

      if ((result as any).affectedRows === 0) {
        res.status(404).json({ message: 'Asiento no encontrado o no se realizó ninguna actualización' });
        return;
      }
      res.status(200).json({ message: `Asiento ${idSeat} actualizado correctamente.` });
    } catch (error: any) {
      console.error('Error al actualizar el estado del asiento:', error);
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }
}

export default new SeatsController();