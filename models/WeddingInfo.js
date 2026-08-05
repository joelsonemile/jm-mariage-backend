const mongoose = require("mongoose");

const programStepSchema = new mongoose.Schema({
  time: { type: String, default: "" },
  title: { type: String, default: "" },
  description: { type: String, default: "" },
});

const weddingInfoSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    dateLabel: { type: String, default: "" },
    ceremonyTime: { type: String, default: "" },
    location: { type: String, default: "" },
    mapUrl: { type: String, default: "" },
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
