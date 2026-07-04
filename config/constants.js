const ROLES = {
  GUEST: "guest",
  ADMIN: "admin",
};

const LINKS_TO_COUPLE = [
  "Famille de Joelson",
  "Famille de Marjorie",
  "Ami(e)s",
  "Collègues",
  "Autres",
];

const INVITED_GUEST_CATEGORIES = [
  "Extérieur",
  "Chorale",
  "Membre de bureau",
  "Membre CP",
  "Église Grâce",
  "Accueil",
  "Cuisine",
  "Multimédia",
  "Serveur",
  "Autres",
];

const RSVP_STATUS = {
  PENDING: "pending",
  YES: "yes",
  NO: "no",
};

const RESERVATION_STATUS = {
  PENDING: "pending",
  VALIDATED: "validated",
  CANCELLED: "cancelled",
};

const SEATS_PER_TABLE = 8;
const HONOR_TABLE_SEATS = 2;

const HONOR_TABLE = {
  name: "Table d'Honneur",
  description: "La table du couple, Joelson & Marjorie",
  isHonorTable: true,
  totalSeats: HONOR_TABLE_SEATS,
  order: 0,
};

const GUEST_TABLES = [
  { name: "Baobab", description: "Inspirée des baobabs emblématiques de Madagascar", order: 1 },
  { name: "Nosy Be", description: "La célèbre île du nord", order: 2 },
  { name: "Tsingy", description: "Les formations rocheuses spectaculaires du centre-ouest", order: 3 },
  { name: "Isalo", description: "Le grand parc aux canyons rouges", order: 4 },
  { name: "Ambositra", description: "La capitale de l'artisanat malgache", order: 5 },
  { name: "Morondava", description: "La route des baobabs face à l'océan", order: 6 },
  { name: "Andasibe", description: "La forêt tropicale et ses lémuriens", order: 7 },
  { name: "Fianarantsoa", description: "Les hautes terres et les vignobles", order: 8 },
  { name: "Mahajanga", description: "La baie et les embruns du nord-ouest", order: 9 },
  { name: "Tuléar", description: "Le sud et ses lagons turquoise", order: 10 },
  { name: "Antsiranana", description: "Diego Suarez, la pointe nord", order: 11 },
  { name: "Highlands", description: "Les Hauts Plateaux malgaches", order: 12 },
].map((t) => ({ ...t, isHonorTable: false, totalSeats: SEATS_PER_TABLE }));

module.exports = {
  ROLES,
  LINKS_TO_COUPLE,
  INVITED_GUEST_CATEGORIES,
  RSVP_STATUS,
  RESERVATION_STATUS,
  SEATS_PER_TABLE,
  HONOR_TABLE_SEATS,
  HONOR_TABLE,
  GUEST_TABLES,
};
