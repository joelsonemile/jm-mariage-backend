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

const COMMITTEE_COMMISSIONS = [
  "Cuisine",
  "Déco",
  "Logistique",
  "Accueil",
  "Intercession",
  "Multimédia",
  "Gestion des invités",
  "Autres",
];

// Comité d'organisation et rôles principaux — issu du document de planification fourni.
const COMMITTEE_SEED = [
  {
    nom: "Pst Clément",
    role: "Bénédiction à l'église",
    commission: "",
    description:
      "Diriger la cérémonie religieuse : prédication, échange des vœux, bénédiction des alliances, prière pour les mariés et proclamation du mariage. Ils veillent également au bon déroulement spirituel de la cérémonie.",
  },
  {
    nom: "Pst Antoinette",
    role: "Bénédiction à l'église",
    commission: "",
    description:
      "Diriger la cérémonie religieuse : prédication, échange des vœux, bénédiction des alliances, prière pour les mariés et proclamation du mariage. Ils veillent également au bon déroulement spirituel de la cérémonie.",
  },
  {
    nom: "Jonathan",
    role: "Gestion des invités au presbytère",
    commission: "",
    description:
      "Accueillir les invités au presbytère, vérifier la liste des invités, les orienter vers leurs places, répondre aux questions et gérer les éventuels imprévus.",
  },
  {
    nom: "Frank",
    role: "Coordinateur Principal",
    commission: "",
    description:
      "Chef d'orchestre de toute l'organisation. Il supervise tous les responsables, s'assure que le planning est respecté, prend les décisions rapides en cas d'imprévu et veille au bon déroulement général.",
  },
  {
    nom: "Maya",
    role: "Responsable décoration",
    commission: "Déco",
    description:
      "Concevoir et installer toute la décoration de l'église, du lieu de réception, des tables, de l'entrée, de la scène, des fleurs, des chaises, etc. Vérifier que tout est prêt avant l'arrivée des invités.",
  },
  {
    nom: "A définir",
    role: "Assistante responsable décoration",
    commission: "Déco",
    description:
      "Aider le responsable décoration dans les préparatifs, coordonner l'équipe décoration et assurer les retouches de dernière minute.",
  },
  {
    nom: "Jean Borda",
    role: "Co-responsable logistique Église, Coordination à l'église",
    commission: "Logistique",
    description:
      "Organiser les déplacements dans l'église : arrivée des mariés, installation des familles, des témoins, du cortège, circulation des invités, préparation des chaises et coordination avec le pasteur.",
  },
  {
    nom: "Emmanuella Casa",
    role: "Dame de compagnie",
    commission: "",
    description:
      "Accompagner principalement la mariée durant toute la journée : aider pour la robe, le maquillage, les accessoires, gérer les besoins personnels et veiller à son confort.",
  },
  {
    nom: "Pierre Landrie",
    role: "Coordinateur du temps : Les mariés, à l'église et la fête",
    commission: "",
    description:
      "S'assurer que toutes les activités respectent l'horaire prévu : arrivée des mariés, début de la cérémonie, photos, réception, repas, discours, animations, ouverture du bal, etc. Informe chaque responsable lorsque son intervention approche.",
  },
  {
    nom: "Wilson",
    role: "Co-responsable logistique Église",
    commission: "Logistique",
    description:
      "Assister Jean Borda dans la gestion de la logistique de l'église : installation du matériel, accueil des intervenants, préparation des chaises, circulation et résolution des petits problèmes logistiques.",
  },
  {
    nom: "Maman Silvie",
    role: "Responsable Cuisine",
    commission: "Cuisine",
    description:
      "Superviser toute la préparation des repas, coordonner les cuisiniers, contrôler les quantités, organiser le service et s'assurer que les repas sont servis au bon moment.",
  },
  {
    nom: "Grace Divine",
    role: "Assistante Responsable Cuisine",
    commission: "Cuisine",
    description:
      "Soutenir le responsable cuisine, coordonner les serveurs, vérifier la présentation des plats et gérer les besoins de dernière minute.",
  },
  {
    nom: "Mardochée Kalamba",
    role: "Responsable chorale, musique Dj et location sono",
    commission: "Multimédia",
    description:
      "Préparer tous les aspects musicaux : chorale, musiciens, playlist, DJ, micros, enceintes, tests de son, musique d'entrée des mariés, musique de fond et animations musicales.",
  },
  {
    nom: "Les intercesseurs",
    role: "Responsable Intercession",
    commission: "Intercession",
    description:
      "Organiser une équipe de prière avant, pendant et après le mariage. Soutenir spirituellement les mariés et l'événement dans la discrétion.",
  },
  {
    nom: "Emmanuel Niyo",
    role: "Maître de cérémonie",
    commission: "",
    description:
      "Animer la réception : accueillir les invités, présenter les différentes séquences, annoncer les intervenants, maintenir une bonne ambiance et respecter le programme.",
  },
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
  COMMITTEE_COMMISSIONS,
  COMMITTEE_SEED,
  RSVP_STATUS,
  RESERVATION_STATUS,
  SEATS_PER_TABLE,
  HONOR_TABLE_SEATS,
  HONOR_TABLE,
  GUEST_TABLES,
};
