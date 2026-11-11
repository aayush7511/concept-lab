"""Provision course dependencies/assets; never run during an exercise."""
from pathlib import Path
import os
import subprocess
import sys
import venv
root = Path(__file__).resolve().parents[1]
env = root / '.local' / 'llm-venv'
venv.EnvBuilder(with_pip=True).create(env)
python = env / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
subprocess.run([str(python), '-m', 'pip', 'install', '-r', str(root/'courses/llm/requirements.txt')], check=True)
assets = root / '.local' / 'llm-assets'
assets.mkdir(exist_ok=True)
subprocess.run([str(python), '-c', 'import tiktoken; tiktoken.get_encoding("gpt2"); print("GPT-2 tokenizer cached.")'], env={**os.environ, 'TIKTOKEN_CACHE_DIR': str(assets)}, check=True)
print('Ready. Run npm start, then choose LLMs From Scratch.')
