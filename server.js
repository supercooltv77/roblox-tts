-- ServerScriptService/VoiceTTSHandler.server.lua
-- Receives transcribed text + voice ID from client,
-- calls middleman server, broadcasts audio URL back to all clients

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local HttpService = game:GetService("HttpService")

-- MIDDLEMAN SERVER URL (same as in your LocalScript)
local SERVER_URL = "https://YOUR-RAILWAY-URL.up.railway.app"

-- Create RemoteEvents
local voiceTextEvent = Instance.new("RemoteEvent")
voiceTextEvent.Name = "VoiceTextEvent"
voiceTextEvent.Parent = ReplicatedStorage

local voicePlayEvent = Instance.new("RemoteEvent")
voicePlayEvent.Name = "VoicePlayEvent"
voicePlayEvent.Parent = ReplicatedStorage

-- Listen for transcribed text from any client
voiceTextEvent.OnServerEvent:Connect(function(player, text, voiceId)
	-- Sanitize
	if typeof(text) ~= "string" or #text > 300 then return end
	if typeof(voiceId) ~= "string" or #voiceId > 50 then return end

	-- Call middleman server
	local success, result = pcall(function()
		local response = HttpService:RequestAsync({
			Url = SERVER_URL .. "/tts",
			Method = "POST",
			Headers = { ["Content-Type"] = "application/json" },
			Body = HttpService:JSONEncode({
				text = text,
				voiceId = voiceId,
				playerId = player.UserId
			})
		})
		return HttpService:JSONDecode(response.Body)
	end)

	if success and result and result.audioUrl then
		-- Broadcast audio URL + which player spoke to ALL clients
		voicePlayEvent:FireAllClients(player.UserId, result.audioUrl, player.Name)
	else
		warn("TTS server error for player:", player.Name, result)
	end
end)
