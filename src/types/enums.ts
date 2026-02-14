export enum UserRole {
  FARMER = "farmer",
  OFFICER = "officer",
}

export enum MessageSenderRole {
  FARMER = "farmer",
  OFFICER = "officer",
  BOT = "bot",
}

export enum MessageType {
  TEXT = "text",
  MEDIA = "media",
  SYSTEM = "system",
}

export enum FileType {
  IMAGE = "image",
  PDF = "pdf",
  VIDEO = "video",
}

export enum ForwardedQueryStatus {
  PENDING = "pending",
  CLAIMED = "claimed",
  ANSWERED = "answered",
  CLOSED = "closed",
}

export enum NotificationType {
  NEW_QUERY = "NEW_QUERY",
  QUERY_CLAIMED = "QUERY_CLAIMED",
  QUERY_ANSWERED = "QUERY_ANSWERED",
  SYSTEM = "SYSTEM",
}
