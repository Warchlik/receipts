import type { Request, Response } from "express";
import { InvitesService } from "./invites.service";
import {
  AcceptInviteParams,
  CreateInviteInput,
  CreateInviteParams,
  GetInviteByTokenParams,
} from "./invites.schema";

export class InvitesController {
  constructor(
    private readonly invitesService: InvitesService,
  ) { }

  createInvite = async (
    req: Request<
      CreateInviteParams,
      object,
      CreateInviteInput
    >,
    res: Response,
  ) => {
    const { id } = req.params;
    const invite = await this.invitesService.createInvite(
      id,
      req.user!.id,
      req.body.member_id ?? null,
    );

    res.status(201).json({ success: true, data: invite });
  };

  getInvitePreview = async (
    req: Request<GetInviteByTokenParams>,
    res: Response,
  ) => {
    const { token } = req.params;
    const preview =
      await this.invitesService.getInvitePreview(token);

    res.status(200).json({ success: true, data: preview });
  };

  acceptInvite = async (
    req: Request<AcceptInviteParams>,
    res: Response,
  ) => {
    const { token } = req.params;
    const member = await this.invitesService.acceptInvite(
      token,
      req.user!.id,
    );

    res.status(200).json({ success: true, data: member });
  };
}
