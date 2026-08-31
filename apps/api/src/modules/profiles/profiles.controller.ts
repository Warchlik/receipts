import type { Request, Response } from "express";
import { ProfilesService } from "./profiles.service";
import { UpdateProfileInput } from "./profiles.schema";

export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  getMe = async (req: Request, res: Response) => {
    const profile = await this.profilesService.getMyProfile(req.user!.id);

    res.status(200).json({ success: true, data: profile });
  };

  updateMe = async (
    req: Request<object, object, UpdateProfileInput>,
    res: Response,
  ) => {
    const profile = await this.profilesService.updateMyProfile(
      req.user!.id,
      req.body,
    );

    res.status(200).json({ success: true, data: profile });
  };
}
