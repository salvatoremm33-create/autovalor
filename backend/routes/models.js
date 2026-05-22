const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/', async (req, res, next) => {
  try {
    const { make_id, popular } = req.query;
    let query = `
      SELECT m.id, m.name, m.body_type, m.segment, m.popular, m.make_id,
             mk.name AS make_name
      FROM models m
      JOIN makes mk ON m.make_id = mk.id
      WHERE 1=1
    `;
    const params = [];

    if (make_id) {
      params.push(make_id);
      query += ` AND m.make_id = $${params.length}`;
    }
    if (popular === 'true') {
      query += ' AND m.popular = true';
    }
    query += ' ORDER BY m.popular DESC, m.name ASC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT m.id, m.name, m.body_type, m.segment, m.popular, m.make_id,
              mk.name AS make_name
       FROM models m
       JOIN makes mk ON m.make_id = mk.id
       WHERE m.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Modelo no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
