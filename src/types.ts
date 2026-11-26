export type Path = Array<string | number>;

export interface Issue {
  message: string;
  path: Path;
  /** Source position, resolved from the parse tree */
  offset?: number;
  length?: number;
  line?: number;
  column?: number;
}

export interface Emoji {
  id?: string | null;
  name?: string | null;
  animated?: boolean;
}

export interface UnfurledMedia {
  url: string;
}

// Components are kept loose on purpose: the renderer is defensive and the validator reports problems.
export interface Component {
  type: number;
  id?: number;
  [key: string]: any;
}

export interface Message {
  content?: string;
  flags?: number;
  username?: string;
  avatar_url?: string;
  components: Component[];
}

export const IS_COMPONENTS_V2 = 1 << 15;

export const ComponentType = {
  ActionRow: 1,
  Button: 2,
  StringSelect: 3,
  TextInput: 4,
  UserSelect: 5,
  RoleSelect: 6,
  MentionableSelect: 7,
  ChannelSelect: 8,
  Section: 9,
  TextDisplay: 10,
  Thumbnail: 11,
  MediaGallery: 12,
  File: 13,
  Separator: 14,
  Container: 17,
} as const;

export const componentNames: Record<number, string> = {
  1: "Action Row",
  2: "Button",
  3: "String Select",
  4: "Text Input",
  5: "User Select",
  6: "Role Select",
  7: "Mentionable Select",
  8: "Channel Select",
  9: "Section",
  10: "Text Display",
  11: "Thumbnail",
  12: "Media Gallery",
  13: "File",
  14: "Separator",
  17: "Container",
  18: "Label",
  19: "File Upload",
};
