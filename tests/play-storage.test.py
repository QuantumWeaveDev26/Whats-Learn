"""Exercise the actual production SQL against SQLite, including account isolation."""
from pathlib import Path
import re, sqlite3
root=Path(__file__).resolve().parents[1]
source=(root/'lib/save-creation.ts').read_text()
queries=re.findall(r'db\.prepare\(([\"\'])(.*?)\1\)',source)
revision,work,practice=[query for _,query in queries]
db=sqlite3.connect(':memory:')
for migration in sorted((root/'drizzle').glob('*.sql')):
    db.executescript(migration.read_text())

def save(user,body,reflect=False,date='2026-10-06'):
    now=date+'T03:00:00Z'
    with db:
        if reflect:
            db.execute(revision,(user,'revision:m1','m1',now,user,'m1',body.strip()))
        db.execute(work,(user,'m1',body.strip(),'[true,true,true,true,true]','1',now))
        db.execute(practice,(user,'practice:'+date,'m1',now))

def revisions(user):
    return db.execute("SELECT COUNT(*) FROM practice_events WHERE user_id=? AND kind='revision'",(user,)).fetchone()[0]
save('alice','original work',True)
assert revisions('alice')==0, 'First save cannot be a revision'
save('bob','bob initial',True)
assert revisions('bob')==0, 'Another account cannot supply the original'
save('alice',' original work ',True)
assert revisions('alice')==0, 'Whitespace-only changes cannot earn a revision'
save('alice','a changed response',False)
assert revisions('alice')==0, 'Changing text without reflection earns no revision'
save('alice','a reflected response',True,date='2026-10-07')
save('alice','a second reflected response',True,date='2026-10-08')
assert revisions('alice')==1, 'Repeated revisions are deduplicated'
assert revisions('bob')==0
assert db.execute("SELECT COUNT(*) FROM practice_events WHERE user_id='alice' AND kind='practice'").fetchone()[0]==3
# An invalid work write must roll back the revision inserted just before it.
save('charlie','first work')
try:
    with db:
        db.execute(revision,('charlie','revision:m1','m1','2026-10-07T03:00:00Z','charlie','m1','changed'))
        db.execute(work,('charlie','m1','changed',None,'1','2026-10-07T03:00:00Z'))
except sqlite3.IntegrityError:
    pass
assert revisions('charlie')==0
print('Practice storage: all migrations, account isolation, actual text changes, deduplication and rollback passed.')
