import { TrackModel } from "../models/track.schemas";
import slugify from "slugify";

class TracksService {
  async checkExist(key: string, value: string) {
    const query = { [key]: value };
    const track = await TrackModel.findOne(query);
    return Boolean(track);
  }

  async create(data: any) {
    const exsit = await this.checkExist(`title`, data.title);
    if (exsit) {
      return {
        status: false,
        message: "Nội dung bài học đã tồn tại",
      };
    }
    const slug = slugify(data.title, { lower: true });
    const result = await TrackModel.create({ ...data, slug: slug });
    return {
      status: true,
      message: "Thêm nội dung bài học thành công",
      result,
    };
  }

  async update(slug: string, body: any) {
    const exsit = await this.checkExist(`title`, body.title);
    if (exsit) {
      return {
        status: false,
        message: "Thêm nội dung bài học đã tồn tại",
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
    const result = await TrackModel.findOneAndUpdate(
      { slug: slug },
      { $set: updatedData },
      { returnDocument: "after" }
    );

    return {
      status: true,
      message: "Cập nhật nội dung bài học thành công",
      result,
    };
  }

  async delete(id: string) {
    const exsit = await tracksService.checkExist(`categoryID`, id);
    if (exsit) {
      return {
        status: false,
        message: "Không thể xóa danh mục vì nó được sử dụng trong thương hiệu!",
      };
    }
    await TrackModel.deleteOne({ _id: id });
    return {
      status: true,
      message: "Xóa nội dung bài học thành công",
    };
  }

}

const tracksService = new TracksService();
export default tracksService;
