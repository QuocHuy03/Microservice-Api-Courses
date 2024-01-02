import mongoose from "mongoose";

const tracksSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: "Courses" },
    duration: { /// thời gian
      type: Number,
      required: true,
    },
    position: { // số thứ tự
      type: Number,
      required: true,
    },
    track_steps_count: {
      // tổng bài học
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const TrackModel = mongoose.model("Tracks", tracksSchema);
