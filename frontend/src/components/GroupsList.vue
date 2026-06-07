<template>
  <div id="grouplist" class="container d-flex align-items-center justify-content-center">
    <div
      class="bg-white text-center d-flex align-items-center justify-content-center p-2 shadow-sm ms-4 me-3 position-relative"
      style="min-height: 32vh; width: 30%; border-radius: 8px">
      <button v-if="group.length || loc" @click="backToDefault()"
        class="btn bg-warning d-flex align-items-center justify-content-center position-absolute fw-bolder me-3 mt-3 pb-1"
        title="Annulla selezione" style="height: 2.3em; width: 2.3em; top: 0; right: 0">
        <i class="bi bi-house-fill h5 mt-1"></i>
      </button>
      <div>
        <h2 class="fw-bold">
          {{ loc ? `${loc.name}` : "Nessun luogo selezionato" }}
        </h2>
        <p v-if="loc">
          {{ replaceComma(loc.type) }}
        </p>
      </div>
      <button v-if="group.length && loc" @click="handleRemove(loc.id)"
        class="btn bg-danger d-flex align-items-center justify-content-center position-absolute fw-bolder mb-2" style="
          height: 2em;
          width: 80%;
          bottom: 15px;
          margin-bottom: 5px;
          color: white;
        ">
        Elimina
      </button>
    </div>

    <div v-if="group.length && loc" class="d-flex flex-row align-items-stretch w-100" style="max-width: 80%">
      <ul class="list-group flex-column scroll mb-0" style="height: 32vh; flex-grow: 1">
        <li v-for="item in group" :key="item.id"
          class="px-3 d-flex align-items-center list-group-item justify-content-between m-1 shadow-sm"
          style="border-radius: 8px; height: auto">
          <i v-if="showSubGroup(item)" class="bi bi-caret-right-fill"></i>
          {{ item.name }}, {{ replaceComma(item.type) }} - ({{ item.citations }})

          <button @click="handleRemove(item.id)" class="btn btn-danger d-flex align-items-center justify-content-center"
            style="height: 2.3em; width: 2.3em; color: white">
            <i class="bi bi-trash3-fill"></i>
          </button>
        </li>
      </ul>
    </div>

    <div v-else class="d-flex align-items-center justify-content-center w-100" style="height: 32vh">
      <h4 class="opacity-50 text-center">
        Nessuna località associata a questo luogo
      </h4>
    </div>
  </div>
  <transition name="fade">
    <div v-if="showToast2" class="toast-message" :style="{ background: toastColor2 }">
      {{ toastMessage2 }}
    </div>
  </transition>
</template>

<script setup>
import { removeFromGroup } from "@/services/api";
import { computed, ref } from "vue";

const props = defineProps({
  group: {
    type: Array,
    default: () => [],
  },
  loc: {
    type: Object,
    default: null,
  },
  allLocations: {
    type: Array,
    default: () => [],
  },
  showGroup: {
    type: Function,
    default: null,
  },
});

const emit = defineEmits(["remove-item", "go-default"]);

const toastMessage2 = ref("");
const showToast2 = ref(false);
const toastColor2 = ref("");

const groupIdsWithChildren = computed(() => {
  const groupIds = new Set();

  for (const loc of props.allLocations) {
    if (loc.group !== null) {
      groupIds.add(loc.group);
    }
  }

  return groupIds;
});

function replaceComma(str = "") {
  const formatted = String(str).replace(/,\s*/g, ", ");

  return formatted.length > 100 ? `${formatted.slice(0, 100)}...` : formatted;
}

function triggerToast2(msg, color) {
  toastMessage2.value = msg;
  toastColor2.value = color;
  showToast2.value = true;

  setTimeout(() => {
    showToast2.value = false;
  }, 2000);
}

function showSubGroup(item) {
  return groupIdsWithChildren.value.has(item.id);
}

const handleRemove = async (id) => {
  try {
    const removedItem = props.group.find((i) => i.id === id);
    await removeFromGroup(id);
    emit("remove-item", id);
    triggerToast2(
      `${removedItem.name}, ${removedItem.type} rimosso dal gruppo`,
      "#d21200",
    );
  } catch (err) {
    console.error("Errore durante la rimozione:", err);
  }
};

function backToDefault() {
  emit("go-default", null);
}
</script>

<style scoped>
#grouplist {
  position: fixed;
  height: 40vh;
  width: 70vw;
  background-color: #e3f4ff;
  top: 0;
  right: 0;
  padding: 1rem;
}

.scroll {
  max-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.list-group-item {
  background-color: #ffffff;
}

.toast-message {
  position: fixed;
  bottom: 20px;
  right: 20px;
  color: white;
  padding: 1rem 1.4rem;
  border-radius: 8px;
  z-index: 99999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
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
