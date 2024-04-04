import { createServer } from "http";
import { Server } from "socket.io";
import { SendMessageDto } from "./dto/send-message.dto";
import axios from "axios";
import { UserProfileDto } from "./dto/user-profile.dto";
import * as fs from "fs";
import * as path from "path";
import { ChatMessageDto } from "./dto/chat-message.dto";

const API_URL = "http://localhost:3000";
let chatData: ChatMessageDto[] = [];

function getProfile(accessToken: string, onResponse: (error: Error | null, profile: UserProfileDto | null) => void) {
    axios.get<UserProfileDto>(`${API_URL}/auth/profile`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    })
    .then((res) => {
        onResponse(null, res.data);
    })
    .catch((err) => {
        onResponse(err, null);
    });
}

function loadChatData() {
    const dataString = fs.readFileSync(path.join("data", "chat.json"));
    chatData = JSON.parse(dataString.toString()) as ChatMessageDto[];
}

function insertChatData(data: ChatMessageDto) {
    chatData.unshift(data);
    fs.writeFileSync(path.join("data", "chat.json"), JSON.stringify(chatData));
}

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});

io.on("connection", (socket) => {
    console.log("A client connected");
    socket.emit("UPDATE_CHAT", chatData.length > 20 ? chatData.slice(0, 20) : chatData);

    socket.on("disconnect", (reason, description) => {
        console.log("A client disconnected");
    });

    socket.on("SEND_MESSAGE", (dto: SendMessageDto) => {
        getProfile(dto.accessToken, (err, profile) => {
            if (!profile) {
                console.log(err);
            } else {
                console.log(profile);

                insertChatData({
                    message: dto.message,
                    from: profile,
                    timestamp: Date.now()
                });

                io.emit("UPDATE_CHAT", chatData.length > 20 ? chatData.slice(0, 20) : chatData);
            }
        });
    });
});

loadChatData();
httpServer.listen(9000, () => {
    console.log("Server started!");
});