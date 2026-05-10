export const showGroup = async (clickedLoc) => {
  Isactive.value = clickedLoc.id;
  const group = (selectedGroup.value = locations.value.filter(
    (loc) => loc.group === clickedLoc.id
  ));

  if (selectedGroup.value.length === 0) {
    alert(
      "Nessun elemento associato a " + clickedLoc.name + ", " + clickedLoc.type
    );
  }

  selectedGroup.value = group;
  emit("add-group", { group, loc: clickedLoc });
  return selectedGroup.data;
};
