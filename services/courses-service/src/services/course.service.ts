import { CourseModel } from "../models/course.schemas";
const axios = require("axios");
import slugify from "slugify";
const mongoose = require("mongoose");

class CoursesService {
  async checkExist(key: string, value: string) {
    const query = { [key]: value };
    const course = await CourseModel.findOne(query);
    return Boolean(course);
  }

  async create(data: any) {
    const exsit = await this.checkExist(`title`, data.title);
    if (exsit) {
      return {
        status: false,
        message: "Khóa học đã tồn tại",
      };
    }
    const slug = slugify(data.title, { lower: true });
    const result = await CourseModel.create({ ...data, slug: slug });
    return {
      status: true,
      message: "Thêm khóa học thành công",
      result,
    };
  }

  async update(slug: string, body: any) {
    const exsit = await this.checkExist(`title`, body.title);
    if (exsit) {
      return {
        status: false,
        message: "Khóa học đã tồn tại",
      };
    }
    const updatedData: any = {
      ...body,
      updatedAt: new Date(),
    };
    if (body.title) {
      updatedData.slug = slugify(body.title, { lower: true });
    }

    // Thực hiện cập nhật
    const result = await CourseModel.findOneAndUpdate(
      { slug: slug },
      { $set: updatedData },
      { returnDocument: "after" }
    );

    return {
      status: true,
      message: "Cập nhật khóa học thành công",
      result,
    };
  }

  async delete(id: string) {
    const exsit = await coursesService.checkExist(`categoryID`, id);
    if (exsit) {
      return {
        status: false,
        message: "Không thể xóa danh mục vì nó được sử dụng trong thương hiệu!",
      };
    }
    await CourseModel.deleteOne({ _id: id });
    return {
      status: true,
      message: "Xóa khóa học thành công",
    };
  }

}

const coursesService = new CoursesService();
export default coursesService;
