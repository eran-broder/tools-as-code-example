import { tool, Tool } from "@langchain/core/tools";
import dedent from "ts-dedent";
import { z } from "zod";

export function provideAnswerTool(body: {
  callback: (answer: string) => void;
}) {
  return tool(
    (input) => {
      body.callback(input.answer);
      //stop the node process - I have no idea how to do this in LangChain
      process.exit();
    },
    {
      name: "provideAnswer",
      description: dedent`
      Provide the final answer to the question. 
      when this tool is available - you are encouraged to use it directly to provide the final answer - instead of just presenting it as a normal message.
      you can use it in the execution code by calling it right after you calculated the answer. no need for multiple shots`,
      schema: z.object({
        answer: z.string(),
      }),
    }
  );
}
