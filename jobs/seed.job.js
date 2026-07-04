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
  { nom: "Youmnah", prenom: "", telephone: "" },
  { nom: "Ricardo", prenom: "", telephone: "" },
  { nom: "Nadine", prenom: "", telephone: "" },
  { nom: "Marcel", prenom: "", telephone: "" },
  { nom: "Vadiny", prenom: "", telephone: "" },
  { nom: "Cathy", prenom: "", telephone: "" },
  { nom: "", prenom: "Pastora Nicolas", telephone: "" },
  { nom: "Casimir", prenom: "", telephone: "" },
  { nom: "Michelle", prenom: "", telephone: "" },
  { nom: "Pulchérie", prenom: "", telephone: "" },
  { nom: "Eltinah", prenom: "", telephone: "" },
  { nom: "Dauphine", prenom: "", telephone: "" },
  { nom: "", prenom: "Mohamed", telephone: "" },
  { nom: "Azziz", prenom: "", telephone: "" },
  { nom: "Loubna", prenom: "", telephone: "" },
  { nom: "Imane", prenom: "", telephone: "" },
  { nom: "Ambre", prenom: "", telephone: "" },
  { nom: "Rodri", prenom: "", telephone: "" },
  { nom: "Davilla", prenom: "", telephone: "" },

  { nom: "Nirina", prenom: "", telephone: "" },
  { nom: "Mardoché", prenom: "", telephone: "" },
  { nom: "Emmanuella", prenom: "", telephone: "" },
  { nom: "Samuel", prenom: "", telephone: "" },
  { nom: "Romuald", prenom: "", telephone: "" },
  { nom: "Chadrac", prenom: "", telephone: "" },
  { nom: "Anjary", prenom: "", telephone: "" },
  { nom: "Rova", prenom: "", telephone: "" },
  { nom: "Samuella", prenom: "", telephone: "" },
  { nom: "Naomie", prenom: "", telephone: "" },
  { nom: "Winner", prenom: "", telephone: "" },
  { nom: "Ramos", prenom: "", telephone: "" },
  { nom: "Tchinief", prenom: "", telephone: "" },
  { nom: "Universia Polis Femme", prenom: "", telephone: "" },
  { nom: "Ait Meloul Femme", prenom: "", telephone: "" },

  { nom: "Darasy", prenom: "Jean Laubritot", telephone: "0777343568" },
  { nom: "Ralaiharison", prenom: "Mboara Nahary", telephone: "0773928349" },
  { nom: "Rasolomanana", prenom: "Davida", telephone: "0621676080" },
  { nom: "Rakotovao", prenom: "Valisoa Tahinjanahary", telephone: "0669755764" },
  { nom: "Harena", prenom: "Zoly", telephone: "" },
  { nom: "Ny Andritiana", prenom: "Yoann", telephone: "0625909244" },
  { nom: "ANDRIAMASITIANA", prenom: "Kenny Maya", telephone: "0778632177" },
  { nom: "RATEFISON", prenom: "Li-Ann Soanala", telephone: "0625557490" },
  { nom: "Fitia", prenom: "", telephone: "" },
  { nom: "Vaida", prenom: "", telephone: "" },
  { nom: "Niaina", prenom: "Peige", telephone: "" },

  { nom: "Frederic", prenom: "", telephone: "" },
  { nom: "", prenom: "Pasteur Clement", telephone: "" },
  { nom: "", prenom: "Maman Antoinette", telephone: "" },
  { nom: "", prenom: "Pasteur David", telephone: "" },
  { nom: "Charmilla", prenom: "", telephone: "" },
  { nom: "Gerhard", prenom: "", telephone: "+212 658-262260" },
  { nom: "Thierry", prenom: "", telephone: "" },

  { nom: "Vola", prenom: "", telephone: "" },
  { nom: "Joel", prenom: "", telephone: "" },
  { nom: "Elya", prenom: "", telephone: "" },

  { nom: "Emmanuel", prenom: "", telephone: "+212 630-107917" },
  { nom: "Borda", prenom: "", telephone: "+212651024006" },
  { nom: "Abdias", prenom: "", telephone: "+212 777-404130" },
  { nom: "Mariame", prenom: "", telephone: "+212 719-688164" },
  { nom: "Eunice", prenom: "", telephone: "+212 635-483889" },
  { nom: "Grâce Divine", prenom: "", telephone: "+212 704-127946" },
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
