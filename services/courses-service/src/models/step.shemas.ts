import mongoose from "mongoose";

const stepsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    image_url: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    video_url: {
      type: String,
      required: true,
    },
    original_name: {
      type: String,
      required: true,
    },
    video_type: {
      type: String,
      required: true,
    },
    video: {
      type: String,
      required: true,
    },
    track_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tracks" },
  },
  {
    timestamps: true,
  }
);

export const StepModel = mongoose.model("Steps", stepsSchema);
