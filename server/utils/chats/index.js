const { v4: uuidv4 } = require("uuid");
const { WorkspaceChats } = require("../../models/workspaceChats");
const { resetMemory } = require("./commands/reset");
const { generateImage } = require("./commands/img");
const { convertToPromptHistory } = require("../helpers/chat/responses");
const { SlashCommandPresets } = require("../../models/slashCommandsPresets");
const { SystemPromptVariables } = require("../../models/systemPromptVariables");

const VALID_COMMANDS = {
  "/reset": resetMemory,
  "/img": generateImage,
};

/**
 * Checks if a command exactly matches a built-in system command (eg: /reset)
 * so a preset cannot shadow it. Commands that merely extend a built-in name
 * (eg: /reset-all) are valid user-defined presets.
 * @param {string} command - the formatted command to check (eg: /reset)
 * @returns {boolean}
 */
function isReservedCommand(command = "") {
  return Object.keys(VALID_COMMANDS).includes(String(command).toLowerCase());
}

async function grepCommand(message, user = null) {
  const userPresets = await SlashCommandPresets.getUserPresets(user?.id);
  const availableCommands = Object.keys(VALID_COMMANDS);

  // Check if the message starts with any built-in command. Like the preset
  // matching below, require the command to not be part of a longer command
  // (e.g. don't match /reset in /reset-all) so preset commands that extend a
  // built-in name are not hijacked.
  for (let i = 0; i < availableCommands.length; i++) {
    const cmd = availableCommands[i];
    const re = new RegExp(`^(${cmd})(?![a-z0-9_-])`, "i");
    if (re.test(message)) {
      return cmd;
    }
  }

  // Replace all preset commands with their corresponding prompts
  // Allows multiple commands in one message
  let updatedMessage = message;
  for (const preset of userPresets) {
    // Match the command when it starts the message or follows a space (`lead`),
    // and is not part of a longer command (e.g. don't match /weather in /weatherman).
    // `lead` is captured so we can keep the space when swapping in the prompt.
    const regex = new RegExp(`(^|\\s)(${preset.command})(?![a-z0-9_-])`, "g");
    updatedMessage = updatedMessage.replace(
      regex,
      (_match, lead) => `${lead}${preset.prompt}`
    );
  }

  return updatedMessage;
}

/**
 * @description This function will do recursive replacement of all slash commands with their corresponding prompts.
 * @notice This function is used for API calls and is not user-scoped. THIS FUNCTION DOES NOT SUPPORT PRESET COMMANDS.
 * @returns {Promise<string>}
 */
async function grepAllSlashCommands(message) {
  const allPresets = await SlashCommandPresets.where({});

  // Replace all preset commands with their corresponding prompts
  // Allows multiple commands in one message
  let updatedMessage = message;
  for (const preset of allPresets) {
    // Match the command when it starts the message or follows a space (`lead`),
    // and is not part of a longer command (e.g. don't match /weather in /weatherman).
    // `lead` is captured so we can keep the space when swapping in the prompt.
    const regex = new RegExp(`(^|\\s)(${preset.command})(?![a-z0-9_-])`, "g");
    updatedMessage = updatedMessage.replace(
      regex,
      (_match, lead) => `${lead}${preset.prompt}`
    );
  }

  return updatedMessage;
}

async function recentChatHistory({
  user = null,
  workspace,
  thread = null,
  messageLimit = 20,
  apiSessionId = null,
}) {
  const rawHistory = (
    await WorkspaceChats.where(
      {
        workspaceId: workspace.id,
        user_id: user?.id || null,
        thread_id: thread?.id || null,
        api_session_id: apiSessionId || null,
        include: true,
      },
      messageLimit,
      { id: "desc" }
    )
  ).reverse();
  return { rawHistory, chatHistory: convertToPromptHistory(rawHistory) };
}

/**
 * Returns the base prompt for the chat with memories appended (when enabled).
 * Also does variable substitution on the prompt if there are any defined variables.
 * @param {Object|null} workspace - the workspace object
 * @param {Object|null} user - the user object
 * @param {{prompt?: string, rawHistory?: object[]}} [opts] - current user message + chat history, used for reranking injected memories
 * @returns {Promise<string>}
 */
async function chatPrompt(workspace, user = null, opts = {}) {
  const { SystemSettings } = require("../../models/systemSettings");
  const { promptWithMemories } = require("../memories");
  const defaultCareerPrompt = "You are AI Career Assistant, an expert AI career mentor and resume analyst.\n\nCORE OPERATING DIRECTIVES FOR MAXIMUM ACCURACY & PRECISION:\n1. CONTEXT & FACT STRICTNESS: Thoroughly inspect all attached documents, uploaded resumes, and user context. Extract candidate facts (candidate name, education, exact technical stack, tools, years of experience, projects) with 100% precision. Never invent non-existent experience.\n2. QUESTION-SPECIFIC GUIDANCE: If the user asks a specific question (e.g., interview question prep, specific skill review, salary negotiation, portfolio idea), answer THAT exact question first, personalized using their resume details.\n3. FULL RESUME EVALUATION: When asked to analyze a resume or provide comprehensive guidance, structure your answer into these 6 categories:\n  01. Profile & Strengths Summary 📄: Detailed breakdown of education, tech stack, soft skills, and experience level.\n  02. ATS & Formatting Feedback 🎯: Evaluate resume structure, strong action verbs, ATS readability score (0-100%), and missing high-impact keywords.\n  03. Target Roles & Suitability 💼: Top 3 matching career paths with clear profile fit justifications.\n  04. Skill Gap & Learning Plan 🗺️: Detailed missing skills and a structured 30/60/90-day learning roadmap.\n  05. Recommended Projects & Portfolio 💡: 2-3 high-impact portfolio project ideas with recommended tech stack.\n  06. Action Plan & Next Steps 🚀: Immediate 7-day action checklist and top 3 mock interview questions with sample answers.\n4. QUANTIFIED ACHIEVEMENTS: Guide the user to rewrite bullet points using the XYZ formula (Accomplished [X] measured by [Y] by doing [Z]).\n5. FORMATTING: Clean Markdown formatting with bold headers, emojis, clear bullet points, and 2 interactive follow-up suggestions.";
  const basePrompt =
    workspace?.openAiPrompt && workspace.openAiPrompt.trim().length > 0
      ? workspace.openAiPrompt
      : defaultCareerPrompt;
  const systemPrompt = await SystemPromptVariables.expandSystemPromptVariables(
    basePrompt,
    user?.id,
    workspace?.id
  );
  return promptWithMemories({
    systemPrompt,
    userId: user?.id ?? null,
    workspaceId: workspace?.id,
    prompt: opts.prompt ?? "",
    rawHistory: opts.rawHistory ?? [],
  });
}

// We use this util function to deduplicate sources from similarity searching
// if the document is already pinned.
// Eg: You pin a csv, if we RAG + full-text that you will get the same data
// points both in the full-text and possibly from RAG - result in bad results
// even if the LLM was not even going to hallucinate.
function sourceIdentifier(sourceDocument) {
  if (!sourceDocument?.title || !sourceDocument?.published) return uuidv4();
  return `title:${sourceDocument.title}-timestamp:${sourceDocument.published}`;
}

module.exports = {
  sourceIdentifier,
  recentChatHistory,
  chatPrompt,
  grepCommand,
  grepAllSlashCommands,
  isReservedCommand,
  VALID_COMMANDS,
};
