import type { Request, Response } from "express";
import { ReceiptsService } from "./receipts.service";
import {
  AddMemberInput,
  AddMemberParams,
  CreateReceiptInput,
  DeleteReceiptInput,
  GetReceiptByIdInput,
  ListMembersParams,
  RemoveMemberParams,
  UpdateMemberInput,
  UpdateMemberParams,
  UpdateReceiptInput,
  UpdateReceiptParams,
} from "./receipts.schema";
import { getPaginationParams } from "@/utils/pagination";
import { PaginationReceipts } from "./receipts.types";

export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) { }

  getReceipts = async (req: Request, res: Response) => {
    const pagination = getPaginationParams(req.query);
    const result: PaginationReceipts = await this.receiptsService.getReceipts(
      req.user!.id,
      pagination,
    );

    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  };

  getReceiptById = async (
    req: Request<GetReceiptByIdInput>,
    res: Response,
  ) => {
    const { id } = req.params;
    const receipt = await this.receiptsService.getReceiptById(
      id,
      req.user!.id,
    );

    res.status(200).json({ success: true, data: receipt });
  };

  createReceipt = async (
    req: Request<object, object, CreateReceiptInput>,
    res: Response,
  ) => {
    const receipt = await this.receiptsService.createReceipt(
      req.user!.id,
      req.body,
    );

    res.status(201).json({ success: true, data: receipt });
  };

  updateReceipt = async (
    req: Request<UpdateReceiptParams, object, UpdateReceiptInput>,
    res: Response,
  ) => {
    const { id } = req.params;
    const receipt = await this.receiptsService.updateReceipt(
      id,
      req.user!.id,
      req.body,
    );

    res.status(200).json({ success: true, data: receipt });
  };

  deleteReceipt = async (
    req: Request<DeleteReceiptInput>,
    res: Response,
  ) => {
    const { id } = req.params;
    await this.receiptsService.deleteReceipt(id, req.user!.id);

    res.status(200).json({
      success: true,
      message: "Receipt deleted successfully",
    });
  };

  listMembers = async (req: Request<ListMembersParams>, res: Response) => {
    const { id } = req.params;
    const members = await this.receiptsService.listMembers(
      id,
      req.user!.id,
    );

    res.status(200).json({ success: true, data: members });
  };

  addMember = async (
    req: Request<AddMemberParams, object, AddMemberInput>,
    res: Response,
  ) => {
    const { id } = req.params;
    const member = await this.receiptsService.addMember(
      id,
      req.user!.id,
      req.body,
    );

    res.status(201).json({ success: true, data: member });
  };

  updateMember = async (
    req: Request<UpdateMemberParams, object, UpdateMemberInput>,
    res: Response,
  ) => {
    const { id, userId } = req.params;
    const member = await this.receiptsService.updateMember(
      id,
      userId,
      req.user!.id,
      req.body,
    );

    res.status(200).json({ success: true, data: member });
  };

  removeMember = async (
    req: Request<RemoveMemberParams>,
    res: Response,
  ) => {
    const { id, userId } = req.params;
    await this.receiptsService.removeMember(id, userId, req.user!.id);

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });
  };
}
