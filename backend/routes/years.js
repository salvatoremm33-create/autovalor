const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/', async (req, res, next) => {
  try {
    const { model_id } = req.query;

    if (!model_id) {
      return res.status(400).json({ error: 'Se requiere model_id' });
    }

    const result = await db.query(
      `SELECT y.id, y.year, y.model_id
       FROM years y
       WHERE y.model_id = $1
       ORDER BY y.year DESC`,
      [model_id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
