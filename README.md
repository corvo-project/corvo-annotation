# CorVo Annotation Interface

CorVo is a transdisciplinary project that combines volcanology and computational linguistics to extract, validate, and structure volcanological knowledge from historical documents about Mount Vesuvius. The project works with a multilingual diachronic corpus of digitized sources and NLP pipelines for OCR correction, geographic entity extraction, human validation, and geospatial analysis. More information is available on the [CorVo project website](https://www.corvo-project.eu/).

## Goals of the Interface

This repository contains the geographic annotation interface described in the CorVo paper. The interface supports human-in-the-loop validation of automatically extracted geographic entities, including both standard toponyms and fine-grained volcanological spatial entities.

The main goals are to:

- review the list of extracted geographic entities and their citation counts;
- merge mentions that refer to the same place, such as spelling variants or synonymous historical references;
- georeference each entity through an interactive map;
- use Google Maps geocoding suggestions when available;
- manually assign spatial information as a point, circular area, polygon, or polyline;
- store validated geospatial annotations for later analysis and diachronic geovisualization.

## Repository Structure

```text
backend/   FastAPI backend, SQLite database models, and API routes
frontend/  Vue 3 + Vite frontend with Leaflet map annotation tools
```

## Backend Setup

The backend is a FastAPI application backed by SQLAlchemy. For local development, the simplest setup uses SQLite.

```sh
cd backend
python3 -m venv env
source env/bin/activate
pip install -r requirements.txt
cp .env-example .env
```

Edit `backend/.env` and set the required values. A local SQLite configuration can use:

```env
DATABASE_URL=sqlite:///./locations.db
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

`DATABASE_URL` is required. `GOOGLE_MAPS_API_KEY` is required for automatic geocoding, but manual map annotation can still be used without it.

Run the backend from the `backend/` directory:

```sh
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at `http://127.0.0.1:8000`, and the interactive API documentation at `http://127.0.0.1:8000/docs`.

## Loading Data

The backend exposes endpoints for loading and updating annotation data:

- `POST /load-data`: upload an Excel file (`.xlsx` or `.xls`) with the columns `name`, `type`, and `value`; `value` is stored as the citation count.
- `POST /load-groups`: upload a `.txt` file describing pre-existing groups of equivalent locations.
- `GET /location-list`: retrieve locations for the frontend.
- `GET /geocode/{id}`: retrieve or cache Google Maps geocoding suggestions.
- `PUT /update-info`: save geospatial annotation data.
- `PUT /update-group` and `DELETE /group/{id}`: manage merged location groups.

## Frontend Setup

The frontend is a Vue 3 application built with Vite and Leaflet.

```sh
cd frontend
npm install
VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173/igg-annotation/`. If `VITE_API_BASE_URL` is not set, the frontend uses the deployed CorVo API at `https://www.corvo-project.eu/igg-annotation/api`.

For a production build:

```sh
cd frontend
npm run build
```

## Using the Interface

Start the backend first, then start the frontend. The left sidebar lists the extracted geographic entities, with citation counts and indicators for existing annotations. Use the search box to find an entity, then select it to display its group information and map controls.

After selecting an entity, choose one of the map annotation modes:

- point marker for a discrete location;
- circle for an approximate area;
- polygon for a custom area;
- polyline for a linear feature;
- automatic positioning through Google Maps geocoding;
- coordinate search to navigate directly to a latitude and longitude.

Annotations are saved to the backend as `location_info`. To merge equivalent entities, click the add-to-group button for the target location, then select the entity that should be added to that group. Group membership and total citation counts are updated through the backend API.

## Citation

If you use this system in your work, please cite our paper, [Extracting Volcanological Knowledge from Historical Texts: A Language-Technology Pipeline for Diachronic Geovisualization](LT4HALA_2026_CorVo.pdf), presented at [LT4HALA](https://circse.github.io/LT4HALA/2026/Program).

```bibtex
@inproceedings{marini2026extracting,
  title = {Extracting Volcanological Knowledge from Historical Texts: A Language-Technology Pipeline for Diachronic Geovisualization},
  author = {Marini, Costanza and Casagrande, Gianluca and Palmero Aprosio, Alessio and Principe, Claudia},
  booktitle = {Proceedings of the Fourth Workshop on Language Technologies for Historical and Ancient Languages (LT4HALA 2026)},
  year = {2026}
}
```
