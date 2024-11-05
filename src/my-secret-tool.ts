import { tool, Tool } from "@langchain/core/tools";
import { z } from "zod";

export const getCurrentUserTool = tool(
  async () => {
    return "123";
  },
  {
    name: "getCurrentUserId",
    description: "Get the current user id. the id is a string",
    schema: z.void(),
  }
);

export const getUserPhoneNumberTool = tool(async ({ userId }) => "555-12345", {
  name: "getUserPhoneNumber",
  description:
    "Get the user's phone number. if the user does not exist - this returns null",
  schema: z.object({ userId: z.string() }),
});
