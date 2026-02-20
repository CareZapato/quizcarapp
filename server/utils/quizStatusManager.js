import { query } from '../config/database.js';

let schemaReady = false;
let schemaReadyPromise = null;

export async function ensureQuizStatusSchema() {
  if (schemaReady) {
    return;
  }

  if (schemaReadyPromise) {
    return schemaReadyPromise;
  }

  schemaReadyPromise = (async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS quiz_statuses (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      INSERT INTO quiz_statuses (code, name, description)
      VALUES
        ('en_curso', 'En curso', 'Cuestionario en progreso, puede retomarse'),
        ('terminado', 'Terminado', 'Cuestionario entregado y corregido'),
        ('abandonado', 'Abandonado', 'Cuestionario abandonado por el usuario')
      ON CONFLICT (code) DO NOTHING
    `);

    const statusColumn = await query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'quizzes' AND column_name = 'status_id'
      LIMIT 1
    `);

    if (statusColumn.rows.length === 0) {
      await query('ALTER TABLE quizzes ADD COLUMN status_id INTEGER');
    }

    const fkConstraint = await query(`
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      WHERE tc.table_name = 'quizzes'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'status_id'
      LIMIT 1
    `);

    if (fkConstraint.rows.length === 0) {
      await query(`
        ALTER TABLE quizzes
        ADD CONSTRAINT quizzes_status_id_fkey
        FOREIGN KEY (status_id) REFERENCES quiz_statuses(id)
      `);
    }

    await query(`
      UPDATE quizzes
      SET status_id = CASE
        WHEN completed = TRUE THEN (SELECT id FROM quiz_statuses WHERE code = 'terminado')
        ELSE (SELECT id FROM quiz_statuses WHERE code = 'en_curso')
      END
      WHERE status_id IS NULL
    `);

    const inProgressStatus = await query(
      "SELECT id FROM quiz_statuses WHERE code = 'en_curso' LIMIT 1"
    );

    const inProgressStatusId = inProgressStatus.rows[0]?.id;
    if (inProgressStatusId) {
      await query(`ALTER TABLE quizzes ALTER COLUMN status_id SET DEFAULT ${inProgressStatusId}`);
      await query('ALTER TABLE quizzes ALTER COLUMN status_id SET NOT NULL');
    }

    schemaReady = true;
  })();

  try {
    await schemaReadyPromise;
  } catch (error) {
    schemaReadyPromise = null;
    throw error;
  }
}
