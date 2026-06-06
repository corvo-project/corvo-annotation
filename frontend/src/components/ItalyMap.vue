<template>
  <div id="map-container">
    <div id="map" class="border-top border-2"></div>

    <div
      v-if="showButtons"
      id="marker-buttons"
      class="btn-group shadow p-2"
      role="group"
      aria-label="Selezione tra i diversi tipi di marker"
      style="border-radius: 8px"
    >
      <button
        @click="cancel"
        type="button"
        title="Elimina"
        class="btn btn-outline-danger markertype rounded-start"
        :disabled="!hasMarkerForSelected"
      >
        <i class="bi bi-trash3-fill h3"></i>
      </button>

      <button
        @click="ignore"
        type="button"
        title="Località da ignorare"
        class="btn btn-outline-danger markertype me-3 rounded-end"
        :disabled="!hasMarkerForSelected"
      >
        <i class="bi bi-x-square h3"></i>
      </button>

      <button
        @click="activateSimpleMarker"
        type="button"
        class="btn btn-outline-primary markertype rounded-start"
        title="Segnalino semplice"
        :class="{ active: simpleIsActive }"
      >
        <i class="bi bi-geo-alt-fill h3"></i>
      </button>

      <button
        @click="activateCircleMarker"
        type="button"
        title="Raggio"
        class="btn btn-outline-primary markertype"
        :class="{ active: circleIsActive }"
      >
        <i class="bi bi-circle h3"></i>
      </button>

      <button
        @click="activateShapeMarker"
        type="button"
        title="Area personalizzata"
        class="btn btn-outline-primary markertype"
        :class="{ active: shapeIsActive }"
      >
        <i class="bi bi-bounding-box-circles h3"></i>
      </button>

      <button
        @click="activateLineMarker"
        type="button"
        title="Serie di punti"
        class="btn btn-outline-primary markertype rounded-end"
        :class="{ active: lineIsActive }"
      >
        <i class="bi bi-node-plus-fill h3"></i>
      </button>
      <button
        @click="showInputCoordinates"
        type="button"
        title="Ricerca per coordinate"
        class="btn btn-outline-success markertype ms-3 rounded-start"
      >
        <i class="bi bi-globe-americas h4"></i>
      </button>
      <button
        @click="magic"
        type="button"
        title="Posizionamento automatico"
        class="btn btn-outline-success markertype"
      >
        <i class="bi bi-magic h3"></i>
      </button>
    </div>

    <transition name="fade">
      <div
        v-if="showToast"
        class="toast-message me-1 text-center"
        :style="{ background: toastColor }"
      >
        {{ toastMessage }}
      </div>
    </transition>

    <div
      v-if="props.inputCoord"
      class="d-flex gap-3 mt-2 p-2 shadow"
      style="
        position: absolute;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        background: #cfe2ff;
        border-radius: 8px;
      "
    >
      <input
        @keydown.enter="enterCoordinates()"
        v-model="lat"
        type="number"
        step="0.1"
        placeholder="Latitudine"
        class="form-control no-arrows"
        style="max-width: 8em"
      />
      <input
        @keydown.enter="enterCoordinates()"
        v-model="lng"
        type="number"
        step=""
        placeholder="Longitudine"
        class="form-control no-arrows"
        style="max-width: 8em"
      />
      <button @click="enterCoordinates()" class="btn btn-primary">Cerca</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import L from "leaflet";
import "leaflet-editable";
import { getGeocode, updateLocationInfo } from "@/services/api";

const map = ref(null);
const activeMarkerType = ref(null);
const simpleIsActive = ref(false);
const markers = ref([]);
const circleIsActive = ref(false);
const shapeIsActive = ref(false);
const lineIsActive = ref(false);
const ignoreIsActive = ref(false);
let currentDrawingLayer = null;
const lat = ref(null);
const lng = ref(null);

const MARKER_TYPE = {
  simple: "simple",
  circle: "circle",
  polygon: "polygon",
  line: "line",
};

const props = defineProps({
  showButtons: Boolean,
  selectedItem: Object,
  selectedMarkerLoc: Object,
  locations: { type: Array, default: () => [] },
  inputCoord: Boolean,
});

const emit = defineEmits(["location-updated", "coordinates-switch"]);

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL(
    "leaflet/dist/images/marker-icon-2x.png",
    import.meta.url,
  ).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url)
    .href,
});

function generateId() {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

function resetMarkerButtons() {
  simpleIsActive.value = false;
  circleIsActive.value = false;
  shapeIsActive.value = false;
  activeMarkerType.value = null;

  if (currentDrawingLayer) {
    try {
      map.value.removeLayer(currentDrawingLayer);
    } catch (e) {}
    currentDrawingLayer = null;
  }
  if (map.value && map.value.getContainer) {
    map.value.getContainer().classList.remove("map-add-marker");
  }
}

async function saveMarkerForLocation(marker) {
  const loc =
    props.locations.find((l) => l.id === marker.locationId) ||
    props.selectedItem;
  if (!loc) return;

  const newInfo = {
    ...(loc.location_info || {}),
    marker: {
      id: marker.id,
      type: marker.type,
      lat: marker.lat ?? null,
      lng: marker.lng ?? null,
      radius: marker.radius ?? null,
      coordinates: marker.coordinates ?? null,
    },
  };

  try {
    const res = await updateLocationInfo(marker.locationId, newInfo);
    if (!res || res.ok === false) {
      console.error("Errore salvataggio marker sul server", res);
      return;
    }
    loc.location_info = newInfo;
    emit("location-updated", {
      id: marker.locationId,
      location_info: newInfo,
    });
    console.log("marker salvato per location", marker.locationId);
  } catch (err) {
    console.error("Errore in saveMarkerForLocation:", err);
  }
}

async function cancel() {
  const loc = props.selectedItem;
  if (!loc) return;

  const entry = markers.value.find((m) => m.locationId === loc.id);

  if (entry) {
    try {
      map.value.removeLayer(entry.marker);
    } catch (e) {
      console.error(e);
    }
    markers.value = markers.value.filter((m) => m.id !== entry.id);
  }

  if (!entry && !loc.location_info?.marker) {
    alert("Nessun marker associato a questa località");
    return;
  }

  const newInfo = { ...(loc.location_info || {}) };
  delete newInfo.marker;

  try {
    const res = await updateLocationInfo(loc.id, newInfo);
    if (!res || res.ok === false) {
      throw new Error("Errore nella rimozione del marker");
    }
    loc.location_info = newInfo;
    emit("location-updated", {
      id: loc.id,
      location_info: newInfo,
    });
    console.log("marker rimosso con successo");
  } catch (e) {
    console.error("errore nella rimozione del marker: ", e);
  }

  activeMarkerType.value = null;
  simpleIsActive.value = false;
  circleIsActive.value = false;
  shapeIsActive.value = false;

  if (map.value) {
    map.value.getContainer().classList.remove("map-add-marker");
  }
}

function hasMarkerForSelected() {
  const id = props.selectedItem?.id;
  if (!id) return false;
  const fromProps = !!props.selectedItem?.location_info?.marker;
  const fromLocal = markers.value.some((m) => m.locationId === id);
  return fromProps || fromLocal;
}

function showInputCoordinates() {
  lat.value = null;
  lng.value = null;
  emit("coordinates-switch", !props.inputCoord);
}

function enterCoordinates() {
  if (!lat.value || !lng.value) {
    alert("Inserisci sia latitudine che longitudine");
    return;
  }

  const latitude = parseFloat(lat.value);
  const longitude = parseFloat(lng.value);

  if (isNaN(latitude) || isNaN(longitude)) {
    alert("Coordinate non valide");
    return;
  }

  if (map.value) {
    map.value.setView([latitude, longitude], 15);
  }
}

async function addMarker(
  lat,
  lng,
  name,
  markerType = MARKER_TYPE.simple,
  id = null,
  locationId = null,
) {
  const realId = id || generateId();
  locationId =
    locationId || (props.selectedItem ? props.selectedItem.id : null);

  const existing = markers.value.find((m) => m.locationId === locationId);
  if (existing) {
    try {
      map.value.removeLayer(existing.marker);
    } catch (e) {}
    markers.value = markers.value.filter((m) => m.id !== existing.id);
  }

  const marker = L.marker([lat, lng], { draggable: true }).addTo(map.value);

  const markerData = {
    id: realId,
    marker,
    lat,
    lng,
    name,
    type: markerType,
    shape: "geo",
    locationId,
  };

  markers.value.push(markerData);

  marker.on("dragend", async (e) => {
    const pos = e.target.getLatLng();
    markerData.lat = pos.lat;
    markerData.lng = pos.lng;
    await saveMarkerForLocation(markerData);
  });

  const newInfo = {
    ...(props.selectedItem.location_info || {}),
    marker: {
      id: realId,
      type: markerType,
      lat,
      lng,
      radius: null,
      coordinates: null,
    },
  };

  try {
    const res = await updateLocationInfo(locationId, newInfo);
    if (!res || res.ok === false) {
      console.error("Errore salvataggio marker sul server", res);
      return;
    }
    props.selectedItem.location_info = newInfo;
    emit("location-updated", {
      id: locationId,
      location_info: newInfo,
    });
  } catch (err) {
    console.error("Errore in saveMarkerForLocation:", err);
  }
}

const addCircle = async (
  lat,
  lng,
  name,
  markerType = MARKER_TYPE.circle,
  id = null,
  radius = 2000,
  locationId = null,
) => {
  const realId = id || generateId();
  locationId =
    locationId || (props.selectedItem ? props.selectedItem.id : null);

  const existing = markers.value.find((m) => m.locationId === locationId);
  if (existing) {
    try {
      map.value.removeLayer(existing.marker);
    } catch (e) {}
    markers.value = markers.value.filter((m) => m.id !== existing.id);
  }

  const numericRadius =
    typeof radius === "number" ? radius : parseFloat(radius) || 2000;

  const circle = L.circle([lat, lng], {
    radius: numericRadius,
    color: "blue",
    fillColor: "lightblue",
    fillOpacity: 0.3,
  }).addTo(map.value);

  if (typeof circle.enableEdit === "function") {
    circle.enableEdit();
  } else {
    console.warn(
      "circle.enableEdit() non è disponibile — controlla leaflet-editable",
    );
  }

  const markerData = {
    id: realId,
    marker: circle,
    lat,
    lng,
    name,
    type: markerType,
    shape: "circle",
    radius: numericRadius,
    locationId,
  };

  markers.value.push(markerData);

  async function saveCircle() {
    const center = circle.getLatLng();
    markerData.lat = center.lat;
    markerData.lng = center.lng;
    markerData.radius = circle.getRadius();
    await saveMarkerForLocation(markerData);
  }

  circle.on("editable:dragend", saveCircle);
  circle.on("editable:vertex:dragend", saveCircle);
  circle.on("editable:commit", saveCircle);

  if (!id) {
    await saveMarkerForLocation(markerData);
  }

  return markerData;
};

const ignore = async () => {
  if (hasMarkerForSelected()) {
    alert("Questa località ha già un marker. Eliminalo prima di proseguire");
    return;
  }

  cancelCurrentDrawing();

  ignoreIsActive.value = true;
  activeMarkerType.value = "ignore";

  const newInfo = {
    ...(props.selectedItem.location_info || {}),
    marker: {
      id: null,
      type: "ignore",
      lat: null,
      lng: null,
      radius: null,
      coordinates: null,
    },
  };
  try {
    const res = await updateLocationInfo(props.selectedItem.id, newInfo);
    if (!res || res.ok === false) {
      console.error("Errore salvataggio stato 'ignore' sul server", res);
      return;
    }
    props.selectedItem.location_info = newInfo;
    emit("location-updated", {
      id: props.selectedItem.id,
      location_info: newInfo,
    });
  } catch (error) {
    console.error("Errore durante il salvataggio dello stato 'ignore':", error);
  }
};

const activateSimpleMarker = () => {
  if (hasMarkerForSelected()) {
    alert(
      "Questa località ha già un marker. Eliminalo prima di crearne uno nuovo",
    );
    return;
  }

  if (simpleIsActive.value) {
    resetMarkerButtons();
    return;
  }

  cancelCurrentDrawing();
  resetMarkerButtons();

  simpleIsActive.value = true;
  activeMarkerType.value = "geo";
  map.value.getContainer().classList.add("map-add-marker");
};

const activateCircleMarker = () => {
  if (hasMarkerForSelected()) {
    alert(
      "Questa località ha già un marker. Eliminalo prima di crearne uno nuovo",
    );
    return;
  }

  if (circleIsActive.value) {
    resetMarkerButtons();
    return;
  }

  cancelCurrentDrawing();
  resetMarkerButtons();

  circleIsActive.value = true;
  activeMarkerType.value = "circle";
  map.value.getContainer().classList.add("map-add-marker");
};

const activateShapeMarker = () => {
  if (hasMarkerForSelected()) {
    alert(
      "Questa località ha già un marker. Eliminalo prima di crearne uno nuovo",
    );
    return;
  }

  if (shapeIsActive.value) {
    cancelCurrentPolygon = true;
    if (currentDrawingLayer) {
      try {
        map.value.editTools?.stopDrawing();
        map.value.removeLayer(currentDrawingLayer);
      } catch (e) {
        console.warn("Errore nel rimuovere il layer corrente:", e);
      }
      currentDrawingLayer = null;
    }

    shapeIsActive.value = false;
    activeMarkerType.value = null;
    map.value.getContainer().classList.remove("map-add-marker");
    return;
  }

  cancelCurrentDrawing();
  resetMarkerButtons();
  shapeIsActive.value = true;
  activeMarkerType.value = "polygon";
  map.value.getContainer().classList.add("map-add-marker");

  currentDrawingLayer =
    map.value.editTools && map.value.editTools.startPolygon
      ? map.value.editTools.startPolygon()
      : null;
};

function saveShapeMarker(type, coordinates, layer) {
  const id = generateId();

  markers.value.push({
    id,
    marker: layer,
    shape: type,
    coordinates,
    locationId: props.selectedItem.id,
  });

  saveMarkerForLocation({
    id,
    type,
    lat: null,
    lng: null,
    radius: null,
    coordinates,
    locationId: props.selectedItem.id,
  });

  layer.on("editable:vertex:dragend", () => {
    const updated = layer.getLatLngs().map((p) => [p.lat, p.lng]);

    saveMarkerForLocation({
      id,
      type,
      lat: null,
      lng: null,
      radius: null,
      coordinates: updated,
      locationId: props.selectedItem.id,
    });
  });

  currentDrawingLayer = null;

  resetMarkerButtons();
  currentDrawingLayer = null;
  activeMarkerType.value = null;
  lineIsActive.value = false;
  shapeIsActive.value = false;
  map.value.getContainer().classList.remove("map-add-marker");
}

const activateLineMarker = () => {
  if (hasMarkerForSelected()) {
    alert("Questa località ha già un marker");
    return;
  }

  if (lineIsActive.value) {
    cancelCurrentDrawing();
    resetMarkerButtons();
    return;
  }

  cancelCurrentDrawing();
  resetMarkerButtons();

  lineIsActive.value = true;
  activeMarkerType.value = "line";
  map.value.getContainer().classList.add("map-add-marker");

  currentDrawingLayer = map.value.editTools?.startPolyline?.() || null;
};

const toastMessage = ref("");
const showToast = ref(false);
const toastColor = ref("");

function triggerToast(msg, color) {
  toastMessage.value = msg;
  toastColor.value = color;
  showToast.value = true;

  setTimeout(() => {
    showToast.value = false;
  }, 2800);
}

const magic = async () => {
  if (hasMarkerForSelected()) {
    alert(
      "Questa località ha già un marker. Eliminalo prima di crearne uno nuovo",
    );
    return;
  }

  try {
    cancelCurrentDrawing();

    const data = await getGeocode(props.selectedItem.id);
    if (!data || !data.results?.length) {
      triggerToast("Impossibile posizionare il marker", "#D94C4F");
      return;
    }

    const loc = data.results[0].geometry.location;
    const lat = typeof loc.lat === "function" ? loc.lat() : loc.lat;
    const lng = typeof loc.lng === "function" ? loc.lng() : loc.lng;

    if (lat == null || lng == null) {
      alert("Coordinate non trovate nel risultato del geocode");
      return;
    }

    const canProceed = checkDistance(lat, lng);
    if (!canProceed) return;

    map.value.setView([lat, lng], 13);

    const existing = markers.value.find(
      (m) => m.locationId === props.selectedItem.id,
    );
    if (existing) {
      try {
        map.value.removeLayer(existing.marker);
      } catch (e) {}
      markers.value = markers.value.filter((m) => m.id !== existing.id);
    }

    await addMarker(lat, lng, props.selectedItem.name, MARKER_TYPE.simple);

    resetMarkerButtons();
    currentDrawingLayer = null;

    console.log(
      "Magic: marker posizionato automaticamente e modalità resettate.",
    );
  } catch (err) {
    console.error("Errore nel creare il marker automatico (magic):", err);
  }
};

const coordVesuvio = L.latLng(40.821306, 14.42939);
const maxDistance = 100000;

function checkDistance(markerLat, markerLng) {
  const point = L.latLng(markerLat, markerLng);
  const distance = point.distanceTo(coordVesuvio);

  if (distance > maxDistance) {
    return confirm(
      "Il punto selezionato si trova a più di 100km dal Vesuvio, procedere?",
    );
  }
  return true;
}

function cancelCurrentDrawing() {
  if (currentDrawingLayer) {
    try {
      map.value.editTools?.stopDrawing();
      map.value.removeLayer(currentDrawingLayer);
    } catch (e) {
      console.warn("Errore nel fermare il disegno corrente:", e);
    }
    currentDrawingLayer = null;

    lineIsActive.value = false;
    shapeIsActive.value = false;
    activeMarkerType.value = null;
    map.value?.getContainer()?.classList.remove("map-add-marker");
  }
}

function onMapClick(e) {
  if (!activeMarkerType.value || !props.selectedItem) return;

  if (activeMarkerType.value === "geo") {
    addMarker(
      e.latlng.lat,
      e.latlng.lng,
      props.selectedItem.name,
      MARKER_TYPE.simple,
    );
    activeMarkerType.value = null;
    resetMarkerButtons();
    simpleIsActive.value = false;
    map.value.getContainer().classList.remove("map-add-marker");
    return;
  }

  if (activeMarkerType.value === "circle") {
    addCircle(
      e.latlng.lat,
      e.latlng.lng,
      props.selectedItem.name,
      MARKER_TYPE.circle,
    );
    activeMarkerType.value = null;
    resetMarkerButtons();
    circleIsActive.value = false;
    map.value.getContainer().classList.remove("map-add-marker");
    return;
  }
}

function hideAllMarkers() {
  markers.value.forEach((m) => {
    try {
      if (m.marker && map.value.hasLayer(m.marker)) {
        map.value.removeLayer(m.marker);
      }
    } catch (e) {
      console.error("Errore, marker ancora visibili: ");
    }
  });
  markers.value = [];
}

function showSingleMarker(loc) {
  hideAllMarkers();
  if (!loc) return;

  const info = loc.location_info?.marker;
  let existing = markers.value.find((m) => m.locationId === loc.id);

  if (info) {
    if (!existing) {
      if (info.type === "simple" && info.lat && info.lng) {
        addMarker(info.lat, info.lng, loc.name, info.type, info.id, loc.id);
      } else if (info.type === "circle" && info.lat && info.lng) {
        addCircle(
          info.lat,
          info.lng,
          loc.name,
          info.type,
          info.id,
          info.radius,
          loc.id,
        );
      } else if (info.type === "polygon" && info.coordinates) {
        const polygon = L.polygon(info.coordinates, {
          color: "blue",
          weight: 2,
          fillColor: "lightblue",
          fillOpacity: 0.3,
        }).addTo(map.value);

        markers.value.push({
          id: info.id,
          marker: polygon,
          shape: "polygon",
          locationId: loc.id,
        });
      } else if (info.type === "line" && info.coordinates) {
        const line = L.polyline(info.coordinates, {
          color: "blue",
          weight: 2,
          fillColor: "lightblue",
          fillOpacity: 0.3,
        }).addTo(map.value);

        markers.value.push({
          id: info.id,
          marker: line,
          shape: "line",
          locationId: loc.id,
        });
      }
      existing = markers.value.find((m) => m.locationId === loc.id);
    }

    if (existing) {
      if (
        existing.shape === "polygon" ||
        existing.shape === "circle" ||
        existing.shape === "line"
      ) {
        map.value.fitBounds(existing.marker.getBounds());
      } else if (existing.lat && existing.lng) {
        map.value.setView([existing.lat, existing.lng], 13);
      }
    }
  } else if (loc.lat && loc.lng) {
    map.value.setView([loc.lat, loc.lng], 13);
  }
}

watch(
  () => props.selectedMarkerLoc,
  (loc) => {
    if (!loc) {
      hideAllMarkers();
      return;
    }

    showSingleMarker(loc);
  },
);

onMounted(() => {
  if (!map.value) {
    map.value = L.map("map", { editable: true }).setView(
      [40.8214, 14.4265],
      10,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map.value);

    map.value.on("click", onMapClick);
    map.value.on("editable:drawing:commit", (e) => {
      const layer = e.layer;
      if (!layer || !props.selectedItem) return;

      const latlngs = layer.getLatLngs().map((p) => [p.lat, p.lng]);

      if (layer instanceof L.Polygon) {
        const latlngs = layer.getLatLngs()[0].map((p) => [p.lat, p.lng]);
        if (latlngs.length < 3) {
          return;
        }

        saveShapeMarker("polygon", latlngs, layer);
        return;
      }

      if (layer instanceof L.Polyline) {
        const latlngs = layer.getLatLngs().map((p) => [p.lat, p.lng]);
        if (latlngs.length < 2) {
          return;
        }

        saveShapeMarker("line", latlngs, layer);
        return;
      }
    });
  } else {
    console.log("Mappa già inizializzata");
  }
});

defineExpose({ map, hideAllMarkers });
</script>

<style scoped>
#map-container {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 70vw;
  height: 60vh;
  z-index: 500;
  background: white;
}

#map {
  width: 100%;
  height: 100%;
  z-index: 1;
}

#marker-buttons {
  position: absolute;
  top: 20px;
  left: 50%;
  z-index: 1000;
  background-color: white;
  border-radius: 8px;
  padding: 5px;
  transform: translateX(-50%);
}

.markertype {
  min-height: 60px;
  width: 80px;
}

.map-add-marker {
  cursor: crosshair;
}

.no-arrows::-webkit-outer-spin-button,
.no-arrows::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.toast-message {
  width: 40%;
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  padding: 0.8em 1.2em;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
