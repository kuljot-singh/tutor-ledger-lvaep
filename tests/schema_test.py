"""Exercise the actual migration with a disposable in-memory SQLite database."""
import pathlib
import sqlite3

root = pathlib.Path(__file__).resolve().parents[1]
db = sqlite3.connect(':memory:')
migrations = sorted((root / 'drizzle').glob('*.sql'))
db.executescript(migrations[0].read_text())
# Existing production rows must survive the additive achievement migration.
db.execute("INSERT INTO sessions (id,assignment_id,date,minutes,status,notes) VALUES ('legacy','a3','2026-08-01',60,'attended','Keep me')")
for migration in migrations[1:]:
    db.executescript(migration.read_text())
assert db.execute("SELECT notes,achievement_id FROM sessions WHERE id='legacy'").fetchone() == ('Keep me','')
db.execute("UPDATE sessions SET achievement_id='retain_employment' WHERE id='legacy'")
assert db.execute("SELECT achievement_id FROM sessions WHERE id='legacy'").fetchone()[0] == 'retain_employment'
db.execute("DELETE FROM sessions WHERE id='legacy'")

insert = 'INSERT INTO sessions (id,assignment_id,date,minutes,status) VALUES (?,?,?,?,?)'
db.execute(insert, ('one','a1','2026-09-10',90,'attended'))
for bad in [('duplicate','a1','2026-09-10',60,'attended'),
            ('absence','a2','2026-09-10',60,'student_absent'),
            ('fraction','a3','2026-09-10',17,'attended')]:
    try:
        db.execute(insert, bad)
        raise AssertionError(f'Invalid row accepted: {bad[0]}')
    except sqlite3.IntegrityError:
        pass

db.execute('UPDATE sessions SET minutes=? WHERE id=?', (120,'one'))
assert db.execute('SELECT SUM(minutes) FROM sessions').fetchone()[0] == 120
db.execute('DELETE FROM sessions WHERE id=?', ('one',))
assert db.execute('SELECT COUNT(*) FROM sessions').fetchone()[0] == 0
print('Schema checks passed: duplicate protection, attendance constraints, update, delete.')

# Sample loader conflict policy must preserve edits on repeat loads.
db.execute(insert, ('sample','a1','2026-09-01',120,'attended'))
db.execute("UPDATE sessions SET notes='User edit',achievement_id='other' WHERE id='sample'")
db.execute(insert + ' ON CONFLICT (assignment_id,date) DO NOTHING', ('repeat','a1','2026-09-01',60,'attended'))
assert db.execute("SELECT minutes,notes,achievement_id FROM sessions WHERE id='sample'").fetchone() == (120,'User edit','other')
print('Migration preservation, achievement persistence, and repeat-loading checks passed.')
