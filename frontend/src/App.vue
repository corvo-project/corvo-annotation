<template>
  <Maps
    ref="mapsRef"
    :show-buttons="showButtons"
    :selected-item="selectedItem"
    :locations="locations"
    @location-updated="handleLocationUpdated"
    :selectedMarkerLoc="selectedMarkerLoc"
    @coordinates-switch="handleCoordinates"
    :inputCoord="inputCoord"
  />
  <Sidebar
    :locations="locations"
    :active-id="currentActiveId"
    :reset-all="resetAll"
    @center-map="centerMap"
    @add-group="addGroup"
    @show-updated="locations = $event"
    @show-marker="handleShowMarker"
    @select-item="handleSelectItem"
    @update-active="currentActiveId = $event"
  />
  <GroupsList
    :group="selectedGroup"
    :loc="clickedLoc"
    :show-group="addGroup"
    :all-locations="locations"
    @remove-item="onRemoveItem"
    @go-default="resetAll"
  />
</template>

<script setup>
import Maps from "./components/ItalyMap.vue";
import Sidebar from "./components/ElementList.vue";
import GroupsList from "./components/GroupsList.vue";

import { ref, onMounted } from "vue";
import { getLocationList } from "./services/api";

const mapsRef = ref(null);
const centerMap = ({ lat, lng, query }) => {
  const map = mapsRef.value.map; //per raggiungere il componente mappa
  map.setView([lat, lng], 12);
};

const selectedGroup = ref([]);
const clickedLoc = ref(null);
const locations = ref([]);
const showButtons = ref(false);
const selectedItem = ref(null);
const selectedMarkerLoc = ref(null);
const currentActiveId = ref(null);
const inputCoord = ref(false);

const addGroup = ({ group, loc }) => {
  selectedGroup.value = group;
  clickedLoc.value = loc;
};

function handleCoordinates(val) {
  inputCoord.value = val;
}

function resetAll(id) {
  selectedGroup.value = [];
  clickedLoc.value = null;
  showButtons.value = false;
  currentActiveId.value = null;
  inputCoord.value = false;

  if (mapsRef.value?.hideAllMarkers) {
    mapsRef.value.hideAllMarkers();
  }

  if (mapsRef.value?.map) {
    mapsRef.value?.map?.setView([40.8214, 14.4265], 10);
  }
}

function handleShowMarker(loc) {
  selectedMarkerLoc.value = loc;
  selectedItem.value = loc;
}

async function onRemoveItem(id) {
  const removed = locations.value.find((l) => l.id === id);
  if (!removed) return;

  const updated = await getLocationList();
  locations.value = updated;

  removed.group = null;
  if (clickedLoc.value) {
    selectedGroup.value.splice(
      0,
      selectedGroup.value.length,
      ...locations.value.filter((l) => l.group === clickedLoc.value.id),
    );
  }
}

function handleSelectItem(loc) {
  if (mapsRef.value?.hideAllMarkers) {
    mapsRef.value.hideAllMarkers();
  }
  selectedItem.value = loc;
  showButtons.value = true;
  inputCoord.value = false;
}

//si poteva scrivere anche locations.value[locIndex].location_info = updatedInfo;
//tuttavia, Vue rileva meglio i cambiamenti quando si assegna un nuovo oggetto, rispetto a quando si modifica quello esistente
const handleLocationUpdated = ({ id, location_info }) => {
  const locIndex = locations.value.findIndex((loc) => loc.id === id);
  if (locIndex !== -1) {
    locations.value[locIndex] = {
      ...locations.value[locIndex],
      location_info: {
        ...location_info,
      },
    };
  }

  if (selectedItem.value?.id === id) {
    selectedItem.value = {
      ...selectedItem.value,
      location_info: {
        ...location_info,
      },
    };
  }
};

onMounted(async () => {
  locations.value = await getLocationList();
});
</script>

<style></style>
