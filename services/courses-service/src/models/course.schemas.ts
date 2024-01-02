import mongoose from "mongoose";

const coursesSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    video_type: {
      type: String,
      required: true,
    },
    video_code: {
      type: String,
      required: true,
    },
    old_price: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    pre_order_price: {
      type: Number,
      required: true,
    },
    students_count: {
      type: Number,
      required: true,
    },
    is_registered: {
      // Check xem đã đăng ký khóa học chưa
      type: Boolean,
      required: true,
    },
    last_completed_at: {
      // Thời gian đăng ký khóa học
      type: String,
      required: true,
    },
    image_url: {
      type: String,
      required: true,
    },
    video_url: {
      type: String,
      required: true,
    },
    is_published: {
      type: Boolean,
      required: true,
    },
    is_pro: {
      // Những khóa học pro
      type: Boolean,
      required: true,
    },
    is_coming_soon: {
      // Những khóa học sắp ra mắt
      type: Boolean,
      required: true,
    },
    is_selling: {
      // Những khóa học sale
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CourseModel = mongoose.model("Courses", coursesSchema);
