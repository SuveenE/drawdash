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

Make sure to add your Fal AI API key to the `.env` file:

```bash
FAL_KEY=your_fal_ai_api_key_here
```

You can obtain a Fal AI API key from [fal.ai](https://fal.ai/)

## Quick Start

To spin up the server, run the following command at the `server` directory:

```bash
# For local development, and if hosting service allows us to manually create the .env file
poetry run uvicorn app.api.main:app --reload --host 0.0.0.0 --port 8080 --env-file .env
```

## API Endpoints

### 3D Icon Generation

Generate a 3D icon using Fal AI based on a text prompt:

**POST** `/projects/generate-icon`

**Request Body:**
```json
{
  "prompt": "A modern cloud computing icon",
  "style": "3D render, isometric, clean background"
}
```

**Response:**
```json
{
  "image_url": "https://...",
  "image_data": null
}
```

This endpoint uses Fal AI's FLUX Pro model to generate high-quality 3D-style icons. The default style is "3D render, isometric, clean background", but you can customize it by providing your own style string.

## Debugging Tips

1. If your VSCode is not able to recognise the libraries which you have installed, do the following

```bash
poetry env info 
### Copy the value for Virtualenv Executable ###
### Open the command palette and click the Python: Select Interpreter command ###
### Paste the value and press enter. If VSCode prompts you to "Creates a `.venv` virtual environment in the current directory", exit the menu and restart VSCode/your computer. Repeat the steps above until ur library gets recognised. ###

