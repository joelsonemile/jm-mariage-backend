const WeddingInfo = require("../models/WeddingInfo");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, ok } = require("../utils/apiResponse");
const pdfService = require("../services/pdf.service");

const getInfo = asyncHandler(async (req, res) => {
  const info = await WeddingInfo.findOne();
  return ok(res, { info });
});

const exportProgramPdf = asyncHandler(async (req, res) => {
  const info = await WeddingInfo.findOne();
  if (!info) throw new ApiError(404, "Informations du mariage introuvables.");

  const buffer = await pdfService.buildProgramPdf(info);
  res.header("Content-Type", "application/pdf");
  res.attachment("programme-jm-mariage.pdf");
  return res.send(buffer);
});

const updateInfo = asyncHandler(async (req, res) => {
  const info = await WeddingInfo.findOneAndUpdate({}, req.body, {
    new: true,
    upsert: true,
    runValidators: true,
  });
  return ok(res, { info });
});

// CRUD dédié pour les étapes du programme détaillé : chaque ajout/modification/
// suppression est persisté immédiatement, indépendamment du bouton "Enregistrer"
// du reste du formulaire d'infos.
const addProgramStep = asyncHandler(async (req, res) => {
  const { time, title, description, section } = req.body;
  const info = await WeddingInfo.findOneAndUpdate(
    {},
    {
      $push: {
        programDetailed: { time: time || "", title: title || "", description: description || "", section: section || "" },
      },
    },
    { new: true, upsert: true, runValidators: true }
  );
  return ok(res, { info }, 201);
});

const updateProgramStep = asyncHandler(async (req, res) => {
  const { time, title, description, section } = req.body;
  const info = await WeddingInfo.findOne();
  if (!info) throw new ApiError(404, "Informations du mariage introuvables.");

  const step = info.programDetailed.id(req.params.stepId);
  if (!step) throw new ApiError(404, "Étape du programme introuvable.");

  if (time !== undefined) step.time = time;
  if (title !== undefined) step.title = title;
  if (description !== undefined) step.description = description;
  if (section !== undefined) step.section = section;

  // Les étapes existantes créées avant l'ajout des _id par étape n'en ont pas
  // encore de persisté : on force l'écriture du tableau entier pour que Mongoose
  // fige (et sauvegarde) l'_id généré à l'hydratation pour CHAQUE étape, pas
  // seulement celle qu'on modifie ici. Sans ça, un id non modifié change à
  // chaque nouvelle lecture et casse les futurs appels PUT/DELETE par _id.
  info.markModified("programDetailed");
  await info.save();
  return ok(res, { info });
});

const deleteProgramStep = asyncHandler(async (req, res) => {
  const info = await WeddingInfo.findOne();
  if (!info) throw new ApiError(404, "Informations du mariage introuvables.");

  const step = info.programDetailed.id(req.params.stepId);
  if (!step) throw new ApiError(404, "Étape du programme introuvable.");

  step.deleteOne();
  info.markModified("programDetailed");
  await info.save();
  return ok(res, { info });
});

module.exports = { getInfo, updateInfo, exportProgramPdf, addProgramStep, updateProgramStep, deleteProgramStep };
