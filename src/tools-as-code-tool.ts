import { z } from "zod";
import { dedent } from "ts-dedent";
import { StructuredToolInterface, tool } from "@langchain/core/tools";

import { DynamicStructuredTool } from "langchain/tools"; // Importing the LangChain Tool type
import zodToJsonSchema from "zod-to-json-schema";

function zodToJson(zodSchema: z.ZodType<any>) {
  const schema = zodToJsonSchema(zodSchema, { target: "openApi3" });
  return schema;
}

function generateFunctionForTool(tool: StructuredToolInterface): Function {
  return async (arg: any) => tool.invoke(arg);
}

export function wrapWithExecutionScope(body: {
  tools: StructuredToolInterface[];
}) {
  const { tools } = body;

  // Map tools to functions
  const mappedFunctions = tools.map((t) => ({
    name: t.name,
    func: generateFunctionForTool(t),
  }));

  // Create an object where keys are tool names and values are their functions
  const toolObject = mappedFunctions.reduce((acc, curr) => {
    acc[curr.name] = curr.func;
    return acc;
  }, {} as { [key: string]: Function });

  // Function to describe each tool
  function describeTool(t: StructuredToolInterface) {
    const argsSchema = t.schema
      ? JSON.stringify(zodToJson(t.schema))
      : "No arguments";
    return `tools.${t.name} - ${t.description} - Arguments: ${argsSchema}`;
  }

  // Define the execution tool compatible with LangChain
  const executionTool = tool(
    async ({ code }) => {
      const functionCode = dedent`
        return (async () => {${code}})();
        `;
      console.log(functionCode);

      const argsToFunction = ["tools"];
      const func = new Function(...argsToFunction, functionCode);
      const result = await func(toolObject);
      return result;
    },
    {
      name: "execution-logic",
      description: dedent`call this tool with code in JS you wish to execute. 
        you can access the following in the context of the code - using the 'tools' prefix:
        ${tools.map(describeTool).join("\n")}
        for example, if you have a tool called "add" call it by using "await tools.add({a: 1, b: 2})".            
        dont forget to use await if you want to wait for the results of the internal tools.
        if you wish to evaluate muliple values - return them as an array.
        Do not forget to use an explicit return statement.
        the code you provie is wrapped as follows:
        return (async () => {\${your-code}})();        
        remember - if you wish to evaluate a value - you MUST return it.
        I allow you to ponder your steps withing comment blocks in the code.
        try to achive the final result with minimum steps possible.
        PAY ATTENTION : These tools are NOT available for direct tool calls. they can only be invoked by the execution tool.
        if you can - try and provide the final answer by invoking the right tool directly.`,
      schema: z.object({ code: z.string() }),
    }
  );

  return executionTool;
}
