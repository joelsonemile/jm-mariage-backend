const mongoose = require("mongoose");

const programStepSchema = new mongoose.Schema(
  {
    time: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const weddingInfoSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    dateLabel: { type: String, default: "" },
    ceremonyTime: { type: String, default: "" },
    location: { type: String, default: "" },
    dressCode: { type: String, default: "" },
    programSummary: { type: String, default: "" },
    programDetailed: { type: [programStepSchema], default: [] },
    coupleMessage: { type: String, default: "" },
    coupleImage: { type: String, default: "" },
    quote: { type: String, default: "" },
    quoteSource: { type: String, default: "" },
    giftRegistry: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WeddingInfo", weddingInfoSchema);
