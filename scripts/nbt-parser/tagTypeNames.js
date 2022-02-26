import tagTypes from "./tagTypes.js";

/* A mapping from NBT type numbers to type names. */
const tagTypeNames = Object.fromEntries(Object.entries(tagTypes).map(array => array.reverse()));

export default tagTypeNames;