# Backend

## Set up Poetry

Please follow the official [installation guide](https://python-poetry.org/docs/#installation) to install Poetry, which will be used to manage dependencies and environments.

```bash
# Install dependencies
poetry install
```

```bash
# Activate Python Virtual Environment for Mac/Linux
eval "$(poetry env activate)"

# Activate Python Virtual Environment for Windows
.venv\Scripts\Activate.ps1
```

## Set up environment variables

```bash
# Create .env file (by copying from .env.example)
cp .env.example .env
```

## Quick Start

To spin up the server, run the following command at the `server` directory:

```bash
# For local development, and if hosting service allows us to manually create the .env file
poetry run uvicorn app.api.main:app --reload --host 0.0.0.0 --port 8080 --env-file .env
```

## Debugging Tips

1. If your VSCode is not able to recognise the libraries which you have installed, do the following

```bash
poetry env info 
### Copy the value for Virtualenv Executable ###
### Open the command palette and click the Python: Select Interpreter command ###
### Paste the value and press enter. If VSCode prompts you to "Creates a `.venv` virtual environment in the current directory", exit the menu and restart VSCode/your computer. Repeat the steps above until ur library gets recognised. ###

