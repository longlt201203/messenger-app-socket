import { UserProfileDto } from "./user-profile.dto";

export class ChatMessageDto {
    from: UserProfileDto;
    message: string;
    timestamp: number;
}