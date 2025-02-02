import levenshtein from "fast-levenshtein";

/**
 * Determines the type of chat based on the provided JID (Jabber ID) and type.
 *
 * @param {string} jid - The Jabber ID of the chat.
 * @param {"number" | "group" | "auto"} type - The type of chat to determine.
 *        If "auto", the function will infer the type based on the JID.
 *        If "number" or "group", the function will return the provided type.
 * @returns {"number" | "group"} - Returns "group" if the JID includes "g.us" and type is "auto",
 *          otherwise returns "number" or the provided type.
 */
export const getChatType = (jid: string, type: "number" | "group" | "auto"): "number" | "group" => {
	if (type === "auto") return jid.includes("g.us") ? "group" : "number";
	return type;
};

/**
 * Calculates the similarity between two strings using the Levenshtein distance.
 *
 * @param a - The first string to compare.
 * @param b - The second string to compare.
 * @returns A number between 0 and 1 representing the similarity between the two strings,
 * where 1 means the strings are identical and 0 means they are completely different.
 */
export const getStringSimilarity = (a: string, b: string): number => {
	if (a.length === 0 && b.length === 0) return 1;
	if (a.length === 0 || b.length === 0) return 0;

	const distance = levenshtein.get(a, b);
	const maxLength = Math.max(a.length, b.length);
	return 1 - distance / maxLength;
};
