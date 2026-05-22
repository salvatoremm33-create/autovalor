const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/', async (req, res, next) => {
  try {
    const { year_id } = req.query;

    if (!year_id) {
      return res.status(400).json({ error: 'Se requiere year_id' });
    }

    const result = await db.query(
      `SELECT t.id, t.name, t.engine, t.transmission, t.drivetrain,
              t.fuel_type, t.msrp_mxn, t.year_id
       FROM trims t
       WHERE t.year_id = $1
       ORDER BY t.msrp_mxn ASC NULLS LAST`,
      [year_id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT t.*, y.year, m.name AS model_name, mk.name AS make_name
       FROM trims t
       JOIN years y ON t.year_id = y.id
       JOIN models m ON y.model_id = m.id
       JOIN makes mk ON m.make_id = mk.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Versión no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
