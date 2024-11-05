// agent.ts

//Dependencies
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { dedent } from "ts-dedent";
import dotenv from "dotenv";

//Project specific imports
import { wrapWithExecutionScope } from "./tools-as-code-tool";
import { provideAnswerTool } from "./user-input-tool";
import { getCurrentUserTool, getUserPhoneNumberTool } from "./my-secret-tool";
import { StructuredToolInterface } from "@langchain/core/tools";

dotenv.config();

const model = new ChatAnthropic({
  modelName: "claude-3-5-sonnet-20241022", // Specify a capable model
  temperature: 0,
  verbose: true,
});

const allTheRealTools = [getCurrentUserTool, getUserPhoneNumberTool];

function getSmartTools(tools: StructuredToolInterface[]) {
  return [
    wrapWithExecutionScope({
      tools: [...tools, provideAnswerTool({ callback: (a) => console.log(a) })],
    }),
  ];
}

async function performTask(tools: StructuredToolInterface[]) {
  const agent = createReactAgent({
    llm: model,
    tools,
  });

  const taskDescription = dedent`fetch me the phone number of the current user`;
  const messages = [new HumanMessage(taskDescription)];
  const response = await agent.invoke({ messages });
  console.log(response);
}

async function compare() {
  await performTask(allTheRealTools).catch(console.error);
  await performTask(getSmartTools(allTheRealTools)).catch(console.error);
}

compare().catch(console.error);
