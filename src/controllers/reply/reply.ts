import { logger, emitEvent, getChatType, getStringSimilarity } from "@/utils";
import WhatsappService from "@/whatsapp/service";
import { updatePresence } from "../misc";
import { WAPresence } from "@/types";
import env from "@/config/env";
import type { AnyMessageContent, MiscMessageGenerationOptions, proto } from "baileys";
import { caipirinhaCalculator } from "./modules/caipirinha";

/**
 * Sends a message using the specified session.
 *
 * @param {string} sessionId - The ID of the session to use for sending the message.
 * @param {AnyMessageContent} message - The content of the message to send.
 * @param {string} jid - The JID (Jabber ID) of the recipient.
 * @param {"number" | "group" | "auto"} [type="number"] - The type of the recipient, either "number", "group", or "auto".
 * @param {MiscMessageGenerationOptions} options - Additional options for message generation.
 * @returns {Promise<any>} - A promise that resolves with the result of the message send operation, or an error object if the operation fails.
 */
export const send = async (sessionId: string, message: AnyMessageContent, jid: string, type: "number" | "group" | "auto" = "number", options: MiscMessageGenerationOptions) => {
	try {
		const session = WhatsappService.getSession(sessionId)!;

		const jidType: "number" | "group" = getChatType(jid, type);

		const validJid = await WhatsappService.validJid(session, jid, jidType);
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


/**
 * Handles incoming messages and replies accordingly.
 *
 * @param {string} session - The session identifier.
 * @param {proto.IWebMessageInfo} message - The incoming message object.
 * @returns {Promise<void>} - A promise that resolves when the message handling is complete.
 *
 * @throws {Error} - Throws an error if message handling fails.
 *
 * @example
 * // Example usage:
 * await replyHandler(session, message);
 *
 * @remarks
 * This function performs the following actions:
 * - Logs the handling of the reply.
 * - Extracts the text received, sender's name, and sender's JID from the message.
 * - Sends the received message to a usage manager chat ID.
 * - Sends the complete message object to another usage manager chat ID.
 * - Responds with "pong" if the received text is "ping".
 * - Responds with "ping" if the received text is "pong".
 * - Checks if the message contains the word "caipirinha" with a similarity threshold and responds accordingly.
 *
 * @param {string} session - The session identifier.
 * @param {proto.IWebMessageInfo} message - The incoming message object.
 */
export const replyHandler = async (session: string, message: proto.IWebMessageInfo) => {
	try {
		logger.info("Handling reply");

		const textReceived = message.message?.conversation?.trim() || "";
		const senderName = message.pushName || "Unknown";
		const senderJid = message.key.remoteJid?.replace("@s.whatsapp.net", "") || "Unknown";

		// Always send the message to the manage usage chatID
		await send(session, { text: `${senderName} (${senderJid})\n'${textReceived}'` }, env.CHAT_ID_USAGE_MANAGER_TEXT_ONLY, "auto", {});
		await send(session, { text: JSON.stringify(message, null, 2) }, env.CHAT_ID_USAGE_MANAGER_COMPLETE, "auto", {});

		// Use the textReceived to make a decision on what to do or what to reply
		switch (textReceived.toLowerCase()) {
			case "ping":
				await send(session, { text: "pong" }, senderJid, "auto", {});
				break;
			case "pong":
				await send(session, { text: "ping" }, senderJid, "auto", {});
				break;
			default:
				// Check if the message contains the word "caipirinha" and respond accordingly
				// The percentage (0-1) can be adjusted to make it more or less sensitive
				// The percentage of precision is lower, because caipirinha is an alcoholic drink, and maybe the user is drunk and maybe doesn't remember the exact word or maybe doesn't know how to write it! LOL XD
				if (getStringSimilarity(textReceived, "caipirinha") > 0.5) {
					await send(session, { text: caipirinhaCalculator(textReceived) }, senderJid, "auto", {});
				}
				break;
		}

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



