import { StepModel } from './../models/step.shemas';
import slugify from "slugify";

class StepsService {
  async checkExist(key: string, value: string) {
    const query = { [key]: value };
    const track = await StepModel.findOne(query);
    return Boolean(track);
  }

  async create(data: any) {
    const exsit = await this.checkExist(`title`, data.title);
    if (exsit) {
      return {
        status: false,
        message: "Bài học của nội dung đã tồn tại",
      };
    }
    const slug = slugify(data.title, { lower: true });
    const result = await StepModel.create({ ...data, slug: slug });
    return {
      status: true,
      message: "Thêm bài học của nội dung thành công",
      result,
    };
  }

  async update(slug: string, body: any) {
    const exsit = await this.checkExist(`title`, body.title);
    if (exsit) {
      return {
        status: false,
        message: "Thêm bài học của nội dung đã tồn tại",
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
    const result = await StepModel.findOneAndUpdate(
      { slug: slug },
      { $set: updatedData },
      { returnDocument: "after" }
    );

    return {
      status: true,
      message: "Cập nhật bài học của nội dung thành công",
      result,
    };
  }

  async delete(id: string) {
    const exsit = await stepsService.checkExist(`categoryID`, id);
    if (exsit) {
      return {
        status: false,
        message: "Không thể xóa danh mục vì nó được sử dụng trong thương hiệu!",
      };
    }
    await StepModel.deleteOne({ _id: id });
    return {
      status: true,
      message: "Xóa bài học của nội dung thành công",
    };
  }

}

const stepsService = new StepsService();
export default stepsService;
