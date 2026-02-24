import { EventEmitter } from "events";

const eventEmitter = new EventEmitter();

export const EVENTS = {
  FILE_UPLOADED: "file:uploaded",
};

export default eventEmitter;
