import { CategoryModel } from "../models/category.schemas";
import slugify from "slugify";

class CategoriesService {
  async checkExist(key: string, value: string) {
    const query = { [key]: value };
    const user = await CategoryModel.findOne(query);
    return Boolean(user);
  }

  async getAll() {
    const result = await CategoryModel.find().sort({ createdAt: -1 });
    if (result) {
      return {
        status: true,
        message: "Lấy tất cả dữ liệu danh mục thành công",
        result,
      };
    }
  }

  async getByID(id: string) {
    const result = await CategoryModel.findOne({ _id: id }).sort({
      createdAt: -1,
    });

    if (result) {
      return {
        status: true,
        message: "Lấy dữ liệu danh mục thành công",
        result,
      };
    }
  }

  async getBySlug(slug: string) {
    const result = await CategoryModel.findOne({ slug: slug }).sort({
      createdAt: -1,
    });
    if (result) {
      return {
        status: true,
        message: "Lấy dữ liệu danh mục thành công",
        result,
      };
    }
  }

  async create(data: any) {
    const exsit = await this.checkExist(`title`, data.title);
    if (exsit) {
      return {
        status: false,
        message: "Danh mục đã tồn tại",
      };
    }
    const slug = slugify(data.title, { lower: true });
    const result = await CategoryModel.create({ ...data, slug: slug });
    return {
      status: true,
      message: "Thêm danh mục thành công",
      result,
    };
  }

  async update(slug: string, body: any) {
    const exsit = await this.checkExist(`title`, body.title);
    if (exsit) {
      return {
        status: false,
        message: "Danh mục đã tồn tại",
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
    const result = await CategoryModel.findOneAndUpdate(
      { slug: slug },
      { $set: updatedData },
      { returnDocument: "after" }
    );

    return {
      status: true,
      message: "Cập nhật danh mục thành công",
      result,
    };
  }

  async delete(id: string) {
    const exsit = await categoriesService.checkExist(`categoryID`, id);
    if (exsit) {
      return {
        status: false,
        message: "Không thể xóa danh mục vì nó được sử dụng trong thương hiệu!",
      };
    }
    await CategoryModel.deleteOne({ _id: id });
    return {
      status: true,
      message: "Xóa danh mục thành công",
    };
  }
}

const categoriesService = new CategoriesService();
export default categoriesService;
