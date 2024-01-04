import mongoose from "mongoose";
import { CourseModel } from "../models/course.schemas";
import slugify from "slugify";

class CoursesService {
  async checkExist(key: string, value: string) {
    const query = { [key]: value };
    const course = await CourseModel.findOne(query);
    return Boolean(course);
  }

  async getAll() {
    const result = await CourseModel.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category_id",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);
    if (result) {
      return {
        status: true,
        message: "Lấy tất cả dữ liệu khóa học thành công",
        result,
      };
    }
  }

  async getByID(id: string) {
    const result = await CourseModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category_id",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    return {
      status: true,
      message: "Lấy dữ liệu khóa học thành công",
      result: result[0],
    };
  }

  async getProductsByCategory(slug: string) {
    const products: any = await this.getAll();
    const filterOfCategory: any = products?.result.filter(
      (item: any) => item.category.slugCategory === slug
    );

    return {
      status: true,
      message: "Lấy dữ liệu khóa học thành công",
      result: filterOfCategory,
    };
  }

  async getBySlug(slug: string) {
    const result = await CourseModel.aggregate([
      {
        $match: { slug: slug },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category_id",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    return {
      status: true,
      message: "Lấy dữ liệu khóa học thành công",
      result: result[0],
    };
  }

  async getSearch(label: any) {
    const regexPattern = new RegExp(`^${label}`, "i");
    const result = await CourseModel.aggregate([
      {
        $match: {
          title: regexPattern,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category_id",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
    ]);
    return result;
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
