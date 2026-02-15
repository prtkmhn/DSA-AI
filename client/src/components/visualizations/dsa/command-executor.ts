// =============================================================================
// DSA Command Executor
// Parses and executes AI-generated visualization commands
// =============================================================================

export type VisualizerType = "stack" | "queue" | "linked-list" | "array" | "binary-tree";

export interface DSACommand {
  type: VisualizerType;
  action: string;
  args: (string | number)[];
  message?: string;
}

export interface CommandSequence {
  visualizerType: VisualizerType;
  initialState?: (string | number)[];
  commands: DSACommand[];
}

// Parse a command string like "stack_push(5)" or "queue_enqueue(10)"
export function parseCommand(commandStr: string): DSACommand | null {
  // Match patterns like: type_action(args) or type.action(args)
  const match = commandStr.match(/^(\w+)[_.](\w+)\((.*)\)$/);
  if (!match) return null;

  const [, typeStr, action, argsStr] = match;
  const type = normalizeType(typeStr);
  if (!type) return null;

  const args = argsStr
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => {
      // Try parsing as number first
      const num = Number(s);
      if (!isNaN(num)) return num;
      // Remove quotes if string
      return s.replace(/^["']|["']$/g, "");
    });

  return { type, action, args };
}

// Parse a sequence of commands from AI output
export function parseCommandSequence(input: string | string[] | object): CommandSequence | null {
  // Handle different input formats
  if (typeof input === "string") {
    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(input);
      return parseCommandSequence(parsed);
    } catch {
      // Parse as newline/semicolon separated commands
      const lines = input
        .split(/[;\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (lines.length === 0) return null;

      const commands: DSACommand[] = [];
      let visualizerType: VisualizerType = "array";
      let initialState: (string | number)[] | undefined;

      for (const line of lines) {
        // Check for init command
        const initMatch = line.match(/^(\w+)_init\((.*)\)$/);
        if (initMatch) {
          const [, typeStr, argsStr] = initMatch;
          visualizerType = normalizeType(typeStr) || "array";
          initialState = parseArrayArgs(argsStr);
          continue;
        }

        const cmd = parseCommand(line);
        if (cmd) {
          visualizerType = cmd.type;
          commands.push(cmd);
        }
      }

      return { visualizerType, initialState, commands };
    }
  }

  if (Array.isArray(input)) {
    // Array of command strings or command objects
    const commands: DSACommand[] = [];
    let visualizerType: VisualizerType = "array";
    let initialState: (string | number)[] | undefined;

    for (const item of input) {
      if (typeof item === "string") {
        const initMatch = item.match(/^(\w+)_init\((.*)\)$/);
        if (initMatch) {
          const [, typeStr, argsStr] = initMatch;
          visualizerType = normalizeType(typeStr) || "array";
          initialState = parseArrayArgs(argsStr);
          continue;
        }

        const cmd = parseCommand(item);
        if (cmd) {
          visualizerType = cmd.type;
          commands.push(cmd);
        }
      } else if (typeof item === "object" && item !== null) {
        const cmd = item as DSACommand;
        if (cmd.type && cmd.action) {
          visualizerType = cmd.type;
          commands.push(cmd);
        }
      }
    }

    return { visualizerType, initialState, commands };
  }

  // Handle object format
  if (typeof input === "object" && input !== null) {
    const obj = input as Record<string, any>;

    // Check if it's already a CommandSequence
    if (obj.visualizerType && obj.commands) {
      return obj as CommandSequence;
    }

    // Check for visualization commands array
    if (obj.visualizationCommands) {
      return parseCommandSequence(obj.visualizationCommands);
    }

    // Check for steps array
    if (obj.steps) {
      return parseCommandSequence(obj.steps);
    }
  }

  return null;
}

function normalizeType(typeStr: string): VisualizerType | null {
  const normalized = typeStr.toLowerCase();

  const typeMap: Record<string, VisualizerType> = {
    stack: "stack",
    queue: "queue",
    linkedlist: "linked-list",
    "linked-list": "linked-list",
    list: "linked-list",
    array: "array",
    arr: "array",
    tree: "binary-tree",
    binarytree: "binary-tree",
    "binary-tree": "binary-tree",
    bst: "binary-tree",
  };

  return typeMap[normalized] || null;
}

function parseArrayArgs(argsStr: string): (string | number)[] {
  // Handle array notation like [1,2,3] or just 1,2,3
  const cleaned = argsStr.replace(/^\[|\]$/g, "").trim();
  if (!cleaned) return [];

  return cleaned.split(",").map((s) => {
    const trimmed = s.trim();
    const num = Number(trimmed);
    if (!isNaN(num)) return num;
    return trimmed.replace(/^["']|["']$/g, "");
  });
}

// =============================================================================
// Command Execution Helpers
// =============================================================================

export interface ExecutionContext {
  stack?: {
    push: (value: number | string) => Promise<void>;
    pop: () => Promise<void>;
    peek: () => void;
    clear: () => void;
    initialize: (values: (number | string)[]) => void;
  };
  queue?: {
    enqueue: (value: number | string) => Promise<void>;
    dequeue: () => Promise<void>;
    peekFront: () => void;
    clear: () => void;
    initialize: (values: (number | string)[]) => void;
  };
  linkedList?: {
    insertFront: (value: number | string) => Promise<void>;
    insertBack: (value: number | string) => Promise<void>;
    deleteFront: () => Promise<void>;
    deleteBack: () => Promise<void>;
    clear: () => void;
    initialize: (values: (number | string)[]) => void;
  };
}

export async function executeCommand(
  command: DSACommand,
  context: ExecutionContext
): Promise<void> {
  const { type, action, args } = command;

  switch (type) {
    case "stack":
      if (!context.stack) throw new Error("Stack context not available");
      switch (action.toLowerCase()) {
        case "push":
          if (args.length > 0) await context.stack.push(args[0]);
          break;
        case "pop":
          await context.stack.pop();
          break;
        case "peek":
          context.stack.peek();
          break;
        case "clear":
          context.stack.clear();
          break;
        case "init":
        case "initialize":
          context.stack.initialize(args);
          break;
      }
      break;

    case "queue":
      if (!context.queue) throw new Error("Queue context not available");
      switch (action.toLowerCase()) {
        case "enqueue":
        case "add":
        case "offer":
          if (args.length > 0) await context.queue.enqueue(args[0]);
          break;
        case "dequeue":
        case "remove":
        case "poll":
          await context.queue.dequeue();
          break;
        case "peek":
        case "front":
          context.queue.peekFront();
          break;
        case "clear":
          context.queue.clear();
          break;
        case "init":
        case "initialize":
          context.queue.initialize(args);
          break;
      }
      break;

    case "linked-list":
      if (!context.linkedList) throw new Error("LinkedList context not available");
      switch (action.toLowerCase()) {
        case "insertfront":
        case "prepend":
        case "addfront":
          if (args.length > 0) await context.linkedList.insertFront(args[0]);
          break;
        case "insertback":
        case "append":
        case "addback":
        case "add":
          if (args.length > 0) await context.linkedList.insertBack(args[0]);
          break;
        case "deletefront":
        case "removefront":
          await context.linkedList.deleteFront();
          break;
        case "deleteback":
        case "removeback":
          await context.linkedList.deleteBack();
          break;
        case "clear":
          context.linkedList.clear();
          break;
        case "init":
        case "initialize":
          context.linkedList.initialize(args);
          break;
      }
      break;
  }
}

export async function executeSequence(
  sequence: CommandSequence,
  context: ExecutionContext,
  onStep?: (index: number, command: DSACommand) => void,
  delayMs: number = 500
): Promise<void> {
  // Initialize if needed
  if (sequence.initialState) {
    switch (sequence.visualizerType) {
      case "stack":
        context.stack?.initialize(sequence.initialState);
        break;
      case "queue":
        context.queue?.initialize(sequence.initialState);
        break;
      case "linked-list":
        context.linkedList?.initialize(sequence.initialState);
        break;
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }

  // Execute commands
  for (let i = 0; i < sequence.commands.length; i++) {
    const command = sequence.commands[i];
    onStep?.(i, command);
    await executeCommand(command, context);
    await new Promise((r) => setTimeout(r, delayMs));
  }
}
