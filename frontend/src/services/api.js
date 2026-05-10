import axios from "axios";

// Base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://www.corvo-project.eu/igg-annotation/api";

// Funzioni per le chiamate
export const getLocationList = async () => {
  try {
    const response = await axios.get(API_BASE_URL + "/location-list");
    console.log(response);
    return response.data;
  } catch (error) {
    console.error("Errore nel recuperare la lista delle località:", error);
    return [];
  }
};

export const getGeocode = async (locationId) => {
  try {
    const response = await axios.get(API_BASE_URL + "/geocode/" + locationId);
    return response.data;
  } catch (error) {
    console.error(`Errore nel recuperare il geocode per ${locationId}:`, error);
    return null;
  }
};

export const updateLocationInfo = async (id, locationInfo) => {
  try {
    const response = await axios.put(API_BASE_URL + "/update-info", {
      id,
      location_info: locationInfo,
    });

    return {
      ok: true,
      id: response.data.id,
      updated_info: response.data.updated_info,
    };
  } catch (error) {
    console.error(
      "Errore durante l'aggiornamento dei dati della località",
      error
    );
    return { ok: false, error };
  }
};

export async function compareAndUpdateGroup(id1, id2) {
  try {
    const payload = { id1: id1, id2: id2 };
    const resp = await axios.put(`${API_BASE_URL}/update-group`, payload);

    return resp.data;
  } catch (err) {
    console.error("Errore durante l'aggiornamento del gruppo:", err);
    throw err;
  }
}

export async function removeFromGroup(id) {
  try {
    const resp = await axios.delete(`${API_BASE_URL}/group/${id}`);
    return resp.data;
  } catch (err) {
    console.error("Errore durante la rimozione dell'elemento: " + err);
  }
}
