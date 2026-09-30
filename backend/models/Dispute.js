const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, enum: ["opened", "message"], required: true },
  text: { type: String, default: "", maxlength: 2000 },
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Attachment" }],
  createdAt: { type: Date, default: Date.now },
});

const disputeSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  status: { type: String, enum: ["open"], default: "open" },
  history: [historySchema],
}, { timestamps: true });

disputeSchema.index({ project: 1, status: 1 }, { unique: true, partialFilterExpression: { status: "open" } });

module.exports = mongoose.model("Dispute", disputeSchema);