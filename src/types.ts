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

export interface EmbedMedia {
  url?: string;
  width?: number;
  height?: number;
}

export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface Embed {
  title?: string;
  type?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number | null;
  footer?: { text: string; icon_url?: string };
  image?: EmbedMedia;
  thumbnail?: EmbedMedia;
  author?: { name: string; url?: string; icon_url?: string };
  fields?: EmbedField[];
}

export interface Message {
  content?: string;
  embeds?: Embed[];
  flags?: number;
  username?: string;
  avatar_url?: string;
  components: Component[];
}

export const MessageFlags = {
  SuppressEmbeds: 1 << 2,
  Ephemeral: 1 << 6,
  SuppressNotifications: 1 << 12,
  IsComponentsV2: 1 << 15,
} as const;

export const IS_COMPONENTS_V2 = MessageFlags.IsComponentsV2;

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
