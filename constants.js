const ROLES = {
  ADMIN: 9,
  TAILOR_SHOP_OWNER: 4,
  USER: 1,
};

export default ROLES;

// Predefined services list
const PREDEFINED_SERVICES = [
  "School Uniforms",
  "Saree Blouses",
  "Wedding Attire",
  "Office Wear",
  "National Dress",
  "Formal Wear",
  "Casual Wear",
  "Kidswear",
  "Religious/Cultural Outfits",
  "Custom Fashion Designs",
];

const ACCESSORY_TYPES = [
  "Buttons",
  "Zippers",
  "Rhinestones",
  "Sequins",
  "Patches",
  "Collars",
  "Pockets",
];

const UNITS = ["meters", "pieces", "rolls", "grams", "units"];

const ORDER_STATUSES = ["pending", "processing", "completed", "cancelled"];

export { ACCESSORY_TYPES, ORDER_STATUSES, PREDEFINED_SERVICES, UNITS };
