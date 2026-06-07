<template>
  <div id="sidebar" class="container border-end border-2">
    <div class="row">
      <h1 class="col mt-4 ms-4 mw-35">Località geografiche</h1>
      <hr id="divider" class="mt-3" />
    </div>

    <div
      v-if="addingGroupLocation"
      class="mx-auto alert alert-info text-center mb-2 d-flex flex-column mb-4"
      style="width: 95%"
    >
      Seleziona l’elemento da aggiungere al gruppo di: <br />
      <span class="fw-bold">{{
        addingGroupLocation.name + ", " + addingGroupLocation.type
      }}</span>
      <div @click="undo" class="btn btn-outline-success mt-2">Annulla</div>
    </div>

    <transition name="fade">
      <div
        v-if="showToast"
        class="toast-message me-1"
        :style="{ background: toastColor }"
      >
        {{ toastMessage }}
      </div>
    </transition>

    <div class="input-group d-flex justify-content-center">
      <span
        class="input-group-text col-2 col-sm-2 col-lg-1"
        id="basic-addon1"
        style="height: 3em"
        ><i class="bi bi-search"></i
      ></span>
      <input
        v-model="searchQuery"
        type="search"
        class="input-group-text text-start col-sm-9 col-9 col-lg-10"
        placeholder="Cerca un luogo..."
        style="height: 3em"
        list="data"
      ></input>
    </div>

    <div class="d-flex justify-content-center align-items-center mb-2 mt-2">
      <div
        class="btn-group col-sm-9 col-10 col-lg-11"
        role="group"
        aria-label="Basic example"
      >
        <button
          type="button"
          class="btn btn-outline-primary"
          :class="{ active: activeMarkerFilter === 'simple' }"
          @click = "toggleMarkerFilter('simple')"
        >
          <span class="bi bi-geo-alt-fill"></span>
        </button>
        <button
          type="button"
          class="btn btn-outline-primary"
          :class="{ active: activeMarkerFilter === 'circle' }"
          @click = "toggleMarkerFilter('circle')"
        >
          <span class="bi bi-circle"></span>
        </button>
        <button
          type="button"
          class="btn btn-outline-primary"
          :class="{ active: activeMarkerFilter === 'polygon' }"
          @click = "toggleMarkerFilter('polygon')"
        >
          <span class="bi bi-bounding-box-circles"></span>
        </button>
        <button
          type="button"
          class="btn btn-outline-primary"
          :class="{ active: activeMarkerFilter === 'line' }"
          @click = "toggleMarkerFilter('line')"
        >
          <span class="bi bi-node-plus"></span>
        </button>

        <button
          v-if="activeMarkerFilter !== null"
          type="button"
          class="btn btn-sm btn-outline-danger ms-2"
          style="width: 1em"
          @click="activeMarkerFilter = null"
          title="Rimuovi filtro"
        >
          <span class="bi bi-x-lg"></span>
        </button>
      </div>
    </div>

    <div class="scroll">
      <ul class="list-group ms-3">
        <template v-for="loc in filteredList" :key="loc.id">
          <li
            id="listagroup0"
            class="list-group-item clickable d-flex justify-content-between align-items-center"
            :class="{
              activated: props.activeId === loc.id,
              adding: addingGroupId === loc.id,
            }"
            style="min-height: 3em; min-width: 5em"
            @click="handleClick(loc)"
          >
            <div
              class="row align-items-center g-2 text-truncate"
              style="max-width: 60%; min-width: 100%"
            >
              <div class="col-auto">
                <span
                  class="badge col-1 d-flex justify-content-center me-2 align-items-center"
                  :class="
                    getGroupCount(loc.id) > 0
                      ? 'text-bg-primary'
                      : 'text-bg-secondary'
                  "
                  title="Elementi presenti nel gruppo"
                  style="height: 2.2em; width: 2em"
                  >{{ getGroupCount(loc.id) }}</span
                >
              </div>

              <div
                class="text-truncate col"
                style="width: 100%; cursor: pointer"
                :title="loc.name + ', ' + loc.type"
              >
                {{ loc.name }}, {{ loc.type }}
              </div>

              <div class="col-auto d-flex">
                <i
                  v-if="getMarkerType(loc) === 'simple'"
                  class="bi bi-geo-alt-fill col-auto me-2 d-flex justify-content-center align-items-center"
                  style="border: solid 2px; border-radius: 3px; width: 1.7em"
                  title="Marker semplice presente"
                ></i>
                <i
                  v-else-if="getMarkerType(loc) === 'circle'"
                  class="bi bi-circle col-auto me-2 d-flex justify-content-center align-items-center"
                  style="border: solid 2px; border-radius: 3px; width: 1.7em"
                  title="Raggio presente"
                ></i>
                <i
                  v-else-if="getMarkerType(loc) === 'polygon'"
                  class="bi bi-bounding-box-circles col-auto me-2 d-flex justify-content-center align-items-center"
                  style="border: solid 2px; border-radius: 3px; width: 1.7em"
                  title="Area personalizzata presente"
                ></i>
                <i
                  v-else-if="getMarkerType(loc) === 'line'"
                  class="bi bi-node-plus col-auto me-2 d-flex justify-content-center align-items-center"
                  style="border: solid 2px; border-radius: 3px; width: 1.7em"
                  title="Serie di punti presente"
                ></i>
                <i
                  v-else-if="getMarkerType(loc) === 'ignore'"
                  class="bi bi-x-square col-auto me-2 d-flex justify-content-center align-items-center"
                  style="border: solid 2px; border-radius: 3px; width: 1.7em; color: #ff2400"
                  title="Località da ignorare"
                ></i>
                <span
                  class="badge justify-content-center align-items-center d-flex"
                  style="
                    min-width: 3em;
                    text-align: center;
                    height: 2.2em;
                    background-color: #925cac;
                  "
                  title="Numero di citazioni"
                  >{{ loc.citations }}</span
                >
              </div>

              <div class="col-12 col-lg-auto text-center">
                <button
                  v-if="addingGroupId === null"
                  class="btn btn-sm w-lg-auto w-100 btn-outline-success"
                  style="height: 2em; min-width: 3em"
                  title="Aggiungi un elemento al gruppo"
                  @click.stop="startAddingToGroup(loc)"
                  :class="{ alternate: props.activeId !== 0 }"
                >
                  <i class="bi bi-plus-lg"></i>
                </button>
              </div>
            </div>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import {
  getGeocode,
  compareAndUpdateGroup,
  getLocationList,
} from "../services/api.js";

const selectedGroup = ref([]);
const emit = defineEmits([
  "add-marker",
  "add-group",
  "center-map",
  "select-item",
  "go-default",
  "show-marker",
  "update-active",
]);

const searchQuery = ref("");

const activeMarkerFilter = ref(null);
const toggleMarkerFilter = (type) => {
  activeMarkerFilter.value = activeMarkerFilter.value === type ? null : type;
};

const props = defineProps({
  locations: { type: Array, default: () => [] },
  activeId: Number,
  resetAll: Function,
});

const addingGroupId = ref(null);

function undo() {
  addingGroupId.value = null;
}

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

const getMarkerType = (loc) => {
  return loc?.location_info?.marker?.type ?? null;
};

function buildChildrenByGroup(locations) {
  const groups = new Map();

  for (const loc of locations) {
    if (loc.group === null) continue;

    if (!groups.has(loc.group)) {
      groups.set(loc.group, []);
    }

    groups.get(loc.group).push(loc);
  }

  return groups;
}

const locationsById = computed(() => {
  const locations = new Map();

  for (const loc of props.locations) {
    locations.set(loc.id, loc);
  }

  return locations;
});

const addingGroupLocation = computed(() => {
  if (addingGroupId.value === null) return null;
  return locationsById.value.get(addingGroupId.value);
});

const childrenByGroup = computed(() => buildChildrenByGroup(props.locations));

const groupCounts = computed(() => {
  const counts = new Map();

  for (const [groupId, children] of childrenByGroup.value) {
    counts.set(groupId, children.length);
  }

  return counts;
});

const getGroupCount = (id) => groupCounts.value.get(id) ?? 0;

const filteredList = computed(() => {
  let list = props.locations;
  if (searchQuery.value) {
    list = list.filter((item) =>
      item?.name?.toLowerCase().includes(searchQuery.value.toLowerCase()),
    );
  }

  if (activeMarkerFilter.value) {
    list = list.filter(
      (item) => item?.location_info?.marker?.type === activeMarkerFilter.value,
    );
  }
  return list;
});

const handleClick = (loc) => {
  if (!loc) return;
  emit("select-item", loc);
  emit("update-active", loc.id);
  if (addingGroupId.value === null) {
    showGroup(loc);
    magicClick(loc);
  } else {
    addToGroup(loc);
  }
};

const magicClick = async (location) => {
  if (location.location_info?.marker) {
    emit("select-item", { ...location });
    emit("show-marker", { ...location });
    return;
  }
  try {
    if (location.lat && location.lng) {
      emit("select-item", { ...location });
      emit("show-marker", { ...location });
      return;
    } else {
      const data = await getGeocode(location.id);
      const loc = data.results[0]?.geometry?.location;
      if (!loc?.lat || !loc?.lng) return;

      location.lat = loc.lat;
      location.lng = loc.lng;

      emit("select-item", { ...location });
      emit("show-marker", { ...location });
    }
  } catch (error) {
    console.error("Errore nel recuperare le coordinate:", error);
  }
};

const showGroup = (clickedLoc) => {
  emit("update-active", clickedLoc.id);
  selectedGroup.value = childrenByGroup.value.get(clickedLoc.id) || [];
  emit("add-group", { group: selectedGroup.value, loc: clickedLoc });
};

const startAddingToGroup = (loc) => {
  addingGroupId.value = addingGroupId.value === loc.id ? null : loc.id;
};

async function addToGroup(loc) {
  const parentLoc = locationsById.value.get(addingGroupId.value);
  if (!parentLoc) {
    console.error("Parent location non trovata", addingGroupId.value);
    return;
  }

  try {
    const apiResult = await compareAndUpdateGroup(parentLoc.id, loc.id);

    triggerToast(
      `${loc.name}, ${loc.type} aggiunto a: ${parentLoc.name}, ${parentLoc.type}`,
      "#099985",
    );

    const showUpdated = await getLocationList();
    emit("show-updated", showUpdated);
    const updatedChildren =
      buildChildrenByGroup(showUpdated).get(parentLoc.id) || [];
    const updatedParentLoc =
      showUpdated.find((l) => l.id === parentLoc.id) || parentLoc;
    emit("add-group", { group: updatedChildren, loc: updatedParentLoc });
    addingGroupId.value = null;

    console.log("API update-group risultato:", apiResult);
    props.resetAll();
  } catch (err) {
    console.error("Errore nell’API update-group:", err);
    alert("Errore durante il salvataggio del gruppo. Riprova.");
  }
}
</script>

<style scoped>
#sidebar {
  top: 0;
  left: 0;
  width: 30vw;
  height: 100vh;
  position: fixed;
  display: flex;
  flex-direction: column;
}

#divider {
  border-width: 3px;
  margin: 30px auto;
  width: 90%;
}

.scroll {
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  margin: auto;
}

#listagroup0 {
  transition: background-color 0.2s ease;
}

#listagroup0.clickable:hover {
  background-color: #9be8ff;
  cursor: pointer;
  color: black;
}

.adding {
  background-color: #c2f0c2;
  border: 2px solid #2ca02c;
}

.alternate {
  background-color: white;
}

.activated {
  background-color: #56d6fd;
}

.toast-message {
  width: 90%;
  position: absolute;
  bottom: 20px;
  right: 20px;
  color: white;
  padding: 0.8em 1.2em;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  z-index: 9999;
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
