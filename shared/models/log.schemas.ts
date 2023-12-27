
import mongoose, { Schema, Document } from 'mongoose';

export interface ILog extends Document {
  userID: mongoose.Schema.Types.ObjectId;
  ip: string;
  action: string;
}

const LogSchema: Schema = new Schema(
  {
    userID: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    ip: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const LogModel = mongoose.model<ILog>('Logs', LogSchema);
