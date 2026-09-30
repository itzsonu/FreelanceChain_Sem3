const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    default: "",
  },

  status: {
    type: String,
    enum: ["locked", "active", "submitted", "revision_requested", "completed"],
    default: "locked",
  },

  payment: {
    type: Number,
    default: 0,
  },
  dueDate: { type: String, default: "" },

  submittedWork: {
    type: String,
    default: "",
  },

  submittedAt: {
    type: Date,
    default: null,
  },

  approvedAt: {
    type: Date,
    default: null,
  },
  dependsOn: [{ type: mongoose.Schema.Types.ObjectId }],
  revisionFeedback: { type: String, default: "" },
  revisionRequestedAt: { type: Date, default: null },
  revisionCount: { type: Number, default: 0 },
  submissions: [{
    work: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    files: [{ type: mongoose.Schema.Types.ObjectId, ref: "Attachment" }],
    version: { type: Number, default: 1 },
  }],
  revisionRequests: [{
    submission: { type: mongoose.Schema.Types.ObjectId },
    feedback: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
  }],
  currentSubmission: { type: mongoose.Schema.Types.ObjectId, default: null },
});

const activitySchema = new mongoose.Schema({
  type: { type: String, required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  actorName: { type: String, default: "" },
  milestoneId: { type: mongoose.Schema.Types.ObjectId },
  milestoneTitle: { type: String, default: "" },
  note: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const agreementMilestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  payment: { type: Number, required: true },
  dueDate: { type: String, default: "" },
}, { _id: false });

const agreementSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
  offer: { type: mongoose.Schema.Types.ObjectId, required: true },
  version: { type: Number, required: true },
  terms: {
    scope: { type: String, required: true },
    amount: { type: Number, required: true },
    deliveryDate: { type: String, required: true },
    milestones: { type: [agreementMilestoneSchema], required: true },
  },
  client: {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    agreedAt: { type: Date, required: true },
  },
  freelancer: {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    agreedAt: { type: Date, required: true },
  },
  agreedAt: { type: Date, required: true },
}, { _id: false, strict: "throw" });

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "Other",
      enum: ["Web Development", "Design & Creative", "Writing & Translation", "Marketing", "Data & Analytics", "Video & Animation", "Admin & Support", "Other"],
    },
    description: { type: String, default: "" },
    requiredSkills: { type: [String], default: [] },

    budget: {
      type: Number,
      required: true,
    },

    deadline: {
      type: String,
      required: true,
    },

    milestones: [milestoneSchema],
    hasExplicitDependencies: { type: Boolean, default: false },
    activity: [activitySchema],

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["Open", "In Progress", "Completed"],
      default: "Open",
    },
    agreement: { type: agreementSchema, default: null, immutable: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
