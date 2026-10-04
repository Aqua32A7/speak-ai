import sys
from pathlib import Path

# Ensure backend root is on sys.path so 'from models.schemas import ...' works seamlessly
backend_root = Path(__file__).resolve().parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))
