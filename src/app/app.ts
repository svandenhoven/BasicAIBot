import { MemoryStorage, MessageFactory, TurnContext } from "botbuilder";
import * as path from "path";
import config from "../config";
// See https://aka.ms/teams-ai-library to learn more about the Teams AI library.
import { Application, ActionPlanner, OpenAIModel, PromptManager } from "@microsoft/teams-ai";

import { DefaultAzureCredential } from "@azure/identity";

// Create AI components
const model = new OpenAIModel({
  //azureApiKey: config.azureOpenAIKey,
  azureDefaultDeployment: config.azureOpenAIDeploymentName,
  azureEndpoint: config.azureOpenAIEndpoint,
  azureADTokenProvider: async () => {
    const credential = new DefaultAzureCredential();
    const token = await credential.getToken("https://cognitiveservices.azure.com/.default");
    return token.token; 
  },

  useSystemMessages: true,
  logRequests: true,
});
const prompts = new PromptManager({
  promptsFolder: path.join(__dirname, "../prompts"),
});
const planner = new ActionPlanner({
  model,
  prompts,
  defaultPrompt: "chat",
});

// Define storage and application
const storage = new MemoryStorage();
const app = new Application({
  storage,
  ai: {
    planner,
  },
});

app.conversationUpdate("membersAdded", async (turnContext: TurnContext) => {
  const welcomeText = "How can I help you today?";
  for (const member of turnContext.activity.membersAdded) {
    if (member.id !== turnContext.activity.recipient.id) {
      await turnContext.sendActivity(MessageFactory.text(welcomeText));
    }
  }
});

export default app;
