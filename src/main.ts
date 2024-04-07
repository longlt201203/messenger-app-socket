import { createServer } from "http";
import { Server } from "socket.io";
import { SendMessageDto } from "./dto/send-message.dto";
import axios from "axios";
import { UserProfileDto } from "./dto/user-profile.dto";
import * as fs from "fs";
import * as path from "path";
import { ChatMessageDto } from "./dto/chat-message.dto";
import { RealChatMessgeDto } from "./dto/real-chat-message.dto";

const API_URL = "http://localhost:3000";
// let chatData: ChatMessageDto[] = [];

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
    const chatData = JSON.parse(dataString.toString()) as ChatMessageDto[];
    return chatData;
}

function insertChatData(data: ChatMessageDto) {
    const chatData = loadChatData();
    chatData.unshift(data);
    fs.writeFileSync(path.join("data", "chat.json"), JSON.stringify(chatData));
}

function getRealChatData() {
    const chatData = loadChatData();
    // let chat = chatData.length > 20 ? chatData.slice(0, 20) : chatData;
    let chat = chatData;
    let realChatData: RealChatMessgeDto[] = [];

    if (chat.length > 0) {
        realChatData.unshift({
            from: chat[0].from,
            messages: [chat[0].message]
        });
        for (let i = 1; i < chat.length; i++) {
            if (chat[i].from.id == realChatData[0].from.id) {
                realChatData[0].messages.unshift(chat[i].message);
            } else {
                realChatData.unshift({
                    from: chat[i].from,
                    messages: [chat[i].message]
                });
            }
        }
    }

    return realChatData;
}

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});

io.on("connection", (socket) => {
    console.log("A client connected");
    socket.emit("UPDATE_CHAT", getRealChatData());

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

                io.emit("UPDATE_CHAT", getRealChatData());
            }
        });
    });
});

loadChatData();
httpServer.listen(9000, () => {
    console.log("Server started!");
});