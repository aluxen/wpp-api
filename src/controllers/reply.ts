import { logger, emitEvent } from "@/utils";
import WhatsappService from "@/whatsapp/service";
import { updatePresence } from "./misc";
import { WAPresence } from "@/types";
import env from "@/config/env";
import type { AnyMessageContent, MiscMessageGenerationOptions, proto } from "baileys";

export const send = async (sessionId: string, message: AnyMessageContent, jid: string, type: "number" | "group", options: MiscMessageGenerationOptions) => {
	try {
		const session = WhatsappService.getSession(sessionId)!;

		const validJid = await WhatsappService.validJid(session, jid, type);
		if (!validJid) return "JID does not exists";

		await updatePresence(session, WAPresence.Available, validJid);
		const result = await session.sendMessage(validJid, message, options);
		emitEvent("send.message", sessionId, { jid: validJid, result });

		return result;
	} catch (e) {
		const message = "An error occured during message send";
		logger.error(e, message);
		emitEvent(
			"send.message",
			sessionId,
			undefined,
			"error",
			message + ": " + e.message,
		);
		return { error: message };
	}
};


export const replyHandler = async (session: string, message: proto.IWebMessageInfo) => {
	try {
		logger.info("Handling reply");

		const textReceived = message.message?.conversation || "";
		const senderName = message.pushName || "Unknown";
		const senderJid = message.key.remoteJid?.replace("@s.whatsapp.net", "") || "Unknown";

		// Always send the message to the manage usage chatID
		const textToSend: AnyMessageContent = { text: `${senderName} (${senderJid})\n'${textReceived}'` };
		const type = env.CHAT_ID_USAGE_MANAGER.includes("g.us") ? "group" : "number";
		await send(session, textToSend, env.CHAT_ID_USAGE_MANAGER, type, {});

		// Use the textReceived to make a decision on what to do or what to reply
		// Add your decision-making logic here

	} catch (e) {
		const errorMessage = "An error occurred in replyHandler";
		logger.error(e, errorMessage);
		emitEvent(
			"reply.handler.error",
			session,
			undefined,
			"error",
			errorMessage + ": " + e.message,
		);
	}
};



