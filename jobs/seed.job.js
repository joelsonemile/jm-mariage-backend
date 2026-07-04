const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Table = require("../models/Table");
const WeddingInfo = require("../models/WeddingInfo");
const InvitedGuest = require("../models/InvitedGuest");
const { ROLES, HONOR_TABLE, GUEST_TABLES } = require("../config/constants");
const { adminEmail, adminPassword, adminName } = require("../config/env");

async function seedAdmin() {
  const existing = await User.findOne({ email: adminEmail });
  if (existing) return;

  const hashed = await bcrypt.hash(adminPassword, 10);
  await User.create({
    fullName: adminName,
    email: adminEmail,
    phone: "N/A",
    password: hashed,
    role: ROLES.ADMIN,
    linkToCouple: "Autres",
  });
  console.log(`[seed] Compte administrateur créé (${adminEmail})`);
}

async function seedTables() {
  const count = await Table.countDocuments();
  if (count > 0) return;

  await Table.create([HONOR_TABLE, ...GUEST_TABLES]);
  console.log(`[seed] ${1 + GUEST_TABLES.length} tables créées (Table d'Honneur + 12 tables Madagascar)`);
}

async function seedWeddingInfo() {
  const existing = await WeddingInfo.findOne();
  if (existing) return;

  await WeddingInfo.create({
    date: new Date("2026-09-12T15:00:00+01:00"),
    dateLabel: "Asabotsy 12 Septembre 2026",
    ceremonyTime: "15h00 — Bénédiction nuptiale",
    location: "Église EEAM, Agadir, Maroc",
    mapUrl: "https://maps.app.goo.gl/3nCP5VXX7AC4NKP49",
    dressCode: "Élégante — touches dorées appréciées",
    programSummary: "15h Cérémonie • 18h Cocktail • 20h Dîner & soirée",
    programDetailed: [
      { time: "15h00", title: "Cérémonie religieuse", description: "Bénédiction nuptiale à l'église" },
      { time: "16h30", title: "Séance photos", description: "Photos officielles avec les mariés" },
      { time: "18h00", title: "Cocktail d'honneur", description: "Champagne & mignardises" },
      { time: "20h00", title: "Dîner de gala", description: "Menu gastronomique en 4 services" },
      { time: "22h00", title: "Ouverture de bal", description: "Première danse des mariés" },
      { time: "02h00", title: "Fin de soirée", description: "Dernier verre & au revoir" },
    ],
    coupleMessage:
      "Merci infiniment d'être à nos côtés pour célébrer ce jour si spécial. Votre présence est notre plus beau cadeau.",
    coupleImage: "",
    quote: "Ahy ny malalako, ary azy aho",
    quoteSource: "Tononkira'i Solomona 2:16a",
    giftRegistry: [],
  });
  console.log("[seed] Informations du mariage initialisées");
}

const INVITED_GUESTS_SEED = [
  { nom: "Youmnah", prenom: "", telephone: "", categorie: "Extérieur" },
  { nom: "Ricardo", prenom: "", telephone: "", categorie: "Extérieur" },
  { nom: "Nadine", prenom: "", telephone: "", categorie: "Extérieur" },
  { nom: "Marcel", prenom: "", telephone: "", categorie: "Extérieur" },
  { nom: "Vadiny", prenom: "", telephone: "", categorie: "Extérieur" },
  { nom: "Cathy", prenom: "", telephone: "", categorie: "Extérieur" },
  { nom: "", prenom: "Pastora Nicolas", telephone: "", categorie: "Extérieur" },
  { nom: "Casimir", prenom: "", telephone: "", categorie: "Extérieur" },
  { nom: "Michelle", prenom: "", telephone: "", categorie: "Extérieur" },
  { nom: "Pulchérie", prenom: "", telephone: "", categorie: "Extérieur" },
  { nom: "Eltinah", prenom: "", telephone: "", categorie: "Extérieur" },
  { nom: "Dauphine", prenom: "", telephone: "", categorie: "Extérieur" },
  { nom: "", prenom: "Mohamed", telephone: "", categorie: "Extérieur" },
  { nom: "Azziz", prenom: "", telephone: "", categorie: "Extérieur" },
  { nom: "Loubna", prenom: "", telephone: "", categorie: "Extérieur" },
  { nom: "Imane", prenom: "", telephone: "", categorie: "Extérieur" },
  { nom: "Ambre", prenom: "", telephone: "", categorie: "Extérieur" },
  { nom: "Rodri", prenom: "", telephone: "", categorie: "Extérieur" },
  { nom: "Davilla", prenom: "", telephone: "", categorie: "Extérieur" },

  { nom: "Nirina", prenom: "", telephone: "", categorie: "Chorale" },
  { nom: "Mardoché", prenom: "", telephone: "", categorie: "Chorale" },
  { nom: "Emmanuella", prenom: "", telephone: "", categorie: "Chorale" },
  { nom: "Samuel", prenom: "", telephone: "", categorie: "Chorale" },
  { nom: "Romuald", prenom: "", telephone: "", categorie: "Chorale" },
  { nom: "Chadrac", prenom: "", telephone: "", categorie: "Chorale" },
  { nom: "Anjary", prenom: "", telephone: "", categorie: "Chorale" },
  { nom: "Rova", prenom: "", telephone: "", categorie: "Chorale" },
  { nom: "Samuella", prenom: "", telephone: "", categorie: "Chorale" },
  { nom: "Naomie", prenom: "", telephone: "", categorie: "Chorale" },
  { nom: "Winner", prenom: "", telephone: "", categorie: "Chorale" },
  { nom: "Ramos", prenom: "", telephone: "", categorie: "Chorale" },
  { nom: "Tchinief", prenom: "", telephone: "", categorie: "Chorale" },
  { nom: "Universia Polis Femme", prenom: "", telephone: "", categorie: "Chorale" },
  { nom: "Ait Meloul Femme", prenom: "", telephone: "", categorie: "Chorale" },

  { nom: "Darasy", prenom: "Jean Laubritot", telephone: "0777343568", categorie: "Membre de bureau" },
  { nom: "Ralaiharison", prenom: "Mboara Nahary", telephone: "0773928349", categorie: "Membre de bureau" },
  { nom: "Rasolomanana", prenom: "Davida", telephone: "0621676080", categorie: "Membre de bureau" },
  { nom: "Rakotovao", prenom: "Valisoa Tahinjanahary", telephone: "0669755764", categorie: "Membre de bureau" },
  { nom: "Harena", prenom: "Zoly", telephone: "", categorie: "Membre de bureau" },
  { nom: "Ny Andritiana", prenom: "Yoann", telephone: "0625909244", categorie: "Membre de bureau" },
  { nom: "ANDRIAMASITIANA", prenom: "Kenny Maya", telephone: "0778632177", categorie: "Membre de bureau" },
  { nom: "RATEFISON", prenom: "Li-Ann Soanala", telephone: "0625557490", categorie: "Membre de bureau" },
  { nom: "Fitia", prenom: "", telephone: "", categorie: "Membre de bureau" },
  { nom: "Vaida", prenom: "", telephone: "", categorie: "Membre de bureau" },
  { nom: "Niaina", prenom: "Peige", telephone: "", categorie: "Membre de bureau" },

  { nom: "Frederic", prenom: "", telephone: "", categorie: "Membre CP" },
  { nom: "", prenom: "Pasteur Clement", telephone: "", categorie: "Membre CP" },
  { nom: "", prenom: "Maman Antoinette", telephone: "", categorie: "Membre CP" },
  { nom: "", prenom: "Pasteur David", telephone: "", categorie: "Membre CP" },
  { nom: "Charmilla", prenom: "", telephone: "", categorie: "Membre CP" },
  { nom: "Gerhard", prenom: "", telephone: "+212 658-262260", categorie: "Membre CP" },
  { nom: "Thierry", prenom: "", telephone: "", categorie: "Membre CP" },

  { nom: "Vola", prenom: "", telephone: "", categorie: "Église Grâce" },
  { nom: "Joel", prenom: "", telephone: "", categorie: "Église Grâce" },
  { nom: "Elya", prenom: "", telephone: "", categorie: "Église Grâce" },

  { nom: "Emmanuel", prenom: "", telephone: "+212 630-107917", categorie: "Accueil" },
  { nom: "Borda", prenom: "", telephone: "+212651024006", categorie: "Accueil" },
  { nom: "Abdias", prenom: "", telephone: "+212 777-404130", categorie: "Accueil" },
  { nom: "Mariame", prenom: "", telephone: "+212 719-688164", categorie: "Accueil" },
  { nom: "Eunice", prenom: "", telephone: "+212 635-483889", categorie: "Accueil" },
  { nom: "Grâce Divine", prenom: "", telephone: "+212 704-127946", categorie: "Accueil" },
];

async function seedInvitedGuests() {
  const count = await InvitedGuest.countDocuments();
  if (count > 0) return;

  await InvitedGuest.create(INVITED_GUESTS_SEED);
  console.log(`[seed] ${INVITED_GUESTS_SEED.length} invités attendus créés`);
}

async function runSeed() {
  await seedAdmin();
  await seedTables();
  await seedWeddingInfo();
  await seedInvitedGuests();
}

module.exports = runSeed;
