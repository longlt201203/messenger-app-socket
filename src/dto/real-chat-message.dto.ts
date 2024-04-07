import { UserProfileDto } from "./user-profile.dto";

export class RealChatMessgeDto {
    from: UserProfileDto;
    messages: string[];
}