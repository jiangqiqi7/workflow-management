// Shared helpers for API responses

/**
 * Safely parse a JSON string, returning a fallback on failure.
 * @param {string} str
 * @param {*} fallback
 * @returns {*}
 */
export function safeJsonParse(str, fallback = {}) {
	try {
		return JSON.parse(str)
	} catch (_) {
		return fallback
	}
}

/**
 * Parse the `content` field returned by business_script APIs.
 * Many endpoints wrap JSON in a string; this removes outer quotes and parses.
 * @param {any} content
 * @returns {object}
 */
export function parseBusinessScriptContent(content) {
	if (!content) return {}
	if (typeof content === 'object' && content !== null) return content

	const text = String(content).trim()

	// First try direct JSON parse
	const obj = safeJsonParse(text, null)
	if (obj && typeof obj === 'object') {
		// Normalize keys with spaces -> underscores (e.g., "room id2" -> "room_id2")
		const normalized = {}
		Object.keys(obj).forEach((k) => {
			const nk = k.replace(/\s+/g, '_')
			normalized[nk] = obj[k]
		})
		return normalized
	}

	// Fallback: attempt to extract simple key-value pairs
	const result = {}
	const kvRegex = /"([^"]+)"\s*:\s*"([^"]*)"/g
	let match
	while ((match = kvRegex.exec(text)) !== null) {
		const rawKey = match[1]
		const value = match[2]
		// Decode unicode escapes using JSON string trick
		let decoded = value
		try {
			decoded = JSON.parse('"' + value.replace(/"/g, '\\"') + '"')
		} catch (_) {}
		const key = rawKey.replace(/\s+/g, '_')
		result[key] = decoded
	}
	return result
}

/**
 * Unwrap business_script responses that embed payload in `content` as a quoted JSON string.
 * Returns a normalized object for downstream logic.
 * @param {object} data
 * @returns {object}
 */
export function unwrapBusinessScriptResponse(data) {
	if (!data || typeof data !== 'object') return {}
	if (data.content) {
		const parsed = parseBusinessScriptContent(data.content)
		if (parsed && typeof parsed === 'object') {
			// If parsed already has code/data/message, prefer it
			return parsed
		}
	}
	return data
}

