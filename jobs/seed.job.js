const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Table = require("../models/Table");
const WeddingInfo = require("../models/WeddingInfo");
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
    location: "Agadir, Maroc",
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

async function runSeed() {
  await seedAdmin();
  await seedTables();
  await seedWeddingInfo();
}

module.exports = runSeed;
