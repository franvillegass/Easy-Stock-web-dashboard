import uuid, os
_id_file = "entity_id.txt"
if not os.path.exists(_id_file):
    open(_id_file, 'w').write(str(uuid.uuid4())[:8].upper())
ENTITY_ID = open(_id_file).read().strip()